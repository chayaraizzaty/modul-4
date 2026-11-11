"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  roleDetails,
  type GymRole,
} from "./role-config";
import CustomerWorkspace from "./customer-frontend";
import CleaningServiceWorkspace from "./cleaning-service-frontend";
import OwnerWorkspace from "./owner-frontend";
import AdminWorkspace, { RoleLoginReference } from "./admin-frontend";
import CustomerAuth from "./customer-auth";
import LogoutLink from "./logout-link";

const pageTitles: Record<string, string> = {
  dashboard: "Dashboard",
  registration: "Pendaftaran Membership",
  payments: "Pembayaran",
  payment: "Pembayaran/Perpanjangan Membership",
  members: "Kartu Membership",
  membership: "Informasi Membership",
  attendance: "Kehadiran Member",
  notifications: "Notifikasi",
  schedule: "Jadwal Piket",
  facilities: "Laporan Kondisi Fasilitas",
  revenue: "Laporan Pendapatan",
  visits: "Laporan Kunjungan Member",
  registrations: "Laporan Pendaftaran Member",
};

const mockMembers = [
  { id: "MBR-001", name: "Citra Piliang", membership: "Umum", status: "Aktif" },
  { id: "MBR-002", name: "Siti Kurniawan", membership: "Pelajar", status: "Aktif" },
  { id: "MBR-003", name: "Rafi Hidayat", membership: "Umum", status: "Perlu perpanjangan" },
];

const mockPayments = [
  { id: "TRX-002", name: "Siti Kurniawan", date: "22 Januari 2026", method: "QRIS", amount: "Rp100.000", status: "Berhasil" },
  { id: "TRX-001", name: "Citra Piliang", date: "20 Januari 2026", method: "Tunai", amount: "Rp150.000", status: "Berhasil" },
];

const mockSchedule = [
  { date: "22 Januari 2026", time: "08:00", staff: "Nadia Putri" },
  { date: "24 Januari 2026", time: "08:00", staff: "Rafi Hidayat" },
];

const demoNotice =
  "Mode demo frontend: data yang ditampilkan sementara dan belum tersimpan ke database.";

