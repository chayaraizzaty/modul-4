import { randomBytes } from "node:crypto";
import { ApiError } from "./api-utils";

export function newId(prefix: string, maximumLength: number) {
  const suffixLength = maximumLength - prefix.length;
  if (suffixLength < 6) {
    throw new Error("ID prefix leaves too little room for a random identifier.");
  }
  return `${prefix}${randomBytes(16).toString("hex").slice(0, suffixLength).toUpperCase()}`;
}

export async function createWithUniqueId<T>(
  prefix: string,
  maximumLength: number,
  create: (id: string) => Promise<T>,
) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await create(newId(prefix, maximumLength));
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }
  throw new ApiError("Tidak dapat membuat ID unik setelah beberapa percobaan.", 503, "ID_EXHAUSTED");
}
