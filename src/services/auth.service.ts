import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { loadEnv } from "../config/env";
import { AppError } from "../errors/AppError";
import { prisma } from "../db/prisma";
import type { LoginBody, RegisterBody } from "../validation/auth.schemas";
import type { JwtPayload } from "../types/jwt";

const SALT_ROUNDS = 12;
const TOKEN_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

function signToken(userId: string): string {
  const { JWT_SECRET } = loadEnv();
  const payload: JwtPayload = { sub: userId };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL_SEC });
}

export function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function registerUser(input: RegisterBody) {
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
      },
    });
    const token = signToken(user.id);
    return { user: toPublicUser(user), token };
  } catch (e: unknown) {
    const code =
      typeof e === "object" && e !== null && "code" in e
        ? (e as { code?: string }).code
        : undefined;
    if (code === "P2002") {
      throw new AppError(409, "Email is already registered", "EMAIL_TAKEN");
    }
    throw e;
  }
}

export async function loginUser(input: LoginBody) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }
  const token = signToken(user.id);
  return { user: toPublicUser(user), token };
}
