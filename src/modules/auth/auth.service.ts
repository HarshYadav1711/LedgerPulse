import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { loadEnv } from "../../config/env";
import { prisma } from "../../db/prisma";
import { AppError } from "../../errors/AppError";
import type { LoginBody, RegisterBody } from "./auth.schemas";

const TOKEN_TTL_SEC = 60 * 60 * 24 * 7;

function bcryptRounds(): number {
  const n = Number(process.env.BCRYPT_ROUNDS);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 12;
}

function signAccessToken(userId: string): string {
  const { JWT_SECRET } = loadEnv();
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL_SEC });
}

export function toPublicUser(row: {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function registerUser(input: RegisterBody) {
  const passwordHash = await bcrypt.hash(input.password, bcryptRounds());
  try {
    const existingCount = await prisma.user.count();
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: existingCount === 0 ? Role.admin : Role.viewer,
      },
    });
    const token = signAccessToken(user.id);
    return {
      token,
      user: toPublicUser(user),
    };
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
  const match = await bcrypt.compare(input.password, user.passwordHash);
  if (!match) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }
  if (!user.isActive) {
    throw new AppError(403, "Account is deactivated", "USER_INACTIVE");
  }
  const token = signAccessToken(user.id);
  return {
    token,
    user: toPublicUser(user),
  };
}
