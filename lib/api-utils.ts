import { Prisma } from "../app/generated/prisma/client";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return json({ error: error.message, code: error.code }, error.status);
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return json(
      { error: "Data dengan nilai tersebut sudah terdaftar.", code: "CONFLICT" },
      409,
    );
  }

  console.error("API request failed:", error);
  return json(
    { error: "Terjadi kesalahan saat memproses permintaan.", code: "INTERNAL_ERROR" },
    500,
  );
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new ApiError("Body JSON tidak valid.", 400, "INVALID_JSON");
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ApiError("Body permintaan harus berupa objek JSON.", 400, "INVALID_BODY");
  }

  return value as Record<string, unknown>;
}

export function requiredText(
  body: Record<string, unknown>,
  field: string,
  maxLength: number,
) {
  const value = body[field];
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
    throw new ApiError(
      `${field} wajib diisi dan maksimal ${maxLength} karakter.`,
      400,
      "INVALID_FIELD",
    );
  }
  return value.trim();
}

export function optionalText(
  body: Record<string, unknown>,
  field: string,
  maxLength: number,
) {
  const value = body[field];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.trim().length > maxLength) {
    throw new ApiError(`${field} maksimal ${maxLength} karakter.`, 400, "INVALID_FIELD");
  }
  return value.trim();
}

export function requiredDate(body: Record<string, unknown>, field: string) {
  const value = requiredText(body, field, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError(`${field} harus menggunakan format YYYY-MM-DD.`, 400, "INVALID_DATE");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new ApiError(`${field} bukan tanggal yang valid.`, 400, "INVALID_DATE");
  }
  return date;
}

export function reportDateRange(url: URL) {
  const startValue = url.searchParams.get("startDate");
  const endValue = url.searchParams.get("endDate");
  if (!startValue || !endValue) {
    throw new ApiError("startDate dan endDate wajib diisi.", 400, "INVALID_DATE_RANGE");
  }

  const startDate = requiredDate({ startDate: startValue }, "startDate");
  const endDate = requiredDate({ endDate: endValue }, "endDate");
  if (endDate < startDate) {
    throw new ApiError("endDate tidak boleh lebih awal daripada startDate.", 400, "INVALID_DATE_RANGE");
  }
  return { startDate, endDate };
}

export function dateFromToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function dateInJakartaToday() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value ?? "";
  return new Date(Date.UTC(Number(part("year")), Number(part("month")) - 1, Number(part("day"))));
}

export function timeInJakartaNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((value) => value.type === type)?.value ?? 0);
  return new Date(Date.UTC(1970, 0, 1, part("hour"), part("minute"), part("second")));
}

export function dateOnly(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}