export function RoleLogin({ role }: { role: GymRole }) {
  if (role === "owner" || role === "cleaning-service") {
    return <RoleLoginReference role={role} />;
  }

  return <CustomerAuth />;
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | ReactNode)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
      <table className="w-full min-w-[620px] border-collapse text-left text-sm">
        <thead className="bg-[#edf4ef] text-[#172b27]">
          <tr>{headers.map((header) => <th key={header} className="px-5 py-4 font-semibold">{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-[#e5ebe7]">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="px-5 py-4">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PageHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-7">
      <h2 className="font-display text-3xl font-bold text-[#172b27] sm:text-4xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#66736f]">{description}</p>
    </div>
  );
}

function DemoForm({
  children,
  buttonLabel,
  onSaved,
}: {
  children: ReactNode;
  buttonLabel: string;
  onSaved: (message: string) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSaved("Data valid pada form dan ditangani sementara di browser. Belum disimpan ke database.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-5 shadow-sm sm:p-7">
      {children}
      <button className="rounded-lg bg-[#70af9e] px-6 py-3 font-semibold text-[#172b27] hover:bg-[#65a591]">
        {buttonLabel}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-[#172b27]">
      {label}
      {children}
    </label>
  );
}

function Input({ name, type = "text", required = true }: { name: string; type?: string; required?: boolean }) {
  return <input name={name} type={type} required={required} className="mt-2 h-12 w-full rounded-lg border border-[#dce3df] px-3 outline-none focus:border-[#70af9e] focus:ring-2 focus:ring-[#70af9e]/20" />;
}

export function RoleWorkspace({ role, section }: { role: GymRole; section: string }) {
  const [feedback, setFeedback] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [reportRange, setReportRange] = useState("");
  const currentRole = roleDetails[role];
  const title = pageTitles[section] ?? "Halaman";

  function save(message: string) {
    setFeedback(message);
  }

  const statusTag = (status: string) => (
    <span className="rounded-full bg-[#d8f3e6] px-3 py-1 text-xs font-medium text-[#174c3f]">{status}</span>
  );

  function renderDashboard() {
    if (role === "owner") {
      return (
        <>
          <PageHeading title="Selamat Datang, Owner!" description="Ringkasan laporan PIAI Gym." />
          <div className="grid gap-5 md:grid-cols-2">
            {currentRole.navigation.slice(1).map((item) => (
              <Link key={item.href} href={item.href} className="rounded-2xl bg-white p-7 shadow-sm transition hover:-translate-y-0.5">
                <h3 className="font-display text-xl font-bold">{item.label}</h3>
                <p className="mt-3 text-sm text-[#66736f]">Lihat {item.label.toLowerCase()} PIAI Gym.</p>
                <span className="mt-6 inline-block font-semibold text-[#397866]">Lihat Laporan →</span>
              </Link>
            ))}
          </div>
        </>
      );
    }

    if (role === "cleaning-service") {
      return (
        <>
          <PageHeading title="Selamat Datang, Cleaning Service" description="Jadwal piket dan pelaporan fasilitas gym." />
          <div className="grid gap-5 md:grid-cols-2">
            {currentRole.navigation.slice(1).map((item) => (
              <Link key={item.href} href={item.href} className="rounded-2xl bg-white p-7 shadow-sm transition hover:-translate-y-0.5">
                <h3 className="font-display text-xl font-bold">{item.label}</h3>
                <p className="mt-3 text-sm text-[#66736f]">{item.label === "Jadwal Piket" ? "Lihat jadwal piket kebersihan yang sudah ditetapkan Admin." : "Laporkan kondisi atau kerusakan fasilitas gym yang ditemukan."}</p>
                <span className="mt-6 inline-block font-semibold text-[#397866]">{item.label === "Jadwal Piket" ? "Buka jadwal →" : "Buat laporan →"}</span>
              </Link>
            ))}
          </div>
        </>
      );
    }

    if (role === "customer") {
      return (
        <>
          <PageHeading title="Selamat Datang, Customer!" description="Kelola membership dan kehadiran Anda." />
          <div className="grid gap-5 md:grid-cols-2">
            {currentRole.navigation.slice(1).map((item) => (
              <Link key={item.href} href={item.href} className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5">
                <h3 className="font-display text-xl font-bold">{item.label}</h3>
                <p className="mt-2 text-sm text-[#66736f]">{customerDescription(item.label)}</p>
                <span className="mt-5 inline-block font-semibold text-[#397866]">Buka halaman →</span>
              </Link>
            ))}
          </div>
        </>
      );
    }

    return (
      <>
        <PageHeading title="Selamat Datang, Rina" description="Ringkasan aktivitas membership PIAI Gym." />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Total Member", "3"],
            ["Member Aktif", "2"],
            ["Check-in Hari ini", "1"],
          ].map(([label, value]) => (
            <article key={label} className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="font-display text-lg font-bold">{label}</h3>
              <p className="mt-2 font-display text-4xl font-bold">{value}</p>
            </article>
          ))}
        </div>
        <section className="mt-8">
          <h3 className="mb-4 font-display text-2xl font-bold">Riwayat Pembayaran</h3>
          <DataTable headers={["ID Transaksi", "Nama", "Tanggal", "Metode", "Jumlah", "Status"]} rows={mockPayments.map((item) => [item.id, item.name, item.date, item.method, item.amount, statusTag(item.status)])} />
        </section>
        <section className="mt-8">
          <h3 className="mb-4 font-display text-2xl font-bold">Jadwal Piket</h3>
          <DataTable headers={["Tanggal", "Jam Mulai", "Petugas", "Status"]} rows={mockSchedule.map((item) => [item.date, item.time, item.staff, statusTag("Terjadwal")])} />
        </section>
      </>
    );
  }

  function renderOwnerReport() {
    const reportDescription: Record<string, string> = {
      revenue: "Lihat laporan pendapatan PIAI Gym berdasarkan periode.",
      facilities: "Lihat laporan kondisi atau kerusakan fasilitas gym.",
      visits: "Lihat laporan kunjungan member PIAI Gym.",
      registrations: "Lihat laporan pendaftaran member PIAI Gym.",
    };
    const rows = section === "facilities"
      ? [["22 Januari 2026", "Treadmill", "Perlu perbaikan", "Nadia Putri"], ["20 Januari 2026", "Loker", "Selesai", "Nadia Putri"]]
      : section === "visits"
        ? [["22 Januari 2026", "Citra Piliang", "19:00", "Tercatat"], ["21 Januari 2026", "Siti Kurniawan", "17:30", "Tercatat"]]
        : section === "registrations"
          ? [["22 Januari 2026", "Siti Kurniawan", "Pelajar", "Aktif"], ["20 Januari 2026", "Citra Piliang", "Umum", "Aktif"]]
          : mockPayments.map((item) => [item.date, item.name, item.amount, item.status]);

    return (
      <>
        <PageHeading title={title} description={reportDescription[section] ?? "Pilih rentang tanggal laporan."} />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setReportRange(`${form.get("from")} – ${form.get("to")}`);
          }}
          className="mb-6 flex flex-wrap items-end gap-4 rounded-2xl bg-white p-5 shadow-sm"
        >
          <Field label="Tanggal dari"><Input name="from" type="date" /></Field>
          <Field label="Tanggal sampai"><Input name="to" type="date" /></Field>
          <button className="h-12 rounded-lg bg-[#70af9e] px-6 font-semibold text-[#172b27]">Tampilkan Laporan</button>
        </form>
        {reportRange && <p className="mb-4 text-sm text-[#397866]">Periode laporan: {reportRange}. {demoNotice}</p>}
        <DataTable
          headers={section === "facilities" ? ["Tanggal", "Fasilitas", "Status", "Pelapor"] : section === "visits" ? ["Tanggal", "Nama Member", "Jam", "Status"] : section === "registrations" ? ["Tanggal", "Nama Member", "Membership", "Status"] : ["Tanggal", "Nama", "Jumlah", "Status"]}
          rows={rows.map((row) => row.map((cell, index) => index === row.length - 1 ? statusTag(cell) : cell))}
        />
      </>
    );
  }

  function renderContent() {
    if (section === "dashboard") return renderDashboard();
    if (role === "owner" && ["revenue", "facilities", "visits", "registrations"].includes(section)) return renderOwnerReport();

    if ((role === "admin" && section === "registration") || (role === "customer" && section === "registration")) {
      return (
        <>
          <PageHeading title={title} description="Isi data diri dan pilih jenis membership." />
          <DemoForm buttonLabel="Simpan Pendaftaran" onSaved={save}>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Nama Lengkap"><Input name="nama" /></Field>
              <Field label="Username"><Input name="username" /></Field>
              <Field label="Jenis Kelamin"><select name="gender" required className="mt-2 h-12 w-full rounded-lg border border-[#dce3df] px-3"><option value="">Pilih jenis kelamin</option><option>Laki-laki</option><option>Perempuan</option></select></Field>
              <Field label="No. HP"><Input name="phone" type="tel" /></Field>
              <Field label="Alamat"><Input name="address" /></Field>
              <Field label="Kota"><Input name="city" /></Field>
              <Field label="Jenis Membership"><select name="membership" required className="mt-2 h-12 w-full rounded-lg border border-[#dce3df] px-3"><option value="">Pilih membership</option><option>Pelajar</option><option>Umum</option></select></Field>
            </div>
          </DemoForm>
        </>
      );
    }

    if (role === "customer" && section === "payment") {
      return (
        <>
          <PageHeading title={title} description="Bayar tagihan lewat QRIS dan perpanjang masa aktif membership." />
          <section className="max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="font-display text-xl font-bold">LANGKAH 1 - TAGIHAN</h3>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              {[["Nama", "Citra Piliang"], ["Jenis Kelamin", "Perempuan"], ["Jenis Membership", "Umum"], ["Tanggal Daftar", "10/01/2026"], ["Nominal Tagihan", "Rp150.000"]].map(([key, value]) => <div key={key}><dt className="text-sm text-[#66736f]">{key}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}
            </dl>
            <button type="button" onClick={() => save("QRIS demo dipilih. Tidak ada pembayaran sungguhan yang diproses.")} className="mt-7 rounded-lg bg-[#70af9e] px-6 py-3 font-semibold">Bayar dengan QRIS</button>
          </section>
        </>
      );
    }

    if (role === "customer" && section === "attendance") {
      return (
        <>
          <PageHeading title={title} description="Lakukan check-in dan kelola data kehadiran Anda." />
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-[#66736f]">Tanggal: 08/11/2026 · Jam masuk: 19:00</p>
            <button type="button" onClick={() => save("Check-in demo tercatat sementara di halaman ini.")} className="mt-4 rounded-lg bg-[#70af9e] px-6 py-3 font-semibold">Check-in Sekarang</button>
          </div>
          <DataTable headers={["Tanggal", "Jam Masuk", "Status", "Aksi"]} rows={[["08 November 2026", "19:00", statusTag("Tercatat"), <button key="edit" type="button" onClick={() => save("Data kehadiran dapat diperiksa. Perubahan belum disimpan.")} className="text-[#397866] underline">Ubah</button>]]} />
        </>
      );
    }

    if (role === "cleaning-service" && section === "schedule") {
      return (
        <>
          <PageHeading title={title} description="Jadwal piket kebersihan yang sudah ditetapkan Admin." />
          <div className="mb-5 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
            <span>Jadwal hari ini: {scheduleOpen ? "Terbuka" : "Tertutup"}</span>
            <button type="button" onClick={() => { setScheduleOpen((open) => !open); save("Status jadwal demo berhasil diubah."); }} className="rounded-lg bg-[#70af9e] px-4 py-2 font-medium">
              {scheduleOpen ? "Tutup Jadwal" : "Buka Jadwal"}
            </button>
          </div>
          <DataTable headers={["Tanggal", "Jam Mulai", "Petugas", "Status"]} rows={mockSchedule.map((item) => [item.date, item.time, item.staff, statusTag(scheduleOpen ? "Terbuka" : "Tertutup")])} />
        </>
      );
    }

    if (role === "cleaning-service" && section === "facilities") {
      return (
        <>
          <PageHeading title={title} description="Laporkan kondisi atau kerusakan fasilitas gym yang ditemukan." />
          <DemoForm buttonLabel="Kirim Laporan" onSaved={save}>
            <Field label="Nama Fasilitas"><Input name="facility" /></Field>
            <Field label="Kondisi Fasilitas"><select name="condition" required className="mt-2 h-12 w-full rounded-lg border border-[#dce3df] px-3"><option value="">Pilih kondisi</option><option>Rusak</option><option>Perlu perbaikan</option><option>Selesai diperiksa</option></select></Field>
            <Field label="Deskripsi"><textarea name="description" required rows={4} className="mt-2 w-full rounded-lg border border-[#dce3df] p-3" /></Field>
          </DemoForm>
        </>
      );
    }

    if (role === "admin" && section === "schedule") {
      return (
        <>
          <PageHeading title={title} description="Kelola jadwal piket kebersihan." />
          <DemoForm buttonLabel="Tambah Jadwal" onSaved={save}>
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Tanggal"><Input name="date" type="date" /></Field>
              <Field label="Jam Mulai"><Input name="time" type="time" /></Field>
              <Field label="Petugas"><select name="staff" required className="mt-2 h-12 w-full rounded-lg border border-[#dce3df] px-3"><option value="">Pilih petugas</option><option>Nadia Putri</option><option>Rafi Hidayat</option></select></Field>
            </div>
          </DemoForm>
          <div className="mt-6"><DataTable headers={["Tanggal", "Jam Mulai", "Petugas", "Status"]} rows={mockSchedule.map((item) => [item.date, item.time, item.staff, statusTag("Terjadwal")])} /></div>
        </>
      );
    }

    if (role === "admin" && section === "payments") {
      return <><PageHeading title={title} description="Riwayat pembayaran membership." /><DataTable headers={["ID Transaksi", "Nama", "Tanggal", "Metode", "Jumlah", "Status"]} rows={mockPayments.map((item) => [item.id, item.name, item.date, item.method, item.amount, statusTag(item.status)])} /></>;
    }

    if ((role === "admin" && section === "members") || (role === "customer" && section === "membership")) {
      return <><PageHeading title={title} description="Informasi kartu dan status membership." /><DataTable headers={["ID Member", "Nama", "Jenis Membership", "Status"]} rows={mockMembers.map((item) => [item.id, item.name, item.membership, statusTag(item.status)])} /></>;
    }

    if (role === "admin" && section === "attendance") {
      return <><PageHeading title={title} description="Rekap kehadiran member PIAI Gym." /><DataTable headers={["Tanggal", "Nama Member", "Jam Masuk", "Status"]} rows={[["08 November 2026", "Citra Piliang", "19:00", statusTag("Tercatat")], ["08 November 2026", "Siti Kurniawan", "17:30", statusTag("Tercatat")]]} /></>;
    }

    if ((role === "admin" || role === "customer") && section === "notifications") {
      return <><PageHeading title={title} description="Informasi masa aktif membership dan pemberitahuan." /><DataTable headers={["Tanggal", "Notifikasi", "Status"]} rows={[["08 November 2026", "Masa aktif membership tersisa 7 hari", statusTag("Belum dibaca")], ["01 November 2026", "Pembayaran berhasil", statusTag("Dibaca")]]} /></>;
    }

    return (
      <>
        <PageHeading title={title} description={demoNotice} />
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          Halaman ini belum memiliki detail state yang cukup pada metadata Figma yang tersedia.
        </div>
      </>
    );
  }

  if (role === "admin") {
    return <AdminWorkspace section={section} />;
  }
  if (role === "customer") {
    return <CustomerWorkspace section={section} />;
  }
  if (role === "cleaning-service") {
    return <CleaningServiceWorkspace section={section} />;
  }
  if (role === "owner") {
    return <OwnerWorkspace section={section} />;
  }

  return (
    <div className="min-h-screen bg-[#f5f7f2] lg:flex">
      <aside className="flex shrink-0 flex-col bg-[#d8f3e6] px-6 py-7 sm:px-10 lg:min-h-screen lg:w-[360px] lg:px-9 lg:py-12">
        <Link href={`/${role}/dashboard`} className="font-display text-4xl font-bold text-black">PIAI Gym</Link>
        <nav aria-label={`Navigasi ${currentRole.label}`} className="mt-10 flex flex-col gap-3">
          {currentRole.navigation.map((item) => {
            const active = item.href.endsWith(`/${section}`);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`rounded-xl px-4 py-4 text-sm font-medium text-[#172b27] transition hover:bg-white/70 ${active ? "bg-white font-bold shadow-sm" : ""}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <LogoutLink className="mt-8 rounded-xl px-4 py-4 font-medium text-[#172b27] hover:bg-white/70 lg:mt-auto" />
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 lg:px-10 lg:py-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-[#66736f]">{currentRole.label} / {title}</p>
          <div className="rounded-full bg-white px-4 py-2 text-sm text-[#172b27] shadow-sm">{currentRole.user}</div>
        </header>
        <p className="mb-6 rounded-lg border border-[#c7e4d7] bg-[#eaf7f0] px-4 py-3 text-xs text-[#315d4e]">{demoNotice}</p>
        {feedback && <p role="status" className="mb-5 rounded-lg bg-[#fff7d6] px-4 py-3 text-sm text-[#55471c]">{feedback}</p>}
        {renderContent()}
      </main>
    </div>
  );
}

function customerDescription(label: string) {
  switch (label) {
    case "Pendaftaran Membership":
      return "Daftar sebagai member baru PIAI Gym.";
    case "Pembayaran":
      return "Bayar atau perpanjang masa aktif membership Kamu.";
    case "Kartu Membership":
      return "Lihat informasi dan status membership kamu.";
    case "Kehadiran Member":
      return "Check kehadiran kamu selama masa aktif membership kamu.";
    default:
      return "Lihat informasi terbaru terkait membership kamu.";
  }
}
