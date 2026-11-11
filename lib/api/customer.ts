import { getSessionActor } from "../auth";
import {
  addDays,
  ApiError,
  dateInJakartaToday,
  dateOnly,
  errorResponse,
  json,
  optionalText,
  readJson,
  requiredDate,
  requiredText,
  timeInJakartaNow,
} from "../api-utils";
import { createWithUniqueId, newId } from "../ids";
import { prisma } from "../prisma";

type Resource =
  | "dashboard"
  | "membership"
  | "bills"
  | "payments"
  | "attendance"
  | "notifications"
  | "profile";

function methodNotAllowed() {
  return json({ error: "Metode tidak diizinkan.", code: "METHOD_NOT_ALLOWED" }, 405);
}

export async function handleCustomerApi(request: Request, resource: Resource) {
  try {
    const actor = await getSessionActor("customer");
    const member = actor.profileId
      ? await prisma.member.findUnique({ where: { id_member: actor.profileId } })
      : null;

    if (resource === "dashboard" && request.method === "GET") {
      const today = dateInJakartaToday();
      const [activeMembership, latestMembership, attendanceCount, notifications] = await Promise.all([
        member
          ? prisma.transaksi.findFirst({
              where: {
                id_member: member.id_member,
                status_bayar: "Lunas",
                tgl_mulai: { lte: today },
                tgl_berakhir: { gte: today },
              },
              include: {
                jenis_member: { select: { nama_jenis: true } },
              },
              orderBy: { tgl_berakhir: "desc" },
            })
          : null,
        member
          ? prisma.transaksi.findFirst({
              where: { id_member: member.id_member },
              include: { jenis_member: { select: { nama_jenis: true } } },
              orderBy: [{ tgl_transaksi: "desc" }, { id_transaksi: "desc" }],
            })
          : null,
        member ? prisma.check_in.count({ where: { id_member: member.id_member } }) : 0,
        member ? prisma.notifikasi.count({ where: { id_member: member.id_member } }) : 0,
      ]);
      return json({
        user: { id: actor.id, name: actor.name, username: actor.username },
        hasMemberProfile: Boolean(member),
        membership: activeMembership,
        latestMembership,
        attendanceCount,
        notificationCount: notifications,
      });
    }

    if (resource === "membership" && request.method === "GET") {
      const [types, profile] = await Promise.all([
        prisma.jenis_member.findMany({
          select: { id_jenis: true, nama_jenis: true, harga: true, durasi_hari: true },
          orderBy: { nama_jenis: "asc" },
        }),
        member
          ? prisma.member.findUnique({
              where: { id_member: member.id_member },
              include: { transaksi: { orderBy: { tgl_transaksi: "desc" }, take: 1 } },
            })
          : null,
      ]);
      return json({ types, profile });
    }

    if (resource === "membership" && request.method === "POST") {
      const body = await readJson(request);
      if (body.validateOnly !== undefined && typeof body.validateOnly !== "boolean") {
        throw new ApiError("validateOnly harus berupa boolean.", 400, "INVALID_FIELD");
      }
      if (member) {
        throw new ApiError("Akun ini sudah memiliki profil member.", 409, "MEMBER_EXISTS");
      }
      const name = requiredText(body, "name", 255);
      const gender = requiredText(body, "gender", 10);
      const phone = requiredText(body, "phone", 15);
      const address = requiredText(body, "address", 255);
      const city = requiredText(body, "city", 100);
      const membershipId = requiredText(body, "membershipId", 10);
      const registrationDate = requiredDate(body, "registrationDate");
      const today = dateInJakartaToday();
      if (registrationDate.getTime() !== today.getTime()) {
        throw new ApiError(
          "Tanggal pendaftaran harus menggunakan tanggal hari ini.",
          400,
          "INVALID_REGISTRATION_DATE",
        );
      }
      if (!["Laki-laki", "Perempuan"].includes(gender)) {
        throw new ApiError("Jenis kelamin tidak valid.", 400, "INVALID_GENDER");
      }
      const membershipType = await prisma.jenis_member.findUnique({
        where: { id_jenis: membershipId },
      });
      if (!membershipType) {
        throw new ApiError("Jenis membership tidak ditemukan.", 400, "INVALID_MEMBERSHIP");
      }
      if (body.validateOnly === true) {
        return json({
          valid: true,
          registrationDate: registrationDate.toISOString().slice(0, 10),
          checks: [
            { label: "Data wajib sudah lengkap", valid: true },
            { label: "Tanggal pendaftaran adalah hari ini", valid: true },
            { label: "Jenis membership tersedia di database", valid: true },
            { label: "Data profil sesuai kolom database", valid: true },
            { label: "Akun belum memiliki profil member", valid: true },
          ],
        });
      }

      const admin = await prisma.admin.findFirst({
        select: { id_admin: true },
        orderBy: { id_admin: "asc" },
      });
      if (!admin) {
        throw new ApiError("Belum ada Admin yang dapat menerima verifikasi.", 503, "ADMIN_NOT_CONFIGURED");
      }

      const created = await createWithUniqueId("MBR-", 10, (memberId) =>
        prisma.$transaction(async (transaction) => {
          const transactionId = newId("TRX-", 15);
          await transaction.users.update({
            where: { id_user: actor.id },
            data: { nama: name },
          });
          const createdMember = await transaction.member.create({
            data: {
              id_member: memberId,
              id_user: actor.id,
              jenis_kelamin: gender,
              no_hp: phone,
              alamat: address,
              kota: city,
            },
            include: { users: { select: { nama: true } } },
          });
          const payment = await transaction.transaksi.create({
            data: {
              id_transaksi: transactionId,
              id_member: memberId,
              id_jenis: membershipType.id_jenis,
              id_admin: admin.id_admin,
              tgl_transaksi: registrationDate,
              jenis_transaksi: "Pendaftaran",
              metode_bayar: "QRIS",
              status_bayar: "Menunggu Verifikasi",
              jumlah_bayar: membershipType.harga,
              tgl_mulai: registrationDate,
              tgl_berakhir: addDays(registrationDate, membershipType.durasi_hari),
            },
            include: { jenis_member: { select: { nama_jenis: true } } },
          });
          return { member: createdMember, payment };
        }),
      );
      return json(
        {
          data: created.member,
          payment: created.payment,
          receipt: {
            name,
            gender,
            membership: membershipType.nama_jenis,
            registrationDate: registrationDate.toISOString().slice(0, 10),
            amount: membershipType.harga.toString(),
          },
          message: "Pendaftaran berhasil disimpan. Tagihan menunggu verifikasi Admin.",
        },
        201,
      );
    }

    if (resource === "bills" && request.method === "GET") {
      const [bills, types] = await Promise.all([
        member
          ? prisma.transaksi.findMany({
              where: { id_member: member.id_member },
              include: {
                jenis_member: { select: { nama_jenis: true, harga: true } },
                member: { include: { users: { select: { nama: true } } } },
              },
              orderBy: [{ tgl_transaksi: "desc" }, { id_transaksi: "desc" }],
            })
          : [],
        prisma.jenis_member.findMany({
          select: { id_jenis: true, nama_jenis: true, harga: true, durasi_hari: true },
          orderBy: { nama_jenis: "asc" },
        }),
      ]);
      return json({
        data: bills,
        types,
        profile: { name: actor.name },
        hasMemberProfile: Boolean(member),
      });
    }

    if (resource === "payments" && request.method === "GET") {
      if (!member) return json({ data: [] });
      const payments = await prisma.transaksi.findMany({
        where: { id_member: member.id_member },
        include: { jenis_member: { select: { nama_jenis: true } } },
        orderBy: { tgl_transaksi: "desc" },
      });
      return json({ data: payments });
    }

    if (resource === "payments" && request.method === "POST") {
      if (!member) {
        throw new ApiError(
          "Profil member harus didaftarkan terlebih dahulu. Customer belum memiliki profil member.",
          409,
          "MEMBER_PROFILE_REQUIRED",
        );
      }
      const body = await readJson(request);
      const method = requiredText(body, "method", 20);
      if (!["QRIS", "Tunai"].includes(method)) {
        throw new ApiError("Metode pembayaran tidak valid.", 400, "INVALID_PAYMENT_METHOD");
      }
      const membershipId = optionalText(body, "membershipId", 10);
      const admin = await prisma.admin.findFirst({ select: { id_admin: true }, orderBy: { id_admin: "asc" } });
      if (!admin) throw new ApiError("Belum ada Admin yang dapat menerima verifikasi.", 503, "ADMIN_NOT_CONFIGURED");
      const today = dateInJakartaToday();
      const payment = await createWithUniqueId("TRX-", 15, (id) =>
        prisma.$transaction(async (transaction) => {
          await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${member.id_member}))`;
          const existing = await transaction.transaksi.findFirst({
            where: { id_member: member.id_member, status_bayar: "Menunggu Verifikasi" },
            select: { id_transaksi: true },
          });
          if (existing) {
            throw new ApiError("Masih ada tagihan yang menunggu verifikasi.", 409, "PENDING_BILL_EXISTS");
          }
          const previous = await transaction.transaksi.findFirst({
            where: { id_member: member.id_member },
            orderBy: [{ tgl_transaksi: "desc" }, { id_transaksi: "desc" }],
            select: { id_jenis: true },
          });
          const paidMembership = await transaction.transaksi.findFirst({
            where: { id_member: member.id_member, status_bayar: "Lunas" },
            select: { id_transaksi: true },
          });
          const planId = membershipId ?? previous?.id_jenis;
          if (!planId) {
            throw new ApiError("Pilih jenis membership untuk membuat tagihan.", 400, "INVALID_MEMBERSHIP");
          }
          const membershipType = await transaction.jenis_member.findUnique({
            where: { id_jenis: planId },
          });
          if (!membershipType) {
            throw new ApiError("Jenis membership tidak ditemukan.", 400, "INVALID_MEMBERSHIP");
          }
          return transaction.transaksi.create({
            data: {
              id_transaksi: id,
              id_member: member.id_member,
              id_jenis: membershipType.id_jenis,
              id_admin: admin.id_admin,
              tgl_transaksi: today,
              jenis_transaksi: paidMembership ? "Perpanjangan" : "Pendaftaran",
              metode_bayar: method,
              status_bayar: "Menunggu Verifikasi",
              jumlah_bayar: membershipType.harga,
              tgl_mulai: today,
              tgl_berakhir: addDays(today, membershipType.durasi_hari),
            },
            include: { jenis_member: { select: { nama_jenis: true } } },
          });
        }),
      );
      return json(
        {
          data: payment,
          message: "Tagihan berhasil dibuat dan menunggu verifikasi Admin. QRIS belum terintegrasi.",
        },
        201,
      );
    }

    if (resource === "attendance" && request.method === "GET") {
      if (!member) {
        return json({
          data: [],
          canCheckIn: false,
          reason: "Profil member belum tersedia.",
        });
      }
      const today = dateInJakartaToday();
      const [attendance, activeMembership, alreadyCheckedIn] = await Promise.all([
        prisma.check_in.findMany({
          where: { id_member: member.id_member },
          orderBy: [{ tgl_checkin: "desc" }, { jam_checkin: "desc" }],
        }),
        prisma.transaksi.findFirst({
          where: {
            id_member: member.id_member,
            status_bayar: "Lunas",
            tgl_mulai: { lte: today },
            tgl_berakhir: { gte: today },
          },
          select: { id_transaksi: true },
        }),
        prisma.check_in.findFirst({
          where: { id_member: member.id_member, tgl_checkin: today },
          select: { id_checkin: true },
        }),
      ]);
      return json({
        data: attendance,
        canCheckIn: Boolean(activeMembership && !alreadyCheckedIn),
        reason: !activeMembership
          ? "Membership belum aktif atau belum disetujui Admin."
          : alreadyCheckedIn
            ? "Check-in hari ini sudah tercatat."
            : null,
      });
    }

    if (resource === "attendance" && request.method === "POST") {
      if (!member) {
        throw new ApiError("Profil member belum tersedia.", 409, "MEMBER_PROFILE_REQUIRED");
      }
      const today = dateInJakartaToday();
      const activeMembership = await prisma.transaksi.findFirst({
        where: {
          id_member: member.id_member,
          status_bayar: "Lunas",
          tgl_mulai: { lte: today },
          tgl_berakhir: { gte: today },
        },
        select: { id_transaksi: true },
      });
      if (!activeMembership) {
        throw new ApiError(
          "Check-in ditolak karena membership belum aktif atau belum disetujui Admin.",
          409,
          "MEMBERSHIP_INACTIVE",
        );
      }
      const day = dateOnly(today);
      const checkIn = await createWithUniqueId("CI-", 10, (id) =>
        prisma.$transaction(async (transaction) => {
          await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${member.id_member}:${day.toISOString().slice(0, 10)}`}))`;
          const duplicate = await transaction.check_in.findFirst({
            where: { id_member: member.id_member, tgl_checkin: day },
            select: { id_checkin: true },
          });
          if (duplicate) {
            throw new ApiError("Check-in hari ini sudah tercatat.", 409, "DUPLICATE_CHECKIN");
          }
          return transaction.check_in.create({
            data: {
              id_checkin: id,
              id_member: member.id_member,
              tgl_checkin: day,
              jam_checkin: timeInJakartaNow(),
            },
          });
        }),
      );
      return json({ data: checkIn, message: "Check-in berhasil dicatat." }, 201);
    }

    if (resource === "notifications" && request.method === "GET") {
      if (!member) return json({ data: [] });
      const notifications = await prisma.notifikasi.findMany({
        where: { id_member: member.id_member },
        include: { transaksi: { select: { tgl_berakhir: true, status_bayar: true } } },
        orderBy: { id_notifikasi: "desc" },
      });
      return json({ data: notifications });
    }

    if (resource === "profile" && request.method === "GET") {
      const profile = await prisma.users.findUnique({
        where: { id_user: actor.id },
        select: {
          id_user: true,
          nama: true,
          username: true,
          member: {
            select: {
              id_member: true,
              jenis_kelamin: true,
              no_hp: true,
              alamat: true,
              kota: true,
            },
          },
        },
      });
      return json({ data: profile });
    }

    if (resource === "profile" && request.method === "PATCH") {
      const body = await readJson(request);
      const name = optionalText(body, "name", 255);
      const gender = optionalText(body, "gender", 10);
      const phone = optionalText(body, "phone", 15);
      const address = optionalText(body, "address", 255);
      const city = optionalText(body, "city", 100);
      if (![name, gender, phone, address, city].some(Boolean)) {
        throw new ApiError("Tidak ada perubahan profil yang dikirim.", 400, "EMPTY_UPDATE");
      }
      if (gender && !["Laki-laki", "Perempuan"].includes(gender)) {
        throw new ApiError("Jenis kelamin tidak valid.", 400, "INVALID_GENDER");
      }
      const updated = await prisma.$transaction(async (transaction) => {
        if (name) await transaction.users.update({ where: { id_user: actor.id }, data: { nama: name } });
        if (member && [gender, phone, address, city].some(Boolean)) {
          await transaction.member.update({
            where: { id_member: member.id_member },
            data: {
              ...(gender ? { jenis_kelamin: gender } : {}),
              ...(phone ? { no_hp: phone } : {}),
              ...(address ? { alamat: address } : {}),
              ...(city ? { kota: city } : {}),
            },
          });
        }
        return transaction.users.findUnique({
          where: { id_user: actor.id },
          select: {
            id_user: true,
            nama: true,
            username: true,
            member: { select: { id_member: true, jenis_kelamin: true, no_hp: true, alamat: true, kota: true } },
          },
        });
      });
      return json({ data: updated });
    }

    return methodNotAllowed();
  } catch (error) {
    return errorResponse(error);
  }
}
