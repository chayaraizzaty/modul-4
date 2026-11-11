import { errorResponse, json } from "../../../../lib/api-utils";
import { handleCleaningServiceApi } from "../../../../lib/api/cleaning-service";

type RouteContext = { params: Promise<{ resource: string[] }> };

async function dispatch(request: Request, context: RouteContext) {
  try {
    const { resource } = await context.params;
    if (resource.length !== 1) {
      return json({ error: "Endpoint Cleaning Service tidak ditemukan.", code: "NOT_FOUND" }, 404);
    }
    const valid = ["dashboard", "schedules", "facility-reports"];
    if (!valid.includes(resource[0])) {
      return json({ error: "Endpoint Cleaning Service tidak ditemukan.", code: "NOT_FOUND" }, 404);
    }
    return await handleCleaningServiceApi(
      request,
      resource[0] as Parameters<typeof handleCleaningServiceApi>[1],
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = dispatch;
export const POST = dispatch;
