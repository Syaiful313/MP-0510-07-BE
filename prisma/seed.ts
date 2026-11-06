import "dotenv/config";
import { cloudinaryUploadFromUrl } from "../src/lib/cloudinary";
import prisma from "../src/lib/prisma";
import { hashPassword } from "../src/lib/argon";
import { generateReferralCode } from "../src/lib/referral";

const ORGANIZER_COUNT = 3;
const EVENTS_PER_ORGANIZER = 3;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const HOUR_IN_MS = 60 * 60 * 1000;

interface EventSeed {
  category: string;
  title: string;
  description: string;
  fullDescription: string;
  thumbnailSource: string;
  price: number;
  avaliableSeats: number;
  location: string;
  startsInDays: number;
  durationHours: number;
}

interface OrganizerSeed {
  fullname: string;
  email: string;
  governmentId: string;
  companyName: string;
  companyWebsite: string;
  companyAddress: string;
  companyRole: string;
  details: string;
  events: EventSeed[];
}

const organizers: OrganizerSeed[] = [
  {
    fullname: "Alya Pratama",
    email: "seed.organizer.nada@example.com",
    governmentId: "DEMO-GOV-ID-001",
    companyName: "Nada Nusantara",
    companyWebsite: "https://nada-nusantara.example.com",
    companyAddress: "Jakarta Pusat, Indonesia",
    companyRole: "Music Event Organizer",
    details: "Penyelenggara konser dan kegiatan musik lintas genre di Indonesia.",
    events: [
      {
        category: "Music",
        title: "Jazz Senja di Kota Tua",
        description: "Nikmati pertunjukan jazz menjelang malam di kawasan Kota Tua.",
        fullDescription:
          "Acara musik terbuka dengan penampil jazz lokal, area kuliner, dan sesi komunitas. Pintu dibuka satu jam sebelum acara dimulai.",
        thumbnailSource:
          "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
        price: 125000,
        avaliableSeats: 250,
        location: "Kota Tua, Jakarta",
        startsInDays: 14,
        durationHours: 4,
      },
      {
        category: "Music",
        title: "Festival Suara Nusantara",
        description: "Festival musik yang menampilkan musisi dari berbagai daerah.",
        fullDescription:
          "Satu hari penuh pertunjukan musik Indonesia dengan beberapa panggung, tenant makanan, dan area istirahat untuk pengunjung.",
        thumbnailSource:
          "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80",
        price: 185000,
        avaliableSeats: 500,
        location: "Taman Ismail Marzuki, Jakarta",
        startsInDays: 28,
        durationHours: 8,
      },
      {
        category: "Technology",
        title: "Workshop Produksi Musik Digital",
        description: "Belajar dasar produksi musik digital bersama praktisi industri.",
        fullDescription:
          "Workshop untuk pemula yang membahas alur kerja produksi musik, pengenalan perangkat lunak audio, dan praktik membuat komposisi singkat.",
        thumbnailSource:
          "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80",
        price: 90000,
        avaliableSeats: 60,
        location: "Kemang, Jakarta Selatan",
        startsInDays: 42,
        durationHours: 3,
      },
    ],
  },
  {
    fullname: "Bima Saputra",
    email: "seed.organizer.langkah@example.com",
    governmentId: "DEMO-GOV-ID-002",
    companyName: "Langkah Juara",
    companyWebsite: "https://langkah-juara.example.com",
    companyAddress: "Surabaya, Indonesia",
    companyRole: "Community Sports Organizer",
    details: "Komunitas penyelenggara kegiatan olahraga dan rekreasi masyarakat.",
    events: [
      {
        category: "Sport",
        title: "Surabaya City Fun Run",
        description: "Lari santai 5K untuk semua tingkat pengalaman.",
        fullDescription:
          "Peserta akan mengikuti rute 5K dengan water station, petugas rute, dan area pemanasan. Paket peserta mencakup nomor dada dan medali finisher.",
        thumbnailSource:
          "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1200&q=80",
        price: 75000,
        avaliableSeats: 400,
        location: "Taman Bungkul, Surabaya",
        startsInDays: 12,
        durationHours: 3,
      },
      {
        category: "Sport",
        title: "Turnamen Basket Komunitas",
        description: "Turnamen basket sehari untuk tim komunitas lokal.",
        fullDescription:
          "Pertandingan menggunakan sistem gugur dengan wasit resmi, jadwal pertandingan, dan area penonton. Setiap tim mendaftarkan satu slot peserta.",
        thumbnailSource:
          "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
        price: 150000,
        avaliableSeats: 120,
        location: "Gor Basket Kertajaya, Surabaya",
        startsInDays: 26,
        durationHours: 7,
      },
      {
        category: "Sport",
        title: "Yoga Pagi di Taman Kota",
        description: "Sesi yoga pemula di ruang terbuka bersama instruktur.",
        fullDescription:
          "Sesi latihan mencakup peregangan, gerakan dasar, dan relaksasi. Peserta membawa matras sendiri dan hadir sebelum sesi dimulai.",
        thumbnailSource:
          "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80",
        price: 50000,
        avaliableSeats: 80,
        location: "Taman Prestasi, Surabaya",
        startsInDays: 39,
        durationHours: 2,
      },
    ],
  },
  {
    fullname: "Citra Maharani",
    email: "seed.organizer.ruang@example.com",
    governmentId: "DEMO-GOV-ID-003",
    companyName: "Ruang Kreatif Indonesia",
    companyWebsite: "https://ruang-kreatif.example.com",
    companyAddress: "Bandung, Indonesia",
    companyRole: "Creative Event Organizer",
    details: "Penyelenggara pameran, kelas kreatif, dan acara komunitas.",
    events: [
      {
        category: "Art",
        title: "Pameran Seni Kota Bandung",
        description: "Pameran karya seniman muda dari Bandung dan sekitarnya.",
        fullDescription:
          "Pameran menampilkan karya visual, instalasi, dan sesi bincang bersama seniman. Pengunjung dapat datang selama jam operasional acara.",
        thumbnailSource:
          "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=80",
        price: 45000,
        avaliableSeats: 180,
        location: "Bandung Creative Hub, Bandung",
        startsInDays: 18,
        durationHours: 6,
      },
      {
        category: "Business",
        title: "Meetup Wirausaha Kreatif",
        description: "Diskusi dan jejaring untuk pelaku usaha kreatif pemula.",
        fullDescription:
          "Sesi berbagi pengalaman mengenai validasi ide, pemasaran, dan pengelolaan usaha kreatif, dilanjutkan dengan sesi jejaring peserta.",
        thumbnailSource:
          "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
        price: 65000,
        avaliableSeats: 100,
        location: "Dago, Bandung",
        startsInDays: 32,
        durationHours: 4,
      },
      {
        category: "Science",
        title: "Sains Seru untuk Keluarga",
        description: "Kegiatan eksperimen sains sederhana untuk anak dan keluarga.",
        fullDescription:
          "Peserta mengikuti beberapa aktivitas sains interaktif dengan pendamping fasilitator. Anak-anak harus didampingi orang dewasa selama acara.",
        thumbnailSource:
          "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
        price: 55000,
        avaliableSeats: 90,
        location: "Gedung Indonesia Menggugat, Bandung",
        startsInDays: 47,
        durationHours: 3,
      },
    ],
  },
];

