import type { Role } from "../../db/client";
import { prisma } from "../../db/prisma";
import { AppError } from "../../errors/AppError";
import { toPublicUser } from "../auth/auth.service";
import type { ListUsersQuery, UpdateUserBody } from "./users.schemas";
import type { AuthUser } from "../../authz/types";

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "User not found", "NOT_FOUND");
  }
  return toPublicUser(user);
}

export async function listUsers(query: ListUsersQuery) {
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: query.limit,
      skip: query.offset,
    }),
    prisma.user.count(),
  ]);
  return {
    items: items.map(toPublicUser),
    total,
    limit: query.limit,
    offset: query.offset,
  };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, "User not found", "NOT_FOUND");
  }
  return toPublicUser(user);
}

export async function updateUser(actor: AuthUser, targetId: string, input: UpdateUserBody) {
  if (targetId === actor.id && input.isActive === false) {
    throw new AppError(403, "You cannot deactivate your own account", "FORBIDDEN");
  }

  const existing = await prisma.user.findUnique({ where: { id: targetId } });
  if (!existing) {
    throw new AppError(404, "User not found", "NOT_FOUND");
  }

  const data: { role?: Role; isActive?: boolean } = {};
  if (input.role !== undefined) {
    data.role = input.role;
  }
  if (input.isActive !== undefined) {
    data.isActive = input.isActive;
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data,
  });
  return toPublicUser(updated);
}
