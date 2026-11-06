import prisma from "../lib/prisma";

export const expirePoints = async () => {
  const result = await prisma.user.updateMany({
    where: { pointExpiryDate: { lte: new Date() } },
    data: { totalPoints: 0, pointExpiryDate: null },
  });

  return result.count;
};
