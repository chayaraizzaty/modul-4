import { getSessionActor } from "../auth";
import { ApiError, errorResponse, json, reportDateRange } from "../api-utils";
import { prisma } from "../prisma";

type Report = "revenue" | "facilities" | "attendance" | "registrations";

function methodNotAllowed() {
  return json({ error: "Metode tidak diizinkan.", code: "METHOD_NOT_ALLOWED" }, 405);
}

export async function handleOwnerApi(request: Request, resource: string[]) {
  try {
    await getSessionActor("owner");
    const method = request.method;
    if (resource.length === 1 && resource[0] === "dashboard" && method === "GET") {
      const today = new Date();
      const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      const [
        memberCount,
        paidTransactions,
        activeMemberships,
        attendanceCount,
        facilityReportCount,
      ] = await Promise.all([
        prisma.member.count(),
        prisma.transaksi.aggregate({
          where: { status_bayar: "Lunas" },
          _sum: { jumlah_bayar: true },
          _count: { _all: true },
        }),
        prisma.transaksi.count({
          where: {
            status_bayar: "Lunas",
            tgl_mulai: { lte: start },
            tgl_berakhir: { gte: start },
          },
        }),
        prisma.check_in.count(),
        prisma.laporan_fasilitas.count(),
      ]);
      return json({
        memberCount,
        paidTransactionCount: paidTransactions._count._all,
        verifiedRevenue: paidTransactions._sum.jumlah_bayar?.toString() ?? "0",
        activeMemberships,
        attendanceCount,
        facilityReportCount,
      });
    }

    if (resource[0] !== "reports" || resource.length !== 2 || method !== "GET") {
      return methodNotAllowed();
    }
    const reportName = resource[1];
    if (!["revenue", "facilities", "attendance", "registrations"].includes(reportName)) {
      throw new ApiError("Jenis laporan tidak ditemukan.", 404, "REPORT_NOT_FOUND");
    }
    const report = reportName as Report;
    const { startDate, endDate } = reportDateRange(new URL(request.url));

    if (report === "revenue") {
      const [aggregate, transactions] = await Promise.all([
        prisma.transaksi.aggregate({
          where: {
            status_bayar: "Lunas",
            tgl_transaksi: { gte: startDate, lte: endDate },
          },
          _sum: { jumlah_bayar: true },
          _count: { _all: true },
        }),
        prisma.transaksi.findMany({
          where: {
            tgl_transaksi: { gte: startDate, lte: endDate },
          },
          select: {
            id_transaksi: true,
            tgl_transaksi: true,
            jenis_transaksi: true,
            metode_bayar: true,
            jumlah_bayar: true,
            status_bayar: true,
            jenis_member: { select: { nama_jenis: true } },
            member: { include: { users: { select: { nama: true } } } },
          },
          orderBy: [{ tgl_transaksi: "desc" }, { id_transaksi: "desc" }],
        }),
      ]);
      return json({
        report,
        period: { startDate, endDate },
        total: aggregate._sum.jumlah_bayar?.toString() ?? "0",
        count: aggregate._count._all,
        data: transactions,
      });
    }

    if (report === "facilities") {
      const data = await prisma.laporan_fasilitas.findMany({
        where: { tgl_laporan: { gte: startDate, lte: endDate } },
        include: { cs: { include: { users: { select: { nama: true } } } } },
        orderBy: { tgl_laporan: "desc" },
      });
      return json({ report, period: { startDate, endDate }, count: data.length, data });
    }

    if (report === "attendance") {
      const data = await prisma.check_in.findMany({
        where: { tgl_checkin: { gte: startDate, lte: endDate } },
        include: {
          member: {
            include: {
              users: { select: { nama: true } },
              kartu_member: {
                orderBy: { id_kartu: "asc" },
                select: { id_kartu: true },
              },
            },
          },
        },
        orderBy: [{ tgl_checkin: "desc" }, { jam_checkin: "desc" }],
      });
      return json({ report, period: { startDate, endDate }, count: data.length, data });
    }

    const data = await prisma.transaksi.findMany({
      where: {
        jenis_transaksi: "Pendaftaran",
        tgl_transaksi: { gte: startDate, lte: endDate },
      },
      include: {
        member: { include: { users: { select: { nama: true } } } },
        jenis_member: { select: { nama_jenis: true } },
      },
      orderBy: { tgl_transaksi: "desc" },
    });
    return json({ report, period: { startDate, endDate }, count: data.length, data });
  } catch (error) {
    return errorResponse(error);
  }
}
