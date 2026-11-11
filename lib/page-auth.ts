import "server-only";
import { redirect } from "next/navigation";
import { ApiError } from "./api-utils";
import { getSessionActor, type GymRole, type SessionActor } from "./auth";

export async function requirePageRole(role: GymRole): Promise<SessionActor> {
  try {
    return await getSessionActor(role);
  } catch (error) {
    if (error instanceof ApiError && [401, 403].includes(error.status)) {
      redirect(`/${role}/login`);
    }
    throw error;
  }
}
