"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import LogoutLink from "./logout-link";

const FRAMES = {
  dashboard: "OW08_Dashboard Owner (Laporan Pendapatan).png",
  revenue: "OW09_Pilih Periode Laporan Pendapatan.png",
  facilities: "OW20 Dashboard Owner (Tgl Laporan Fasilitas).png",
  visits: "OW31 Dashboard Owner (TGL Laporan Kunjungan Member).png",
  registrations: "OW42 Dashboard Owner (TGL Laporan Pendaftaran Member).png",
} as const;

type Frame = (typeof FRAMES)[keyof typeof FRAMES];
type ReportSection = "revenue" | "facilities" | "visits" | "registrations";
type OwnerReportRecord = Record<string, unknown>;
type OwnerDashboard = {
  memberCount: number;
  paidTransactionCount: number;
  verifiedRevenue: string;
  activeMemberships: number;
  attendanceCount: number;
  facilityReportCount: number;
};

const navigation = [
  { section: "dashboard", label: "Dashboard", href: "/owner/dashboard", y: 153 },
  { section: "revenue", label: "Laporan Pendapatan", href: "/owner/revenue", y: 234 },
  { section: "facilities", label: "Laporan Kondisi Fasilitas", href: "/owner/facilities", y: 313 },
  { section: "visits", label: "Laporan Kunjungan Member", href: "/owner/visits", y: 389 },
  { section: "registrations", label: "Laporan Pendaftaran Member", href: "/owner/registrations", y: 465 },
] as const;

const reportFrames: Record<ReportSection, Frame> = {
  revenue: FRAMES.revenue,
  facilities: FRAMES.facilities,
  visits: FRAMES.visits,
  registrations: FRAMES.registrations,
};

function framePosition(x: number, y: number, width: number, height: number) {
  return {
    left: `${(x / 1440) * 100}%`,
    top: `${(y / 1024) * 100}%`,
    width: `${(width / 1440) * 100}%`,
    height: `${(height / 1024) * 100}%`,
  };
}

function formatReportDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatReportPeriodDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : "—";
}

function OwnerStage({ frame, children }: { frame: Frame; children: ReactNode }) {
  return (
    <div className="owner-stage">
      <Image
        alt={`Desain Owner: ${frame.replace(/\.png$/i, "")}`}
        className="owner-reference-image"
        fill
        priority
        sizes="100vw"
        src={`/figma/owner/frames/${encodeURIComponent(frame)}`}
        unoptimized
      />
      {children}
    </div>
  );
}

function OwnerHotspot({
  label,
  style,
  onClick,
  type = "button",
}: {
  label: string;
  style: CSSProperties;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      aria-label={label}
      className="owner-hotspot"
      onClick={onClick}
      style={style}
      type={type}
    />
  );
}

