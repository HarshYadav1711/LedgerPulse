import { execSync } from "child_process";
import { randomUUID } from "crypto";
import path from "path";
import bcrypt from "bcryptjs";
import request from "supertest";
import { Role } from "../src/db/client";
import { createApp } from "../src/app";
import { prisma } from "../src/db/prisma";

jest.setTimeout(60_000);

function email(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 10)}@test.com`;
}

const app = createApp();

beforeAll(() => {
  execSync("npx prisma migrate deploy", {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    env: process.env,
  });
});

beforeEach(async () => {
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const bcryptRounds = Number(process.env.BCRYPT_ROUNDS) > 0 ? Number(process.env.BCRYPT_ROUNDS) : 12;
const hash = (p: string) => bcrypt.hash(p, bcryptRounds);

async function createUser(email: string, role: Role, password = "TestPass123") {
  return prisma.user.create({
    data: {
      email,
      passwordHash: await hash(password),
      role,
    },
  });
}

async function login(email: string, password = "TestPass123") {
  const res = await request(app).post("/api/auth/login").send({ email, password }).expect(200);
  return res.body.data.token as string;
}

describe("LedgerPulse integration", () => {
  it("GET /api/health", async () => {
    const res = await request(app).get("/api/health").expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
  });

  it("registers first user as admin and second as viewer", async () => {
    const e1 = email("a");
    const e2 = email("b");
    const r1 = await request(app).post("/api/auth/register").send({ email: e1, password: "password1" }).expect(201);
    expect(r1.body.data.user.role).toBe("admin");

    const r2 = await request(app).post("/api/auth/register").send({ email: e2, password: "password1" }).expect(201);
    expect(r2.body.data.user.role).toBe("viewer");
  });

  it("rejects duplicate registration", async () => {
    const dup = email("dup");
    await request(app).post("/api/auth/register").send({ email: dup, password: "password1" }).expect(201);
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: dup, password: "password1" })
      .expect(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
  });

  it("RBAC: viewer cannot create records or access dashboard", async () => {
    const em = email("v");
    await createUser(em, Role.viewer);
    const token = await login(em);

    await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 10,
        type: "income",
        category: "X",
        date: new Date().toISOString(),
      })
      .expect(403);

    await request(app).get("/api/dashboard/summary").set("Authorization", `Bearer ${token}`).expect(403);
  });

  it("RBAC: analyst can read dashboard but not manage users", async () => {
    const em = email("an");
    await createUser(em, Role.analyst);
    const token = await login(em);

    await request(app).get("/api/dashboard/summary").set("Authorization", `Bearer ${token}`).expect(200);

    await request(app).get("/api/users").set("Authorization", `Bearer ${token}`).expect(403);
  });

  it("RBAC: admin full record write and user list", async () => {
    const em = email("adm");
    await createUser(em, Role.admin);
    const token = await login(em);

    const created = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 100,
        type: "expense",
        category: "Office",
        date: "2026-03-15T00:00:00.000Z",
        notes: "Supplies",
      })
      .expect(201);
    const id = created.body.data.id as string;

    const users = await request(app).get("/api/users").set("Authorization", `Bearer ${token}`).expect(200);
    expect(users.body.data.items.length).toBeGreaterThanOrEqual(1);

    await request(app)
      .patch(`/api/records/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 120 })
      .expect(200);

    await request(app).delete(`/api/records/${id}`).set("Authorization", `Bearer ${token}`).expect(200);

    await request(app).get(`/api/records/${id}`).set("Authorization", `Bearer ${token}`).expect(404);
  });

  it("CRUD read: get by id and list pagination", async () => {
    const em = email("p");
    await createUser(em, Role.admin);
    const token = await login(em);

    for (let i = 0; i < 3; i++) {
      await request(app)
        .post("/api/records")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 10 + i,
          type: "income",
          category: "Cat",
          date: `2026-04-0${i + 1}T00:00:00.000Z`,
        })
        .expect(201);
    }

    const list = await request(app)
      .get("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .query({ page: 1, limit: 2 })
      .expect(200);

    expect(list.body.data.page).toBe(1);
    expect(list.body.data.limit).toBe(2);
    expect(list.body.data.total).toBe(3);
    expect(list.body.data.totalPages).toBe(2);
    expect(list.body.data.data).toHaveLength(2);

    const one = await request(app).get(`/api/records/${list.body.data.data[0].id}`).set("Authorization", `Bearer ${token}`).expect(200);
    expect(one.body.data.category).toBe("Cat");
  });

  it("filters: type, category, date range, search", async () => {
    const em = email("f");
    await createUser(em, Role.admin);
    const token = await login(em);

    await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 50,
        type: "expense",
        category: "Alpha",
        date: "2026-05-01T00:00:00.000Z",
        notes: "coffee run",
      })
      .expect(201);
    await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 200,
        type: "income",
        category: "Beta",
        date: "2026-06-01T00:00:00.000Z",
      })
      .expect(201);

    const byType = await request(app)
      .get("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .query({ type: "expense", page: 1, limit: 50 })
      .expect(200);
    expect(byType.body.data.total).toBe(1);

    const byCat = await request(app)
      .get("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .query({ category: "Beta", page: 1, limit: 50 })
      .expect(200);
    expect(byCat.body.data.total).toBe(1);

    const bySearch = await request(app)
      .get("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .query({ search: "coffee", page: 1, limit: 50 })
      .expect(200);
    expect(bySearch.body.data.total).toBe(1);

    const byRange = await request(app)
      .get("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .query({
        from: "2026-05-01T00:00:00.000Z",
        to: "2026-05-31T00:00:00.000Z",
        page: 1,
        limit: 50,
      })
      .expect(200);
    expect(byRange.body.data.total).toBe(1);
  });

  it("analytics: dashboard summary for analyst", async () => {
    const emAdm = email("dash");
    const emAn = email("dash2");
    await createUser(emAdm, Role.admin);
    await createUser(emAn, Role.analyst);
    const adminToken = await login(emAdm);
    const analystToken = await login(emAn);

    await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: 1000,
        type: "income",
        category: "Job",
        date: "2026-07-01T00:00:00.000Z",
      })
      .expect(201);
    await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: 200,
        type: "expense",
        category: "Job",
        date: "2026-07-02T00:00:00.000Z",
      })
      .expect(201);

    const sum = await request(app).get("/api/dashboard/summary").set("Authorization", `Bearer ${analystToken}`).expect(200);
    expect(sum.body.data.totals.recordCount).toBe(2);
    expect(sum.body.data.totals.totalIncome).toBe("1000");
    expect(sum.body.data.totals.totalExpense).toBe("200");

    const trends = await request(app)
      .get("/api/dashboard/trends")
      .set("Authorization", `Bearer ${analystToken}`)
      .query({ granularity: "month" })
      .expect(200);
    expect(Array.isArray(trends.body.data.buckets)).toBe(true);
  });

  it("CSV export respects filters and returns csv", async () => {
    const em = email("csv");
    await createUser(em, Role.admin);
    const token = await login(em);

    await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 99,
        type: "income",
        category: "ExportCat",
        date: "2026-08-01T00:00:00.000Z",
        notes: "row1",
      })
      .expect(201);

    const res = await request(app)
      .get("/api/records/export")
      .set("Authorization", `Bearer ${token}`)
      .query({ category: "ExportCat" })
      .expect(200);

    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.text).toContain("ExportCat");
    expect(res.text).toContain("amount");
  });

  it("GET /api/openapi.json exposes spec", async () => {
    const res = await request(app).get("/api/openapi.json").expect(200);
    expect(res.body.openapi).toBe("3.0.0");
    expect(res.body.paths["/api/health"]).toBeDefined();
  });
});
