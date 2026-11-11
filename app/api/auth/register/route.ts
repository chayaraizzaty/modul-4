import { NextResponse } from "next/server";
import { hashPassword } from "../../../../lib/auth";
import { ApiError, errorResponse, readJson, requiredText } from "../../../../lib/api-utils";
import { createWithUniqueId } from "../../../../lib/ids";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const fullName = requiredText(body, "fullName", 255);
    const username = requiredText(body, "username", 255);
    const password = requiredText(body, "password", 255);
    if (password.length < 8) {
      throw new ApiError("Password harus berisi minimal 8 karakter.", 400, "WEAK_PASSWORD");
    }

    const passwordHash = await hashPassword(password);
    const user = await createWithUniqueId("U-", 20, (id) =>
      prisma.$transaction(async (transaction) => {
        await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(lower(${username})))`;
        const duplicate = await transaction.users.findFirst({
          where: { username: { equals: username, mode: "insensitive" } },
          select: { id_user: true },
        });
        if (duplicate) {
          throw new ApiError("Username sudah digunakan. Gunakan username lain.", 409, "USERNAME_TAKEN");
        }

        return transaction.users.create({
          data: {
            id_user: id,
            nama: fullName,
            username,
            password: passwordHash,
          },
          select: { id_user: true, nama: true, username: true },
        });
      }),
    );

    return NextResponse.json(
      { user, message: "Pendaftaran akun berhasil. Silakan Sign In." },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
