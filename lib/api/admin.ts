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
import { createWithUniqueId } from "../ids";
import { prisma } from "../prisma";

type Resource = "dashboard" | "members" | "payments" | "cards" | "attendance" | "notifications" | "schedules";

function methodNotAllowed() {
  return json({ error: "Metode tidak diizinkan.", code: "METHOD_NOT_ALLOWED" }, 405);
}

async function memberByName(name: string) {
  const matches = await prisma.member.findMany({
    where: { users: { nama: { equals: name, mode: "insensitive" } } },
    select: { id_member: true, users: { select: { nama: true, username: true } } },
    take: 2,
  });
  if (matches.length !== 1) {
    throw new ApiError(
      matches.length ? "Nama member tidak unik; gunakan ID member." : "Member tidak ditemukan.",
      matches.length ? 409 : 404,
      matches.length ? "AMBIGUOUS_MEMBER" : "MEMBER_NOT_FOUND",
    );
  }
  return matches[0];
}

export async function handleAdminApi(request: Request, resource: Resource) {
  try {
    const actor = await getSessionActor("admin");
    const adminId = actor.profileId;
    if (!adminId) throw new ApiError("Profil Admin tidak ditemukan.", 403, "ROLE_PROFILE_REQUIRED");
    const url = new URL(request.url);

    if (resource === "dashboard" && request.method === "GET") {
      const today = dateInJakartaToday();
      const [members, activeMembers, payments, pendingPayments, cards, todayAttendance, schedules] =
        await Promise.all([
          prisma.member.count(),
          prisma.transaksi.count({
            where: {
              status_bayar: "Lunas",
              tgl_mulai: { lte: today },
              tgl_berakhir: { gte: today },
            },
          }),
          prisma.transaksi.count({ where: { status_bayar: "Lunas" } }),
          prisma.transaksi.count({ where: { status_bayar: "Menunggu Verifikasi" } }),
          prisma.kartu_member.count(),
          prisma.check_in.count({ where: { tgl_checkin: today } }),
          prisma.jadwal_piket.count(),
        ]);
      return json({ members, activeMembers, payments, pendingPayments, cards, todayAttendance, schedules });
    }

    if (resource === "members" && request.method === "GET") {
      const search = optionalText(
        Object.fromEntries(url.searchParams.entries()),
        "search",
        255,
      );
      const [members, types] = await Promise.all([prisma.member.findMany({
        where: search
          ? {
              OR: [
                { id_member: { contains: search, mode: "insensitive" } },
                { users: { nama: { contains: search, mode: "insensitive" } } },
              ],
            }
          : undefined,
        include: {
          users: { select: { nama: true, username: true } },
          kartu_member: { select: { id_kartu: true, status_kartu: true } },
          transaksi: {
            orderBy: { tgl_transaksi: "desc" },
            take: 1,
            select: {
              status_bayar: true,
              tgl_transaksi: true,
              tgl_mulai: true,
              tgl_berakhir: true,
              jenis_member: { select: { nama_jenis: true } },
            },
          },
        },
        orderBy: { id_member: "asc" },
      }), prisma.jenis_member.findMany({
        select: { id_jenis: true, nama_jenis: true, harga: true, durasi_hari: true },
        orderBy: { nama_jenis: "asc" },
      })]);
      return json({ data: members, types });
    }

    if (resource === "members" && request.method === "POST") {
      const body = await readJson(request);
      const name = requiredText(body, "name", 255);
      const gender = requiredText(body, "gender", 10);
      if (!["Laki-laki", "Perempuan"].includes(gender)) {
        throw new ApiError("Jenis kelamin tidak valid.", 400, "INVALID_GENDER");
      }
      const phone = requiredText(body, "phone", 15);
      const address = requiredText(body, "address", 255);
      const city = requiredText(body, "city", 100);
      const membershipType = requiredText(body, "membershipType", 30);
      const userMatches = await prisma.users.findMany({
        where: { nama: { equals: name, mode: "insensitive" } },
        select: {
          id_user: true,
          nama: true,
          admin: { select: { id_admin: true } },
          owner: { select: { id_owner: true } },
          cs: { select: { id_cs: true } },
          member: { select: { id_member: true } },
        },
        take: 2,
      });
      if (userMatches.length !== 1) {
        throw new ApiError(
          "Member harus lebih dulu memiliki akun Customer dengan nama yang unik.",
          userMatches.length ? 409 : 404,
          "CUSTOMER_ACCOUNT_REQUIRED",
        );
      }
      const user = userMatches[0];
      if (user.admin || user.owner || user.cs) {
        throw new ApiError("Akun tersebut bukan akun Customer.", 409, "CUSTOMER_ACCOUNT_REQUIRED");
      }
      if (await prisma.member.findUnique({ where: { id_user: user.id_user } })) {
        throw new ApiError("Akun tersebut sudah terdaftar sebagai member.", 409, "MEMBER_EXISTS");
      }
      const membership = await prisma.jenis_member.findFirst({
        where: { nama_jenis: { equals: membershipType, mode: "insensitive" } },
        select: { id_jenis: true },
      });
      if (!membership) throw new ApiError("Jenis membership tidak ditemukan.", 400, "INVALID_MEMBERSHIP");

      const member = await createWithUniqueId("MBR-", 10, (id) =>
        prisma.member.create({
          data: {
            id_member: id,
            id_user: user.id_user,
            jenis_kelamin: gender,
            no_hp: phone,
            alamat: address,
            kota: city,
          },
          include: { users: { select: { nama: true } } },
        }),
      );
      return json({ data: member, membershipId: membership.id_jenis }, 201);
    }

    if (resource === "payments" && request.method === "GET") {
      const [payments, types] = await Promise.all([
        prisma.transaksi.findMany({
          include: {
            member: { include: { users: { select: { nama: true } } } },
            jenis_member: { select: { nama_jenis: true, harga: true } },
            admin: { include: { users: { select: { nama: true } } } },
          },
          orderBy: [{ tgl_transaksi: "desc" }, { id_transaksi: "desc" }],
        }),
        prisma.jenis_member.findMany({
          select: { id_jenis: true, nama_jenis: true, harga: true, durasi_hari: true },
          orderBy: { nama_jenis: "asc" },
        }),
      ]);
      return json({ data: payments, types });
    }

    if (resource === "payments" && request.method === "POST") {
      const body = await readJson(request);
      const transactionId = optionalText(body, "transactionId", 15);
      if (transactionId) {
        const decision = body.decision === undefined ? "approve" : requiredText(body, "decision", 10);
        if (decision !== "approve" && decision !== "reject") {
          throw new ApiError("Keputusan pembayaran tidak valid.", 400, "INVALID_PAYMENT_DECISION");
        }
        const transaction = await prisma.transaksi.findUnique({
          where: { id_transaksi: transactionId },
          select: {
            id_transaksi: true,
            id_member: true,
            id_jenis: true,
            status_bayar: true,
            jumlah_bayar: true,
            jenis_member: { select: { durasi_hari: true } },
          },
        });
        if (!transaction) throw new ApiError("Transaksi tidak ditemukan.", 404, "TRANSACTION_NOT_FOUND");
        if (transaction.status_bayar !== "Menunggu Verifikasi") {
          throw new ApiError("Transaksi tidak lagi menunggu verifikasi.", 409, "PAYMENT_ALREADY_REVIEWED");
        }
        if (transaction.jumlah_bayar.lte(0)) {
          throw new ApiError("Nominal transaksi harus lebih besar dari nol.", 400, "INVALID_AMOUNT");
        }
        const today = dateInJakartaToday();
        let updated;
        if (decision === "reject") {
          const result = await prisma.transaksi.updateMany({
            where: {
              id_transaksi: transactionId,
              status_bayar: "Menunggu Verifikasi",
            },
            data: { status_bayar: "Ditolak", id_admin: adminId },
          });
          if (result.count !== 1) {
            throw new ApiError("Transaksi sudah diproses Admin lain.", 409, "PAYMENT_ALREADY_REVIEWED");
          }
          updated = await prisma.transaksi.findUniqueOrThrow({
            where: { id_transaksi: transactionId },
          });
        } else {
          const previousPaidMembership = await prisma.transaksi.findFirst({
            where: {
              id_member: transaction.id_member,
              status_bayar: "Lunas",
              id_transaksi: { not: transactionId },
            },
            orderBy: [{ tgl_berakhir: "desc" }, { id_transaksi: "desc" }],
            select: { tgl_berakhir: true },
          });
          const nextStart =
            previousPaidMembership && previousPaidMembership.tgl_berakhir >= today
              ? addDays(previousPaidMembership.tgl_berakhir, 1)
              : today;
          const result = await prisma.transaksi.updateMany({
            where: {
              id_transaksi: transactionId,
              status_bayar: "Menunggu Verifikasi",
            },
            data: {
              status_bayar: "Lunas",
              id_admin: adminId,
              tgl_mulai: nextStart,
              tgl_berakhir: addDays(nextStart, transaction.jenis_member.durasi_hari),
            },
          });
          if (result.count !== 1) {
            throw new ApiError("Transaksi sudah diproses Admin lain.", 409, "PAYMENT_ALREADY_REVIEWED");
          }
          updated = await prisma.transaksi.findUniqueOrThrow({
            where: { id_transaksi: transactionId },
          });
        }
        return json({ data: updated });
      }

      const memberName = requiredText(body, "memberName", 255);
      const paymentType = requiredText(body, "paymentType", 30);
      const paymentMethod = requiredText(body, "paymentMethod", 20);
      if (!["QRIS", "Tunai"].includes(paymentMethod)) {
        throw new ApiError("Metode pembayaran tidak valid.", 400, "INVALID_PAYMENT_METHOD");
      }
      const amountValue = body.amount;
      const amount = typeof amountValue === "number" ? amountValue : Number(amountValue);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new ApiError("Nominal pembayaran harus lebih besar dari nol.", 400, "INVALID_AMOUNT");
      }
      const member = await memberByName(memberName);
      const membership = await prisma.jenis_member.findFirst({
        where: { nama_jenis: { equals: paymentType, mode: "insensitive" } },
      });
      if (!membership) throw new ApiError("Jenis membership tidak ditemukan.", 400, "INVALID_MEMBERSHIP");
      if (membership.harga.toNumber() !== amount) {
        throw new ApiError("Nominal pembayaran harus sama dengan harga dari database.", 400, "AMOUNT_MISMATCH");
      }

      const start = dateInJakartaToday();
      const created = await createWithUniqueId("TRX-", 15, (id) =>
        prisma.transaksi.create({
          data: {
            id_transaksi: id,
            id_member: member.id_member,
            id_jenis: membership.id_jenis,
            id_admin: adminId,
            tgl_transaksi: start,
            jenis_transaksi: "Pendaftaran",
            metode_bayar: paymentMethod,
            status_bayar: "Lunas",
            jumlah_bayar: membership.harga,
            tgl_mulai: start,
            tgl_berakhir: addDays(start, membership.durasi_hari),
          },
        }),
      );
      return json({ data: created }, 201);
    }

    if (resource === "cards" && request.method === "GET") {
      const cardId = url.searchParams.get("cardId");
      const memberName = url.searchParams.get("memberName");
      if (memberName) {
        const member = await memberByName(memberName);
        const today = dateInJakartaToday();
        const [activeMembership, existingCard] = await Promise.all([
          prisma.transaksi.findFirst({
            where: {
              id_member: member.id_member,
              status_bayar: "Lunas",
              tgl_mulai: { lte: today },
              tgl_berakhir: { gte: today },
            },
            select: { id_transaksi: true },
          }),
          prisma.kartu_member.findFirst({
            where: { id_member: member.id_member },
            select: { id_kartu: true, status_kartu: true },
          }),
        ]);
        return json({
          eligible: Boolean(activeMembership),
          existingCard,
          member,
        });
      }
      const cards = await prisma.kartu_member.findMany({
        where: cardId ? { id_kartu: cardId } : undefined,
        include: {
          member: {
            include: {
              users: { select: { nama: true } },
              transaksi: {
                where: {
                  status_bayar: "Lunas",
                  tgl_mulai: { lte: dateInJakartaToday() },
                  tgl_berakhir: { gte: dateInJakartaToday() },
                },
                take: 1,
                select: { id_transaksi: true },
              },
            },
          },
          admin: { include: { users: { select: { nama: true } } } },
        },
        orderBy: { id_kartu: "asc" },
      });
      return json({ data: cards });
    }

    if (resource === "cards" && request.method === "POST") {
      const body = await readJson(request);
      const memberName = requiredText(body, "memberName", 255);
      const cardId = optionalText(body, "cardId", 10);
      const member = await memberByName(memberName);
      const today = dateInJakartaToday();
      const paid = await prisma.transaksi.findFirst({
        where: {
          id_member: member.id_member,
          status_bayar: "Lunas",
          tgl_mulai: { lte: today },
          tgl_berakhir: { gte: today },
        },
      });
      if (!paid) throw new ApiError("Membership belum lunas atau tidak aktif.", 409, "MEMBERSHIP_INACTIVE");
      const card = cardId
        ? await prisma.kartu_member.create({
            data: {
              id_kartu: cardId,
              id_admin: adminId,
              id_member: member.id_member,
              status_kartu: "Aktif",
            },
          })
        : await createWithUniqueId("KM-", 10, (id) =>
            prisma.kartu_member.create({
              data: {
                id_kartu: id,
                id_admin: adminId,
                id_member: member.id_member,
                status_kartu: "Aktif",
              },
            }),
          );
      return json({ data: card }, 201);
    }

    if (resource === "attendance" && request.method === "GET") {
      const attendance = await prisma.check_in.findMany({
        include: { member: { include: { users: { select: { nama: true } } } } },
        orderBy: [{ tgl_checkin: "desc" }, { jam_checkin: "desc" }],
      });
      return json({ data: attendance });
    }

    if (resource === "attendance" && request.method === "POST") {
      const body = await readJson(request);
      const cardId = requiredText(body, "cardId", 10);
      const card = await prisma.kartu_member.findUnique({
        where: { id_kartu: cardId },
        include: { member: true },
      });
      if (!card || card.status_kartu !== "Aktif") {
        throw new ApiError("Kartu membership aktif tidak ditemukan.", 404, "CARD_NOT_FOUND");
      }
      const date = body.date ? requiredDate(body, "date") : dateInJakartaToday();
      const day = dateOnly(date);
      const membership = await prisma.transaksi.findFirst({
        where: {
          id_member: card.id_member,
          status_bayar: "Lunas",
          tgl_mulai: { lte: day },
          tgl_berakhir: { gte: day },
        },
      });
      if (!membership) {
        throw new ApiError("Membership belum lunas atau sudah tidak aktif.", 409, "MEMBERSHIP_INACTIVE");
      }

      const time = timeInJakartaNow();
      const checkedIn = await createWithUniqueId("CI-", 10, (id) =>
        prisma.$transaction(async (transaction) => {
          await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${card.id_member}:${day.toISOString().slice(0, 10)}`}))`;
          const duplicate = await transaction.check_in.findFirst({
            where: { id_member: card.id_member, tgl_checkin: day },
          });
          if (duplicate) {
            throw new ApiError("Member sudah melakukan check-in pada tanggal ini.", 409, "DUPLICATE_CHECKIN");
          }
          return transaction.check_in.create({
            data: {
              id_checkin: id,
              id_member: card.id_member,
              tgl_checkin: day,
              jam_checkin: time,
            },
          });
        }),
      );
      return json({ data: checkedIn }, 201);
    }

    if (resource === "notifications" && request.method === "GET") {
      const notifications = await prisma.notifikasi.findMany({
        include: {
          member: { include: { users: { select: { nama: true } } } },
          transaksi: { select: { tgl_berakhir: true, status_bayar: true } },
        },
        orderBy: { id_notifikasi: "desc" },
      });
      return json({ data: notifications });
    }

    if (resource === "notifications" && request.method === "POST") {
      const today = dateInJakartaToday();
      const reminderEnd = addDays(today, 7);
      const expiring = await prisma.transaksi.findMany({
        where: {
          status_bayar: "Lunas",
          tgl_berakhir: { gte: today, lte: reminderEnd },
        },
        select: { id_transaksi: true, id_member: true },
      });
      const created = [];
      for (const payment of expiring) {
        const exists = await prisma.notifikasi.findFirst({
          where: {
            id_transaksi: payment.id_transaksi,
            jenis_notifikasi: "Pengingat Masa Berlaku",
          },
          select: { id_notifikasi: true },
        });
        if (exists) continue;
        created.push(
          await createWithUniqueId("NT-", 25, (id) =>
            prisma.notifikasi.create({
              data: {
                id_notifikasi: id,
                id_member: payment.id_member,
                id_transaksi: payment.id_transaksi,
                jenis_notifikasi: "Pengingat Masa Berlaku",
              },
            }),
          ),
        );
      }
      return json({ data: created, count: created.length }, 201);
    }

    if (resource === "schedules" && request.method === "GET") {
      const [schedules, staff] = await Promise.all([
        prisma.jadwal_piket.findMany({
          include: {
            cs: { include: { users: { select: { nama: true, username: true } } } },
            admin: { include: { users: { select: { nama: true } } } },
          },
          orderBy: [{ tgl_piket: "asc" }, { jam_mulai: "asc" }],
        }),
        prisma.cs.findMany({
          select: { id_cs: true, users: { select: { nama: true } } },
          orderBy: { id_cs: "asc" },
        }),
      ]);
      return json({ data: schedules, staff });
    }

    if (resource === "schedules" && request.method === "POST") {
      const body = await readJson(request);
      let csId = optionalText(body, "csId", 10);
      const staffName = optionalText(body, "staffName", 255);
      if (!csId && staffName) {
        const staffMatches = await prisma.cs.findMany({
          where: { users: { nama: { equals: staffName, mode: "insensitive" } } },
          select: { id_cs: true },
          take: 2,
        });
        if (staffMatches.length !== 1) {
          throw new ApiError(
            "Petugas Cleaning Service tidak ditemukan atau namanya tidak unik.",
            400,
            "INVALID_STAFF",
          );
        }
        csId = staffMatches[0].id_cs;
      }
      if (!csId) throw new ApiError("csId atau staffName wajib diisi.", 400, "INVALID_STAFF");
      const date = requiredDate(body, "date");
      const timeValue = requiredText(body, "time", 8);
      if (!/^\d{2}:\d{2}$/.test(timeValue)) {
        throw new ApiError("Jam harus menggunakan format HH:mm.", 400, "INVALID_TIME");
      }
      const staff = await prisma.cs.findUnique({ where: { id_cs: csId } });
      if (!staff) throw new ApiError("Petugas Cleaning Service tidak ditemukan.", 400, "INVALID_STAFF");
      const time = new Date(`1970-01-01T${timeValue}:00.000Z`);
      const schedule = await createWithUniqueId("JP-", 10, (id) =>
        prisma.jadwal_piket.create({
          data: {
            id_jadwal: id,
            id_admin: adminId,
            id_cs: staff.id_cs,
            tgl_piket: date,
            jam_mulai: time,
          },
          include: { cs: { include: { users: { select: { nama: true } } } } },
        }),
      );
      return json({ data: schedule }, 201);
    }

    if (resource === "schedules" && request.method === "PATCH") {
      const body = await readJson(request);
      const id = requiredText(body, "scheduleId", 10);
      const update: { id_cs?: string; tgl_piket?: Date; jam_mulai?: Date } = {};
      if (body.csId !== undefined) {
        const csId = requiredText(body, "csId", 10);
        if (!(await prisma.cs.findUnique({ where: { id_cs: csId } }))) {
          throw new ApiError("Petugas Cleaning Service tidak ditemukan.", 400, "INVALID_STAFF");
        }
        update.id_cs = csId;
      }
      if (body.date !== undefined) update.tgl_piket = requiredDate(body, "date");
      if (body.time !== undefined) {
        const timeValue = requiredText(body, "time", 8);
        if (!/^\d{2}:\d{2}$/.test(timeValue)) {
          throw new ApiError("Jam harus menggunakan format HH:mm.", 400, "INVALID_TIME");
        }
        update.jam_mulai = new Date(`1970-01-01T${timeValue}:00.000Z`);
      }
      if (!Object.keys(update).length) {
        throw new ApiError("Tidak ada perubahan jadwal yang dikirim.", 400, "EMPTY_UPDATE");
      }
      return json({
        data: await prisma.jadwal_piket.update({
          where: { id_jadwal: id },
          data: update,
        }),
      });
    }

    return methodNotAllowed();
  } catch (error) {
    return errorResponse(error);
  }
}
