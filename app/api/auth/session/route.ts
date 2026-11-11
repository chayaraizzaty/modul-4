import { getSessionActor } from "../../../../lib/auth";
import { ApiError, errorResponse, json } from "../../../../lib/api-utils";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  try {
    return json({
      authenticated: true,
      user: await getSessionActor(undefined, cookieHeader),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return json({ authenticated: false }, 200);
    }
    return errorResponse(error);
  }
}
