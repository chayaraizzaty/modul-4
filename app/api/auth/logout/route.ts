import { NextResponse } from "next/server";
import { clearedSessionCookieOptions } from "../../../../lib/auth";

export async function POST() {
  const response = NextResponse.json({ message: "Sesi berhasil diakhiri." });
  response.cookies.set("piai_session", "", clearedSessionCookieOptions());
  return response;
}
