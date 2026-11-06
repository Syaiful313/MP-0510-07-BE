import { TransactionStatus } from "../generated/prisma/client";
import prisma from "./prisma";

const UNCONFIRMED_TRANSACTION_AGE_MS = 3 * 24 * 60 * 60 * 1000;

export const expireTransactions = async () => {
  const now = new Date();
  const expiredTransactions = await prisma.transaction.findMany({
    where: {
      status: TransactionStatus.WAITING_FOR_PAYMENT,
      expiresAt: { lt: now },
    },
    select: {
      id: true,
      userId: true,
      eventId: true,
      couponId: true,
      pointsUsed: true,
      quantity: true,
    },
  });
  let expiredCount = 0;

  for (const transaction of expiredTransactions) {
    const didExpire = await prisma.$transaction(async (tx) => {
      // Claim the transaction by status so overlapping runs cannot restore resources twice.
      const updated = await tx.transaction.updateMany({
        where: {
          id: transaction.id,
          status: TransactionStatus.WAITING_FOR_PAYMENT,
          expiresAt: { lt: now },
        },
        data: { status: TransactionStatus.EXPIRED },
      });

      if (!updated.count) return false;

      await tx.event.update({
        where: { id: transaction.eventId },
        data: { avaliableSeats: { increment: transaction.quantity } },
      });

      if (transaction.pointsUsed > 0) {
        await tx.user.update({
          where: { id: transaction.userId },
          data: { totalPoints: { increment: transaction.pointsUsed } },
        });
      }

      if (transaction.couponId) {
        await tx.coupon.update({
          where: { id: transaction.couponId },
          data: { isUsed: false },
        });
      }

      return true;
    });

    if (didExpire) expiredCount += 1;
  }

  return expiredCount;
};

export const cancelUnconfirmedTransactions = async () => {
  const cutoff = new Date(Date.now() - UNCONFIRMED_TRANSACTION_AGE_MS);
  const unconfirmedTransactions = await prisma.transaction.findMany({
    where: {
      status: TransactionStatus.WAITING_FOR_ADMIN_CONFIRMATION,
      createdAt: { lt: cutoff },
    },
    select: {
      id: true,
      userId: true,
      eventId: true,
      couponId: true,
      pointsUsed: true,
      quantity: true,
    },
  });
  let canceledCount = 0;

  for (const transaction of unconfirmedTransactions) {
    const didCancel = await prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.updateMany({
        where: {
          id: transaction.id,
          status: TransactionStatus.WAITING_FOR_ADMIN_CONFIRMATION,
          createdAt: { lt: cutoff },
        },
        data: { status: TransactionStatus.CANCELED },
      });

      if (!updated.count) return false;

      await tx.event.update({
        where: { id: transaction.eventId },
        data: { avaliableSeats: { increment: transaction.quantity } },
      });

      if (transaction.pointsUsed > 0) {
        await tx.user.update({
          where: { id: transaction.userId },
          data: { totalPoints: { increment: transaction.pointsUsed } },
        });
      }

      if (transaction.couponId) {
        await tx.coupon.update({
          where: { id: transaction.couponId },
          data: { isUsed: false },
        });
      }

      return true;
    });

    if (didCancel) canceledCount += 1;
  }

  return canceledCount;
};

export const runTransactionCleanup = async () => {
  const [expired, canceled] = await Promise.all([
    expireTransactions(),
    cancelUnconfirmedTransactions(),
  ]);

  return { expired, canceled };
};
