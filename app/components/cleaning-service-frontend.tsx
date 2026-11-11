"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import LogoutLink from "./logout-link";

const FRAMES = {
  dashboard: "CS03_Dashboard Cleaning service.png",
  schedule: "CS03_Jadwal - Tertutup.png",
  scheduleShown: "CS03_Jadwal - Tertutup-1.png",
  facilities: "CS03_Dashboard Cleaning service-1.png",
} as const;

type Frame = (typeof FRAMES)[keyof typeof FRAMES];

const navigation = [
  { section: "dashboard", label: "Dashboard", href: "/cleaning-service/dashboard", y: 153 },
  { section: "schedule", label: "Jadwal Piket Kebersihan", href: "/cleaning-service/schedule", y: 234 },
  { section: "facilities", label: "Lapor Kondisi Fasilitas", href: "/cleaning-service/facilities", y: 313 },
] as const;

type Schedule = {
  id_jadwal: string;
  tgl_piket: string;
  jam_mulai: string;
  cs?: { users?: { nama?: string } };
};

type FacilityReport = {
  id_laporan: string;
  nama_fasilitas: string;
  tgl_laporan: string;
  status_laporan: string;
};

type CleaningDashboard = {
  upcomingSchedules: number;
  facilityReports: number;
};

function monthKey(date: string) {
  return date.slice(0, 7);
}

function monthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
}

function framePosition(x: number, y: number, width: number, height: number) {
  return {
    left: `${(x / 1440) * 100}%`,
    top: `${(y / 1024) * 100}%`,
    width: `${(width / 1440) * 100}%`,
    height: `${(height / 1024) * 100}%`,
  };
}

function ReferenceStage({ frame, children }: { frame: Frame; children: ReactNode }) {
  return (
    <div className="cleaning-service-stage">
      <Image
        alt={`Desain Cleaning Service: ${frame.replace(/\.png$/i, "")}`}
        className="cleaning-service-reference"
        fill
        priority
        sizes="100vw"
        src={`/figma/cleaning-service/frames/${encodeURIComponent(frame)}`}
        unoptimized
      />
      {children}
    </div>
  );
}

function Hotspot({
  label,
  style,
  onClick,
  type = "button",
  disabled = false,
}: {
  label: string;
  style: CSSProperties;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      aria-label={label}
      className="cleaning-service-hotspot"
      disabled={disabled}
      onClick={onClick}
      style={style}
      type={type}
    />
  );
}

