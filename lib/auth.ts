import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { ApiError } from "./api-utils";
import { prisma } from "./prisma";

const COOKIE_NAME = "piai_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const SCRYPT_BYTES = 64;
const scrypt = promisify(scryptCallback);

export type GymRole = "admin" | "owner" | "customer" | "cleaning-service";

export type SessionActor = {
  id: string;
  name: string;
  username: string;
  role: GymRole;
  profileId: string | null;
};

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new ApiError(
      "SESSION_SECRET belum dikonfigurasi dengan aman.",
      503,
      "SESSION_NOT_CONFIGURED",
    );
  }
  return secret;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = (await scrypt(password, salt, SCRYPT_BYTES)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, saltHex, hashHex, ...extra] = stored.split("$");
  if (algorithm !== "scrypt" || !saltHex || !hashHex || extra.length) {
    const provided = Buffer.from(password);
    const legacy = Buffer.from(stored);
    return (
      provided.length === legacy.length &&
      timingSafeEqual(provided, legacy)
    );
  }

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  if (salt.length !== 16 || expected.length !== SCRYPT_BYTES) return false;
  const actual = (await scrypt(password, salt, SCRYPT_BYTES)) as Buffer;
  return timingSafeEqual(actual, expected);
}

export function isPasswordHash(password: string) {
  return password.startsWith("scrypt$");
}

function roleFromProfile(profile: {
  admin: { id_admin: string } | null;
  owner: { id_owner: string } | null;
  cs: { id_cs: string } | null;
  member: { id_member: string } | null;
}): { role: GymRole; profileId: string | null } {
  const profiles = [
    profile.admin && { role: "admin" as const, id: profile.admin.id_admin },
    profile.owner && { role: "owner" as const, id: profile.owner.id_owner },
    profile.cs && { role: "cleaning-service" as const, id: profile.cs.id_cs },
    profile.member && { role: "customer" as const, id: profile.member.id_member },
  ].filter((value) => value !== null);

  if (profiles.length > 1) {
    throw new ApiError("Profil akun memiliki lebih dari satu role.", 403, "INVALID_ROLE_PROFILE");
  }

  const profileValue = profiles[0];
  return profileValue
    ? { role: profileValue.role, profileId: profileValue.id }
    : { role: "customer", profileId: null };
}

export async function findActorById(id: string): Promise<SessionActor | null> {
  const user = await prisma.users.findUnique({
    where: { id_user: id },
    select: {
      id_user: true,
      nama: true,
      username: true,
      admin: { select: { id_admin: true } },
      owner: { select: { id_owner: true } },
      cs: { select: { id_cs: true } },
      member: { select: { id_member: true } },
    },
  });
  if (!user) return null;

  const { role, profileId } = roleFromProfile(user);
  return { id: user.id_user, name: user.nama, username: user.username, role, profileId };
}

export function makeSessionToken(actor: SessionActor) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: actor.id,
      role: actor.role,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
      nonce: randomBytes(12).toString("base64url"),
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string) {
  const [payload, signature, ...extra] = token.split(".");
  if (!payload || !signature || extra.length) return null;

  let expected: Buffer;
  try {
    expected = createHmac("sha256", sessionSecret()).update(payload).digest();
  } catch {
    return null;
  }
  const provided = Buffer.from(signature, "base64url");
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("sub" in parsed) ||
      typeof parsed.sub !== "string" ||
      !("role" in parsed) ||
      !isGymRole(parsed.role) ||
      !("exp" in parsed) ||
      typeof parsed.exp !== "number" ||
      parsed.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return { id: parsed.sub, role: parsed.role };
  } catch {
    return null;
  }
}

export function isGymRole(value: unknown): value is GymRole {
  return (
    value === "admin" ||
    value === "owner" ||
    value === "customer" ||
    value === "cleaning-service"
  );
}

export async function getSessionActor(expectedRole?: GymRole, cookieHeader?: string) {
  const token = cookieHeader === undefined
    ? (await cookies()).get(COOKIE_NAME)?.value
    : cookieHeader
        .split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`))
        ?.slice(COOKIE_NAME.length + 1);
  if (!token) throw new ApiError("Silakan masuk terlebih dahulu.", 401, "UNAUTHENTICATED");

  const session = verifySessionToken(token);
  if (!session) throw new ApiError("Sesi tidak valid atau telah berakhir.", 401, "INVALID_SESSION");

  const actor = await findActorById(session.id);
  if (!actor || actor.role !== session.role) {
    throw new ApiError("Sesi tidak lagi sesuai dengan profil akun.", 401, "INVALID_SESSION");
  }
  if (expectedRole && actor.role !== expectedRole) {
    throw new ApiError("Role tidak memiliki akses ke fitur ini.", 403, "FORBIDDEN");
  }
  return actor;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function clearedSessionCookieOptions() {
  return { ...sessionCookieOptions(), maxAge: 0 };
}
