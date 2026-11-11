import { NextResponse } from "next/server";
import {
  findActorById,
  isGymRole,
  isPasswordHash,
  makeSessionToken,
  sessionCookieOptions,
  verifyPassword,
  hashPassword,
} from "../../../../lib/auth";
import { ApiError, errorResponse, readJson, requiredText } from "../../../../lib/api-utils";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const username = requiredText(body, "username", 255);
    const password = requiredText(body, "password", 255);
    const requestedRole = body.role;
    if (!isGymRole(requestedRole)) {
      throw new ApiError("Role yang diminta tidak valid.", 400, "INVALID_ROLE");
    }

    const matches = await prisma.users.findMany({
      where: { username: { equals: username, mode: "insensitive" } },
      take: 2,
      select: { id_user: true, password: true },
    });
    if (matches.length !== 1) {
      throw new ApiError("Username atau password tidak valid.", 401, "INVALID_CREDENTIALS");
    }

    const user = matches[0];
    if (!(await verifyPassword(password, user.password))) {
      throw new ApiError("Username atau password tidak valid.", 401, "INVALID_CREDENTIALS");
    }

    const actor = await findActorById(user.id_user);
    if (!actor || actor.role !== requestedRole) {
      throw new ApiError("Username atau password tidak valid.", 401, "INVALID_CREDENTIALS");
    }

    if (!isPasswordHash(user.password)) {
      await prisma.users.update({
        where: { id_user: user.id_user },
        data: { password: await hashPassword(password) },
      });
    }

    const response = NextResponse.json({ user: actor });
    response.cookies.set("piai_session", makeSessionToken(actor), sessionCookieOptions());
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