async function seedUser(organizer: OrganizerSeed, passwordHash: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email: organizer.email },
  });

  if (existingUser) {
    if (existingUser.role !== "ORGANIZER") {
      throw new Error(`Seed email is already used by a non-organizer: ${organizer.email}`);
    }
    return existingUser;
  }

  return prisma.user.create({
    data: {
      email: organizer.email,
      fullname: organizer.fullname,
      password: passwordHash,
      profilePicture: null,
      referralCode: generateReferralCode(),
      role: "ORGANIZER",
      totalPoints: 0,
      pointExpiryDate: null,
      isDeleted: false,
    },
  });
}

async function seedOrganizer(userId: number, seed: OrganizerSeed) {
  const existingOrganizer = await prisma.organizer.findUnique({
    where: { userId },
  });

  if (existingOrganizer) {
    if (existingOrganizer.companyName !== seed.companyName) {
      throw new Error(`Seed user has a different organizer profile: ${seed.email}`);
    }
    return;
  }

  await prisma.organizer.create({
    data: {
      userId,
      governmentId: seed.governmentId,
      companyName: seed.companyName,
      companyWebsite: seed.companyWebsite,
      companyAddress: seed.companyAddress,
      companyRole: seed.companyRole,
      details: seed.details,
      acceptedAt: new Date(),
    },
  });
}

async function seedEvent(userId: number, seed: EventSeed) {
  const existingEvent = await prisma.event.findFirst({
    where: { userId, title: seed.title },
    select: { id: true },
  });

  if (existingEvent) return;

  const publicId = `seed-events/${userId}-${seed.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;
  const { secure_url: thumbnail } = await cloudinaryUploadFromUrl(
    seed.thumbnailSource,
    publicId,
  );

  const startDate = new Date(Date.now() + seed.startsInDays * DAY_IN_MS);

  await prisma.event.create({
    data: {
      userId,
      category: seed.category,
      title: seed.title,
      description: seed.description,
      full_description: seed.fullDescription,
      thumbnail,
      price: seed.price,
      startDate,
      endDate: new Date(startDate.getTime() + seed.durationHours * HOUR_IN_MS),
      avaliableSeats: seed.avaliableSeats,
      location: seed.location,
    },
  });
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Sample organizer seed is disabled in production.");
  }

  if (organizers.length !== ORGANIZER_COUNT) {
    throw new Error(`Seed must define exactly ${ORGANIZER_COUNT} organizers.`);
  }
  if (organizers.some(({ events }) => events.length !== EVENTS_PER_ORGANIZER)) {
    throw new Error(`Each seed organizer must have exactly ${EVENTS_PER_ORGANIZER} events.`);
  }

  const seedPassword = process.env.SEED_ORGANIZER_PASSWORD;
  if (!seedPassword || seedPassword.length < 8) {
    throw new Error("SEED_ORGANIZER_PASSWORD must contain at least 8 characters.");
  }

  const passwordHash = await hashPassword(seedPassword);

  for (const organizer of organizers) {
    const user = await seedUser(organizer, passwordHash);
    await seedOrganizer(user.id, organizer);

    for (const event of organizer.events) {
      await seedEvent(user.id, event);
    }
  }

  console.log(`Seeded ${ORGANIZER_COUNT} organizers and ${ORGANIZER_COUNT * EVENTS_PER_ORGANIZER} events. No transactions were created.`);
}

async function run() {
  try {
    await main();
  } catch (error) {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void run();
