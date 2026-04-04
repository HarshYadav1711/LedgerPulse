import { execSync } from "child_process";
import path from "path";
import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/db/prisma";

const app = createApp();

beforeAll(() => {
  execSync("npx prisma migrate deploy", {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    env: process.env,
  });
});

beforeEach(async () => {
  await prisma.ledgerEntry.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("LedgerPulse API", () => {
  it("returns JSON health", async () => {
    const res = await request(app).get("/api/health").expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
  });

  it("registers, logs in, and fetches /me", async () => {
    const reg = await request(app)
      .post("/api/auth/register")
      .send({
        email: "u@example.com",
        password: "password1",
        name: "User",
      })
      .expect(201);
    expect(reg.body.success).toBe(true);
    expect(reg.body.data.token).toBeDefined();

    const me = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${reg.body.data.token}`)
      .expect(200);
    expect(me.body.data.email).toBe("u@example.com");

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "u@example.com", password: "password1" })
      .expect(200);
    expect(login.body.data.token).toBeDefined();
  });

  it("returns 401 without token for protected routes", async () => {
    const res = await request(app).get("/api/me").expect(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("CRUD entries and summary", async () => {
    const reg = await request(app)
      .post("/api/auth/register")
      .send({
        email: "ledger@example.com",
        password: "password1",
        name: "Ledger",
      })
      .expect(201);
    const token = reg.body.data.token as string;

    const created = await request(app)
      .post("/api/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 100,
        type: "CREDIT",
        description: "Pay",
        occurredAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
      })
      .expect(201);
    const id = created.body.data.id as string;

    await request(app)
      .post("/api/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 40,
        type: "DEBIT",
        description: "Expense",
        occurredAt: new Date("2026-01-02T00:00:00.000Z").toISOString(),
      })
      .expect(201);

    const list = await request(app)
      .get("/api/entries")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(list.body.data.items.length).toBe(2);

    const sum = await request(app)
      .get("/api/summary")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(sum.body.data.balance).toBe("60");

    const patch = await request(app)
      .patch(`/api/entries/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 120 })
      .expect(200);
    expect(patch.body.data.amount).toBe("120");

    const sum2 = await request(app)
      .get("/api/summary")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(sum2.body.data.balance).toBe("80");

    await request(app)
      .delete(`/api/entries/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const sum3 = await request(app)
      .get("/api/summary")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(sum3.body.data.entryCount).toBe(1);
  });

  it("exports CSV", async () => {
    const reg = await request(app)
      .post("/api/auth/register")
      .send({
        email: "csv@example.com",
        password: "password1",
        name: "CSV",
      })
      .expect(201);
    const token = reg.body.data.token as string;

    await request(app)
      .post("/api/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 10,
        type: "CREDIT",
        description: "A",
        occurredAt: new Date().toISOString(),
      })
      .expect(201);

    const res = await request(app)
      .get("/api/exports/entries")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.text).toContain("amount");
    expect(res.text).toContain("CREDIT");
  });
});
