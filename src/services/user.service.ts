import { AppError } from "../errors/AppError";
import { prisma } from "../db/prisma";
import { toPublicUser } from "./auth.service";

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }
  return toPublicUser(user);
}