export default function CleaningServiceWorkspace({ section }: { section: string }) {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [scheduleShown, setScheduleShown] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [facility, setFacility] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [feedback, setFeedback] = useState("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [reports, setReports] = useState<FacilityReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<CleaningDashboard | null>(null);

  useEffect(() => {
    let active = true;
    const resource = section === "schedule" ? "schedules" : section === "facilities" ? "facility-reports" : "dashboard";
    void Promise.all([
      fetch(`/api/cleaning-service/${resource}`).then(async (response) => {
        const result = await response.json() as {
          error?: string;
          data?: Schedule[] | FacilityReport[];
          user?: { name?: string };
          cs?: { users?: { nama?: string } };
          upcomingSchedules?: number;
          facilityReports?: number;
        };
        if (!response.ok) throw new Error(result.error ?? "Data Cleaning Service gagal dimuat.");
        return result;
      }),
      fetch("/api/auth/session").then(async (response) => {
        const result = await response.json() as { user?: { name?: string } };
        return response.ok ? result : {};
      }),
    ]).then(([result, session]) => {
      if (!active) return;
      if (section === "schedule" && Array.isArray(result.data)) {
        setSchedules(result.data as Schedule[]);
      }
      if (section === "facilities" && Array.isArray(result.data)) {
        setReports(result.data as FacilityReport[]);
      }
      if (section === "dashboard") {
        setDashboard({
          upcomingSchedules: result.upcomingSchedules ?? 0,
          facilityReports: result.facilityReports ?? 0,
        });
      }
      setStaffName(session.user?.name ?? result.user?.name ?? result.cs?.users?.nama ?? "");
      setFeedback("");
    }).catch((error: unknown) => {
      if (active) setFeedback(error instanceof Error ? error.message : "Data Cleaning Service gagal dimuat.");
    });
    return () => { active = false; };
  }, [section]);

  function renderSidebar() {
    return (
      <>
        {navigation.map((item) => (
          <Link
            key={item.section}
            aria-label={item.label}
            aria-current={section === item.section ? "page" : undefined}
            className="cleaning-service-hotspot cleaning-service-nav"
            href={item.href}
            style={framePosition(39, item.y, 330, 60)}
          >
            <span className="sr-only">{item.label}</span>
          </Link>
        ))}
        <LogoutLink
          className="cleaning-service-hotspot cleaning-service-nav"
          style={framePosition(42, 870, 180, 62)}
        >
          <span className="sr-only">Log Out</span>
        </LogoutLink>
      </>
    );
  }

  function renderDashboard() {
    return (
      <>
        {renderSidebar()}
        <Hotspot
          label="Buka Jadwal Piket Kebersihan"
          onClick={() => router.push("/cleaning-service/schedule")}
          style={framePosition(463, 182, 808, 331)}
        />
        <span className="cleaning-service-dashboard-stat" style={framePosition(505, 465, 720, 30)}>
          Jadwal mendatang: {dashboard?.upcomingSchedules ?? "—"}
        </span>
        <Hotspot
          label="Buat Laporan Kondisi atau Kerusakan Fasilitas"
          onClick={() => router.push("/cleaning-service/facilities")}
          style={framePosition(463, 599, 808, 324)}
        />
        <span className="cleaning-service-dashboard-stat" style={framePosition(510, 868, 720, 30)}>
          Laporan fasilitas terkirim: {dashboard?.facilityReports ?? "—"}
        </span>
      </>
    );
  }

  function submitSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setScheduleShown(true);
    setFeedback("");
  }

  function renderSchedule() {
    const monthOptions = [...new Set(schedules.map((schedule) => monthKey(schedule.tgl_piket)))].sort();
    const visibleSchedules = schedules.filter(
      (schedule) => !selectedMonth || monthKey(schedule.tgl_piket) === selectedMonth,
    );

    return (
      <>
        {renderSidebar()}
        <form className="cleaning-service-overlay" onSubmit={submitSchedule}>
          <input
            aria-label="Nama Petugas"
            className="cleaning-service-schedule-select"
            readOnly
            style={framePosition(547, 350, 315, 57)}
            value={staffName}
          />
          <select
            aria-label="Bulan"
            className="cleaning-service-schedule-select"
            onChange={(event) => setSelectedMonth(event.target.value)}
            style={framePosition(970, 354, 315, 57)}
            value={selectedMonth}
          >
            <option value="">Semua Jadwal</option>
            {monthOptions.map((month) => (
              <option key={month} value={month}>{monthLabel(month)}</option>
            ))}
          </select>
          {scheduleShown && visibleSchedules.length === 0 && (
            <div className="cleaning-service-empty-schedule" role="status">
              Tidak ada jadwal untuk pilihan ini.
            </div>
          )}
          {scheduleShown && visibleSchedules.length > 0 && (
            <div className="cleaning-service-schedule-results" role="table" aria-label="Jadwal piket dari database">
              <div className="cleaning-service-schedule-row cleaning-service-schedule-header" role="row">
                <span role="columnheader">Petugas</span>
                <span role="columnheader">Tanggal</span>
                <span role="columnheader">Jam Mulai</span>
              </div>
              {visibleSchedules.map((schedule) => (
                <div className="cleaning-service-schedule-row" role="row" key={schedule.id_jadwal}>
                  <span role="cell">{schedule.cs?.users?.nama ?? staffName}</span>
                  <span role="cell">{schedule.tgl_piket.slice(0, 10)}</span>
                  <span role="cell">{schedule.jam_mulai.slice(11, 16) || schedule.jam_mulai}</span>
                </div>
              ))}
            </div>
          )}
          <Hotspot
            label="Tampilkan Jadwal"
            style={framePosition(1093, 854, 225, 62)}
            type="submit"
          />
        </form>
      </>
    );
  }

  async function submitFacilityReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setFeedback("");
    try {
      const response = await fetch("/api/cleaning-service/facility-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facility,
          status: reportStatus,
          date: new Date().toISOString().slice(0, 10),
        }),
      });
      const result = await response.json() as { error?: string; data?: FacilityReport };
      if (!response.ok) throw new Error(result.error ?? "Laporan fasilitas gagal disimpan.");
      const listResponse = await fetch("/api/cleaning-service/facility-reports");
      const listResult = await listResponse.json() as { data?: FacilityReport[] };
      if (!listResponse.ok) throw new Error("Laporan tersimpan, tetapi daftar laporan gagal dimuat.");
      setReports(Array.isArray(listResult.data) ? listResult.data : []);
      setFeedback("Laporan fasilitas berhasil disimpan.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Laporan fasilitas gagal disimpan.");
    } finally {
      setLoading(false);
    }
  }

  function renderFacilities() {
    return (
      <>
        {renderSidebar()}
        <form className="cleaning-service-overlay" onSubmit={submitFacilityReport}>
          <input
            aria-label="Nama Petugas"
            className="cleaning-service-report-control"
            readOnly
            style={framePosition(479, 274, 381, 68)}
            value={staffName}
          />
          <select
            aria-label="Fasilitas yang Rusak"
            className="cleaning-service-report-control"
            onChange={(event) => setFacility(event.target.value)}
            required
            style={framePosition(982, 274, 381, 68)}
            value={facility}
          >
            <option value="">Pilih Fasilitas</option>
            <option value="Treadmill">Treadmill</option>
            <option value="Loker">Loker</option>
          </select>
          <select
            aria-label="Status Laporan"
            className="cleaning-service-report-control"
            onChange={(event) => setReportStatus(event.target.value)}
            required
            style={framePosition(479, 574, 381, 67)}
            value={reportStatus}
          >
            <option value="">Pilih kondisi</option>
            <option value="Rusak">Rusak</option>
            <option value="Dalam Perbaikan">Dalam Perbaikan</option>
            <option value="Baik">Baik</option>
          </select>
          <Hotspot
            label="Batal"
            onClick={() => router.push("/cleaning-service/dashboard")}
            style={framePosition(1226, 866, 54, 30)}
          />
          <Hotspot
            label="Kirim Laporan"
            disabled={loading}
            style={framePosition(1288, 866, 78, 30)}
            type="submit"
          />
        </form>
        {reports.length > 0 && (
          <div className="cleaning-service-report-results" role="table" aria-label="Laporan fasilitas tersimpan">
            <div className="cleaning-service-report-row cleaning-service-report-header" role="row">
              <span role="columnheader">ID Laporan</span>
              <span role="columnheader">Fasilitas</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">Tanggal</span>
            </div>
            {reports.slice(0, 3).map((report) => (
              <div className="cleaning-service-report-row" role="row" key={report.id_laporan}>
                <span role="cell">{report.id_laporan}</span>
                <span role="cell">{report.nama_fasilitas}</span>
                <span role="cell">{report.status_laporan}</span>
                <span role="cell">{report.tgl_laporan.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        )}
        {feedback && <p className="cleaning-service-feedback" role="status">{feedback}</p>}
      </>
    );
  }

  let frame: Frame;
  let content: ReactNode;

  switch (section) {
    case "schedule":
      frame = scheduleShown ? FRAMES.scheduleShown : FRAMES.schedule;
      content = renderSchedule();
      break;
    case "facilities":
      frame = FRAMES.facilities;
      content = renderFacilities();
      break;
    default:
      frame = FRAMES.dashboard;
      content = renderDashboard();
  }

  return (
    <main className="cleaning-service-screen">
      <ReferenceStage frame={frame}>
        {content}
        {loading && <span className="sr-only" role="status">Memproses laporan...</span>}
      </ReferenceStage>
    </main>
  );
}
