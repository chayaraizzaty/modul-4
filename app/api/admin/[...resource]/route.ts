import { errorResponse, json } from "../../../../lib/api-utils";
import { handleAdminApi } from "../../../../lib/api/admin";

type RouteContext = { params: Promise<{ resource: string[] }> };

async function dispatch(request: Request, context: RouteContext) {
  try {
    const { resource } = await context.params;
    if (resource.length !== 1) {
      return json({ error: "Endpoint Admin tidak ditemukan.", code: "NOT_FOUND" }, 404);
    }
    const valid = [
      "dashboard",
      "members",
      "payments",
      "cards",
      "attendance",
      "notifications",
      "schedules",
    ];
    if (!valid.includes(resource[0])) {
      return json({ error: "Endpoint Admin tidak ditemukan.", code: "NOT_FOUND" }, 404);
    }
    return await handleAdminApi(request, resource[0] as Parameters<typeof handleAdminApi>[1]);
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = dispatch;
export const POST = dispatch;
export const PATCH = dispatch;