export default function OwnerWorkspace({ section }: { section: string }) {
  const router = useRouter();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);
  const [dashboardSummary, setDashboardSummary] = useState<OwnerDashboard | null>(null);
  const [reportRows, setReportRows] = useState<string[][] | null>(null);
  const [reportTotal, setReportTotal] = useState<string | null>(null);
  const isDashboard = section === "dashboard";
  const reportSection = section as ReportSection;
  const frame = isDashboard
    ? FRAMES.dashboard
    : reportFrames[reportSection] ?? FRAMES.dashboard;

  useEffect(() => {
    if (!isDashboard) return;
    let active = true;
    void fetch("/api/owner/dashboard")
      .then(async (response) => {
        const result = (await response.json()) as {
          error?: string;
          memberCount?: number;
          paidTransactionCount?: number;
          verifiedRevenue?: string;
          activeMemberships?: number;
          attendanceCount?: number;
          facilityReportCount?: number;
        };
        if (!response.ok) throw new Error(result.error ?? "Ringkasan Owner gagal dimuat.");
        if (active) {
          setDashboardSummary({
            memberCount: result.memberCount ?? 0,
            paidTransactionCount: result.paidTransactionCount ?? 0,
            verifiedRevenue: result.verifiedRevenue ?? "0",
            activeMemberships: result.activeMemberships ?? 0,
            attendanceCount: result.attendanceCount ?? 0,
            facilityReportCount: result.facilityReportCount ?? 0,
          });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setFeedback(error instanceof Error ? error.message : "Dashboard tidak dapat dimuat.");
        }
      });
    return () => {
      active = false;
    };
  }, [isDashboard]);

  function renderSidebar() {
    return (
      <>
        {navigation.map((item) => (
          <Link
            key={item.section}
            aria-label={item.label}
            aria-current={section === item.section ? "page" : undefined}
            className="owner-hotspot owner-nav-link"
            href={item.href}
            style={framePosition(39, item.y, item.section === "dashboard" ? 314 : 372, 61)}
          >
            <span className="sr-only">{item.label}</span>
          </Link>
        ))}
        <LogoutLink
          className="owner-hotspot owner-nav-link"
          style={framePosition(42, 870, 180, 62)}
        >
          <span className="sr-only">Log Out</span>
        </LogoutLink>
      </>
    );
  }

  function renderDashboard() {
    const cards = [
      {
        label: "Buka Laporan Pendapatan",
        href: "/owner/revenue",
        x: 485,
        y: 237,
        width: 868,
        height: 144,
        summary: dashboardSummary
          ? `Pendapatan terverifikasi Rp${Number(dashboardSummary.verifiedRevenue).toLocaleString("id-ID")}`
          : "Memuat ringkasan database...",
      },
      {
        label: "Buka Laporan Kondisi Fasilitas",
        href: "/owner/facilities",
        x: 500,
        y: 436,
        width: 867,
        height: 142,
        summary: `Laporan fasilitas: ${dashboardSummary?.facilityReportCount ?? "—"}`,
      },
      {
        label: "Buka Laporan Kunjungan Member",
        href: "/owner/visits",
        x: 500,
        y: 629,
        width: 867,
        height: 144,
        summary: `Kunjungan tercatat: ${dashboardSummary?.attendanceCount ?? "—"}`,
      },
      {
        label: "Buka Laporan Pendaftaran Member",
        href: "/owner/registrations",
        x: 500,
        y: 823,
        width: 867,
        height: 143,
        summary: `Total member: ${dashboardSummary?.memberCount ?? "—"} · transaksi lunas: ${dashboardSummary?.paidTransactionCount ?? "—"}`,
      },
    ];

    return (
      <>
        {renderSidebar()}
        {cards.map((card) => (
          <Link
            key={card.href}
            aria-label={card.label}
            className="owner-hotspot"
            href={card.href}
            style={framePosition(card.x, card.y, card.width, card.height)}
          >
            <span className="owner-dashboard-count">{card.summary}</span>
          </Link>
        ))}
      </>
    );
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (toDate < fromDate) {
      setFeedback("Tanggal akhir tidak boleh lebih awal daripada tanggal mulai.");
      return;
    }

    setLoadingReport(true);
    setFeedback("");
    setReportRows(null);
    try {
      const params = new URLSearchParams({ startDate: fromDate, endDate: toDate });
      const apiReport = reportSection === "visits" ? "attendance" : reportSection;
      const response = await fetch(
        `/api/owner/reports/${apiReport}?${params.toString()}`,
      );
      const result = (await response.json()) as {
        error?: string;
        count?: number;
        total?: string;
        data?: OwnerReportRecord[];
      };
      if (!response.ok) throw new Error(result.error ?? "Laporan tidak dapat diambil.");
      setReportRows((result.data ?? []).map((row) => {
        const member = row.member as {
          id_member?: string;
          users?: { nama?: string };
          kartu_member?: unknown;
        } | undefined;
        const cleaningStaff = row.cs as { users?: { nama?: string } } | undefined;
        const membership = row.jenis_member as { nama_jenis?: string } | undefined;
        const cards = member && Array.isArray(member.kartu_member)
          ? member.kartu_member as { id_kartu: string }[]
          : [];
        const transactionDate = typeof row.tgl_transaksi === "string" ? row.tgl_transaksi.slice(0, 10) : "";
        const attendanceDate = typeof row.tgl_checkin === "string" ? row.tgl_checkin.slice(0, 10) : "";

        if (reportSection === "revenue") {
          return [
            typeof row.id_transaksi === "string" ? row.id_transaksi : "—",
            member?.users?.nama ?? "—",
            typeof row.jenis_transaksi === "string" ? row.jenis_transaksi : "—",
            formatReportDate(transactionDate),
            typeof row.metode_bayar === "string" ? row.metode_bayar : "—",
            `Rp${Number(row.jumlah_bayar ?? 0).toLocaleString("id-ID")}`,
            typeof row.status_bayar === "string" ? row.status_bayar : "—",
          ];
        }
        if (reportSection === "facilities") {
          return [
            typeof row.nama_fasilitas === "string" ? row.nama_fasilitas : "—",
            typeof row.status_laporan === "string" ? row.status_laporan : "—",
            cleaningStaff?.users?.nama ?? "—",
          ];
        }
        if (reportSection === "visits") {
          const time = typeof row.jam_checkin === "string" ? row.jam_checkin.slice(11, 16) : "";
          return [
            cards.map((card) => card.id_kartu).filter(Boolean).join(", ") || "—",
            member?.users?.nama ?? "—",
            formatReportDate(attendanceDate),
            time || "—",
          ];
        }
        return [
          member?.id_member ?? "—",
          member?.users?.nama ?? "—",
          membership?.nama_jenis ?? "—",
          formatReportDate(transactionDate),
          typeof row.status_bayar === "string" ? row.status_bayar : "—",
        ];
      }));
      setReportTotal(reportSection === "revenue" ? result.total ?? "0" : null);
      setFeedback("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Laporan tidak dapat diambil.");
    } finally {
      setLoadingReport(false);
    }
  }

  function renderReportForm() {
    const isRevenue = reportSection === "revenue";
    const from = isRevenue ? { x: 526, y: 308, width: 380, height: 68 } : { x: 512, y: 308, width: 380, height: 68 };
    const to = isRevenue ? { x: 933, y: 308, width: 374, height: 68 } : { x: 923, y: 308, width: 374, height: 68 };
    const show = isRevenue ? { x: 526, y: 402, width: 314, height: 68 } : { x: 512, y: 402, width: 319, height: 68 };
    const cancel = isRevenue ? { x: 867, y: 402, width: 131, height: 68 } : { x: 857, y: 402, width: 131, height: 68 };

    return (
      <>
        {renderSidebar()}
        <form className="owner-report-overlay" onSubmit={submitReport}>
          <input
            aria-label="Dari Tanggal"
            className="owner-date-control"
            max={toDate || undefined}
            onChange={(event) => {
              setFromDate(event.target.value);
              setFeedback("");
            }}
            required
            style={framePosition(from.x, from.y, from.width, from.height)}
            type="date"
            value={fromDate}
          />
          <input
            aria-label="Sampai Tanggal"
            className="owner-date-control"
            min={fromDate || undefined}
            onChange={(event) => {
              setToDate(event.target.value);
              setFeedback("");
            }}
            required
            style={framePosition(to.x, to.y, to.width, to.height)}
            type="date"
            value={toDate}
          />
          <OwnerHotspot
            label="Tampilkan Laporan"
            style={framePosition(show.x, show.y, show.width, show.height)}
            type="submit"
          />
          <OwnerHotspot
            label="Batal"
            onClick={() => router.push("/owner/dashboard")}
            style={framePosition(cancel.x, cancel.y, cancel.width, cancel.height)}
          />
        </form>
      </>
    );
  }

  function renderReportResults() {
    const reportTitle = {
      revenue: "Laporan Pendapatan",
      facilities: "Laporan Kondisi Fasilitas",
      visits: "Laporan Kunjungan Member",
      registrations: "Laporan Pendaftaran Member",
    }[reportSection];
    const headers = {
      revenue: ["ID Transaksi", "Nama", "Jenis", "Tanggal", "Metode", "Jumlah", "Status"],
      facilities: ["Nama Fasilitas", "Status", "Nama Petugas"],
      visits: ["No Kartu", "Nama", "Tanggal", "Waktu Hadir"],
      registrations: ["No Member", "Nama", "Jenis", "Tanggal Daftar", "Status Transaksi"],
    }[reportSection];
    const columnWidths = {
      revenue: ["15%", "17%", "14%", "15%", "12%", "15%", "12%"],
      facilities: ["34%", "27%", "39%"],
      visits: ["20%", "28%", "26%", "26%"],
      registrations: ["15%", "25%", "20%", "22%", "18%"],
    }[reportSection];
    const subtitle = reportSection === "visits"
      ? "Rekap Kehadiran Member"
      : reportSection === "registrations"
        ? "Pendaftaran Terbaru"
        : "";

    return (
      <>
        {renderSidebar()}
        <section aria-label={reportTitle} className="owner-report-results">
          <div className="owner-report-results-heading">
            <div>
              <h1>{reportTitle}</h1>
              <p>
                Periode: {formatReportPeriodDate(fromDate)} - {formatReportPeriodDate(toDate)}
              </p>
            </div>
            <button
              className="owner-report-back"
              onClick={() => {
                setReportRows(null);
                setReportTotal(null);
              }}
              type="button"
            >
              Kembali ke Filter
            </button>
          </div>
          {reportSection === "revenue" && (
            <div className="owner-report-total">
              <span>Total Pendapatan</span>
              <strong>Rp{Number(reportTotal ?? 0).toLocaleString("id-ID")}</strong>
              <small>Akumulasi transaksi dengan status Lunas</small>
            </div>
          )}
          {subtitle && <h2 className="owner-report-subtitle">{subtitle}</h2>}
          <div className="owner-report-table-card">
            <div className="owner-report-table-scroll">
              <table className="owner-report-table">
                <colgroup>
                  {columnWidths.map((width, index) => (
                    <col key={headers[index]} style={{ width }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
                </thead>
                <tbody>
                  {reportRows?.map((row, rowIndex) => (
                    <tr key={`${row[0]}-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td
                          className={
                            (reportSection === "revenue" && cellIndex === 5) ||
                            (reportSection === "visits" && cellIndex === 3)
                              ? "owner-report-cell-numeric"
                              : undefined
                          }
                          key={`${headers[cellIndex]}-${cellIndex}`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {reportRows?.length === 0 && (
                    <tr>
                      <td className="owner-report-empty" colSpan={headers.length}>
                        Tidak ada data laporan pada periode yang dipilih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {reportSection === "visits" && (
              <p className="owner-report-note">
                Database tidak mencatat kartu yang digunakan saat check-in. Nomor kartu yang ditampilkan
                adalah kartu yang terhubung ke member.
              </p>
            )}
            {reportSection === "registrations" && (
              <p className="owner-report-note">
                Data pendaftaran dan status berasal dari transaksi berjenis Pendaftaran; status yang
                ditampilkan adalah status pembayaran transaksi.
              </p>
            )}
          </div>
        </section>
      </>
    );
  }

  return (
    <main className="owner-screen">
      <OwnerStage frame={frame}>
        {isDashboard
          ? renderDashboard()
          : reportRows
            ? renderReportResults()
            : renderReportForm()}
        {dashboardSummary && isDashboard && (
          <span className="sr-only" role="status">
            {dashboardSummary.memberCount} member; {dashboardSummary.activeMemberships} membership aktif;
            {` ${dashboardSummary.attendanceCount} kunjungan; ${dashboardSummary.facilityReportCount} laporan fasilitas.`}
          </span>
        )}
        {loadingReport && <span className="sr-only" role="status">Memuat laporan...</span>}
        {feedback && (
          <p className="owner-report-feedback" role="status">{feedback}          </p>
        )}
      </OwnerStage>
    </main>
  );
}
