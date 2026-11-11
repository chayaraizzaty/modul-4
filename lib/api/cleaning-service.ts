import { getSessionActor } from "../auth";
import {
  ApiError,
  dateFromToday,
  errorResponse,
  json,
  requiredDate,
  requiredText,
  readJson,
} from "../api-utils";
import { createWithUniqueId } from "../ids";
import { prisma } from "../prisma";

type Resource = "dashboard" | "schedules" | "facility-reports";

function methodNotAllowed() {
  return json({ error: "Metode tidak diizinkan.", code: "METHOD_NOT_ALLOWED" }, 405);
}

export async function handleCleaningServiceApi(request: Request, resource: Resource) {
  try {
    const actor = await getSessionActor("cleaning-service");
    if (!actor.profileId) {
      throw new ApiError("Profil Cleaning Service tidak ditemukan.", 403, "ROLE_PROFILE_REQUIRED");
    }
    const csId = actor.profileId;

    if (resource === "dashboard" && request.method === "GET") {
      const [schedules, reports] = await Promise.all([
        prisma.jadwal_piket.count({
          where: { id_cs: csId, tgl_piket: { gte: dateFromToday() } },
        }),
        prisma.laporan_fasilitas.count({ where: { id_cs: csId } }),
      ]);
      return json({ upcomingSchedules: schedules, facilityReports: reports });
    }

    if (resource === "schedules" && request.method === "GET") {
      const schedules = await prisma.jadwal_piket.findMany({
        where: { id_cs: csId },
        include: {
          admin: { include: { users: { select: { nama: true } } } },
          cs: { include: { users: { select: { nama: true } } } },
        },
        orderBy: [{ tgl_piket: "asc" }, { jam_mulai: "asc" }],
      });
      return json({ data: schedules });
    }
    if (resource === "schedules") return methodNotAllowed();

    if (resource === "facility-reports" && request.method === "GET") {
      const reports = await prisma.laporan_fasilitas.findMany({
        where: { id_cs: csId },
        orderBy: { tgl_laporan: "desc" },
      });
      return json({ data: reports });
    }

    if (resource === "facility-reports" && request.method === "POST") {
      const body = await readJson(request);
      if (body.description !== undefined && body.description !== "") {
        throw new ApiError(
          "Tabel laporan_fasilitas tidak memiliki kolom deskripsi. Deskripsi tidak disimpan.",
          409,
          "SCHEMA_FIELD_UNSUPPORTED",
        );
      }
      const facility = requiredText(body, "facility", 100);
      const status = requiredText(body, "status", 30);
      const allowedStatuses = ["Baik", "Rusak", "Dalam Perbaikan"];
      if (!allowedStatuses.includes(status)) {
        throw new ApiError(
          "Status harus Baik, Rusak, atau Dalam Perbaikan.",
          400,
          "INVALID_FACILITY_STATUS",
        );
      }
      const date = body.date ? requiredDate(body, "date") : dateFromToday();
      const report = await createWithUniqueId("LF-", 10, (id) =>
        prisma.laporan_fasilitas.create({
          data: {
            id_laporan: id,
            id_cs: csId,
            nama_fasilitas: facility,
            tgl_laporan: date,
            status_laporan: status,
          },
        }),
      );
      return json({ data: report }, 201);
    }

    return methodNotAllowed();
  } catch (error) {
    return errorResponse(error);
  }
}
