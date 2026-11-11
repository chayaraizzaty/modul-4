import { handleAdminApi } from "../../../lib/api/admin";
import { getSessionActor } from "../../../lib/auth";
import { errorResponse } from "../../../lib/api-utils";

async function dispatch(request: Request) {
  try {
    await getSessionActor("admin");
    return await handleAdminApi(request, "payments");
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = dispatch;
export const POST = dispatch;