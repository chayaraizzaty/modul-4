import { errorResponse, json } from "../../../../lib/api-utils";
import { handleCustomerApi } from "../../../../lib/api/customer";

type RouteContext = { params: Promise<{ resource: string[] }> };

async function dispatch(request: Request, context: RouteContext) {
  try {
    const { resource } = await context.params;
    if (resource.length !== 1) {
      return json({ error: "Endpoint Customer tidak ditemukan.", code: "NOT_FOUND" }, 404);
    }
    const valid = [
      "dashboard",
      "membership",
      "bills",
      "payments",
      "attendance",
      "notifications",
      "profile",
    ];
    if (!valid.includes(resource[0])) {
      return json({ error: "Endpoint Customer tidak ditemukan.", code: "NOT_FOUND" }, 404);
    }
    return await handleCustomerApi(
      request,
      resource[0] as Parameters<typeof handleCustomerApi>[1],
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = dispatch;
export const POST = dispatch;
export const PATCH = dispatch;
