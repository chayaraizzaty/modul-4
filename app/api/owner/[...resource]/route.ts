import { errorResponse } from "../../../../lib/api-utils";
import { handleOwnerApi } from "../../../../lib/api/owner";

type RouteContext = { params: Promise<{ resource: string[] }> };

async function dispatch(request: Request, context: RouteContext) {
  try {
    return await handleOwnerApi(request, (await context.params).resource);
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = dispatch;
