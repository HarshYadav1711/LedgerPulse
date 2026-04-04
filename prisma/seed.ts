import { PrismaClient, RecordType, Role } from "../src/generated/prisma-client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const ROUNDS = 12;

async function main() {
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("DemoPass123", ROUNDS);

  const admin = await prisma.user.create({
    data: {
      email: "admin@demo.local",
      passwordHash,
      role: Role.admin,
    },
  });
  const analyst = await prisma.user.create({
    data: {
      email: "analyst@demo.local",
      passwordHash,
      role: Role.analyst,
    },
  });
  const viewer = await prisma.user.create({
    data: {
      email: "viewer@demo.local",
      passwordHash,
      role: Role.viewer,
    },
  });

  const mid = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

  await prisma.financialRecord.createMany({
    data: [
      {
        amount: 5200,
        type: RecordType.income,
        category: "Salary",
        date: mid(2026, 1, 1),
        notes: "January pay",
        createdById: admin.id,
      },
      {
        amount: 120.5,
        type: RecordType.expense,
        category: "Utilities",
        date: mid(2026, 1, 5),
        notes: "Electric bill",
        createdById: admin.id,
      },
      {
        amount: 89.99,
        type: RecordType.expense,
        category: "Groceries",
        date: mid(2026, 1, 8),
        notes: "Weekly shop",
        createdById: analyst.id,
      },
      {
        amount: 250,
        type: RecordType.income,
        category: "Freelance",
        date: mid(2026, 1, 12),
        notes: "Side project",
        createdById: analyst.id,
      },
      {
        amount: 45,
        type: RecordType.expense,
        category: "Transport",
        date: mid(2026, 1, 14),
        notes: null,
        createdById: viewer.id,
      },
      {
        amount: 3100,
        type: RecordType.income,
        category: "Salary",
        date: mid(2026, 2, 1),
        notes: "February pay",
        createdById: admin.id,
      },
      {
        amount: 200,
        type: RecordType.expense,
        category: "Healthcare",
        date: mid(2026, 2, 3),
        notes: "Pharmacy",
        createdById: admin.id,
      },
      {
        amount: 15.25,
        type: RecordType.expense,
        category: "Groceries",
        date: mid(2026, 2, 10),
        notes: "Snacks",
        createdById: viewer.id,
      },
    ],
  });

  console.info("Seed complete: admin@demo.local, analyst@demo.local, viewer@demo.local (password: DemoPass123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
