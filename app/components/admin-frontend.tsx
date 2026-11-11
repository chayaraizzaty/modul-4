"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import LogoutLink from "./logout-link";

const FRAMES = {
  login: "A01 Login admin.png",
  dashboard: "A02_Dashboard Admin.png",
  registrationList: "A03_Pendaftaran.png",
  registrationForm: "A03_Pendaftaran (Tambah member).png",
  registrationInvalid: "A03_Pendaftaran (Tambah member)-1.png",
  registrationGender: "A03-1 Memilih Jenis Kelamin.png",
  registrationMembership: "A03-3 Memilih Jenis Membership (Pelajar).png",
  registrationSaved: "A03-3 Memilih Jenis Membership (Pelajar)-1.png",
  registrationUpdatedList: "A03-3 Memilih Jenis Membership (Pelajar)-2.png",
  registrationFinalList: "A03-3 Memilih Jenis Membership (Pelajar)-3.png",
  payments: "A04_Pembayaran.png",
  paymentForm: "A04_Pembayaran-1.png",
  paymentName: "A04_Pembayaran-2.png",
  paymentType: "A04_Pembayaran-3.png",
  paymentCash: "A04_Pembayaran-4.png",
  paymentAmount: "A04_Pembayaran-5.png",
  paymentSuccess: "A04_Pembayaran-6.png",
  paymentInvalid: "A04_Pembayaran-7.png",
  paymentQrHistory: "A04_Pembayaran-8.png",
  paymentCashHistory: "A04_Pembayaran-9.png",
  paymentQrHistoryAlt: "A04_Pembayaran-10.png",
  paymentCashHistoryAlt: "A04_Pembayaran-11.png",
  memberList: "1 Kartu membership.png",
  memberCardForm: "2.1 Kartu member.png",
  memberCardNumber: "2.1.1 Kartu member.png",
  memberActive: "2.1.2 Kartu member.png",
  memberCardPreview: "2.1.3 Kartu member.png",
  memberCardSaved: "2.1.4 kartu member.png",
  memberInactiveForm: "2.2 kartu member.png",
  memberInactiveNumber: "2.2.1 kartu member.png",
  memberInactive: "2.2.2 kartu member.png",
  attendanceList: "1 kehadiran member.png",
  attendanceCard: "2.1 kehadiran member.png",
  attendanceCardNumber: "2.1.1 kehadiran member.png",
  attendanceCardFound: "2.1.2 kehadiran member.png",
  attendanceStatus: "2.1.3 kehadiran member.png",
  attendanceStatusNumber: "2.1.4 kehadiran member.png",
  attendanceActive: "2.1.5 kehadiran member.png",
  attendanceChecked: "2.1.6 kehadiran member.png",
  attendanceSuccess: "2.1.7 kehadiran member.png",
  attendanceRecap: "2.1.8 kehadiran member.png",
  attendanceInactiveCard: "2.2 kehadiran member.png",
  attendanceInactiveNumber: "2.2.1 kehadiran member.png",
  attendanceInactiveFound: "2.2.2 kehadiran member.png",
  attendanceInactiveStatus: "2.2.3 kehadiran member.png",
  attendanceInactiveStatusNumber: "2.2.4 kehadiran member.png",
  attendanceInactive: "2.2.5 kehadiran member.png",
  attendanceInvalidCard: "2.3 kehadiran member.png",
  attendanceInvalidNumber: "2.3.1 kehadiran member.png",
  attendanceInvalid: "2.3.2 kehadiran member.png",
  notifications: "1_Notifikasi.png",
  notificationSent: "2.1.1 notifikasi.png",
  schedule: "A08_Jadwal Piket.png",
  scheduleUpdated: "A08_Jadwal Piket-1.png",
} as const;

type Frame = (typeof FRAMES)[keyof typeof FRAMES];

function isFrame(frame: Frame, candidates: readonly Frame[]): boolean {
  return candidates.some((candidate) => candidate === frame);
}

const ADMIN_NAVIGATION = [
  { section: "dashboard", label: "Dashboard", href: "/admin/dashboard" },
  { section: "registration", label: "Pendaftaran Membership", href: "/admin/registration" },
  { section: "payments", label: "Pembayaran", href: "/admin/payments" },
  { section: "members", label: "Kartu Membership", href: "/admin/members" },
  { section: "attendance", label: "Kehadiran Member", href: "/admin/attendance" },
  { section: "notifications", label: "Notifikasi Perpanjangan", href: "/admin/notifications" },
  { section: "schedule", label: "Jadwal Piket", href: "/admin/schedule" },
] as const;

const INITIAL_FRAMES: Record<string, Frame> = {
  dashboard: FRAMES.dashboard,
  registration: FRAMES.registrationList,
  payments: FRAMES.payments,
  members: FRAMES.memberList,
  attendance: FRAMES.attendanceList,
  notifications: FRAMES.notifications,
  schedule: FRAMES.schedule,
};

function frameStyle(x: number, y: number, width: number, height: number): CSSProperties {
  return {
    left: `${(x / 1440) * 100}%`,
    top: `${(y / 1024) * 100}%`,
    width: `${(width / 1440) * 100}%`,
    height: `${(height / 1024) * 100}%`,
  };
}

function FrameStage({ frame, children }: { frame: Frame; children?: ReactNode }) {
  return (
    <div className="admin-reference-stage">
      <Image
        src={`/figma/admin/frames/${encodeURIComponent(frame)}`}
        alt={`Referensi desain Admin: ${frame.replace(/\.png$/i, "")}`}
        fill
        priority
        sizes="100vw"
        unoptimized
      />
      {children}
    </div>
  );
}

function Hotspot({
  label,
  x,
  y,
  width,
  height,
  onClick,
  type = "button",
}: {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      aria-label={label}
      className="admin-hotspot"
      onClick={onClick}
      style={frameStyle(x, y, width, height)}
      type={type}
    />
  );
}

function OverlayInput({
  label,
  x,
  y,
  width,
  height,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  name,
  variant = "standard",
}: {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  name: string;
  variant?: "standard" | "search" | "active" | "password";
}) {
  return (
    <input
      aria-label={label}
      autoComplete="off"
      className={`admin-overlay-input admin-overlay-input-${variant}`}
      name={name}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      required={required}
      style={frameStyle(x, y, width, height)}
      type={type}
      value={value}
    />
  );
}

export function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role: "admin" }),
      });
      const result = (await response.json()) as {
        error?: string;
        user?: { role: string };
      };
      if (!response.ok || result.user?.role !== "admin") {
        setLoginError(result.error ?? "Username atau password tidak valid.");
        return;
      }
      router.push("/admin/dashboard");
    } catch {
      setLoginError("Server tidak dapat dijangkau.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-reference-screen">
      <FrameStage frame={FRAMES.login}>
        <form aria-label="Login Admin" className="admin-reference-overlay" onSubmit={submit}>
          <OverlayInput
            height={52}
            label="Username Admin"
            name="username"
            onChange={setUsername}
            placeholder="Enter your username"
            required
            value={username}
            width={400}
            x={842}
            y={456}
          />
          <OverlayInput
            height={52}
            label="Password Admin"
            name="password"
            onChange={setPassword}
            placeholder="Enter your password"
            required
            type={passwordVisible ? "text" : "password"}
            value={password}
            variant="password"
            width={352}
            x={842}
            y={561}
          />
          <button
            aria-label={passwordVisible ? "Sembunyikan password" : "Tampilkan password"}
            className="admin-password-toggle"
            onClick={() => setPasswordVisible((visible) => !visible)}
            style={frameStyle(1194, 561, 48, 52)}
            type="button"
          >
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {!passwordVisible && <path d="m3 3 18 18" />}
            </svg>
          </button>
          <Hotspot height={52} label="Login Admin" type="submit" width={400} x={842} y={656} />
          <Hotspot height={24} label="Kembali ke pilihan aktor" onClick={() => router.push("/sign-in")} width={52} x={1015} y={710} />
          {loginError && <p className="auth-feedback" role="alert">{loginError}</p>}
          {submitting && <span className="sr-only" role="status">Memproses login...</span>}
        </form>
      </FrameStage>
    </main>
  );
}

export function RoleLoginReference({
  role,
}: {
  role: "owner" | "cleaning-service";
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const roleLabel = role === "owner" ? "Owner" : "Cleaning Service";
  const dashboardLabel = role === "owner" ? "owner" : "cleaning service";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });
      const result = (await response.json()) as {
        error?: string;
        user?: { role: string };
      };
      if (!response.ok || result.user?.role !== role) {
        setLoginError(result.error ?? "Username atau password tidak valid.");
        return;
      }
      router.push(`/${role}/dashboard`);
    } catch {
      setLoginError("Server tidak dapat dijangkau.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-reference-screen">
      <div className="admin-reference-stage">
        <Image
          src={`/figma/admin/frames/${encodeURIComponent(FRAMES.login)}`}
          alt={`Referensi desain login ${roleLabel}`}
          fill
          priority
          sizes="100vw"
          unoptimized
        />
        <form
          aria-label={`Login ${roleLabel}`}
          className="admin-reference-overlay"
          onSubmit={submit}
        >
          <div className="admin-role-subtitle">
            Login untuk mengakses dashboard {dashboardLabel}
          </div>
          <OverlayInput
            height={52}
            label={`Username ${roleLabel}`}
            name="username"
            onChange={setUsername}
            placeholder="Enter your username"
            required
            value={username}
            width={400}
            x={842}
            y={456}
          />
          <OverlayInput
            height={52}
            label={`Password ${roleLabel}`}
            name="password"
            onChange={setPassword}
            placeholder="Enter your password"
            required
            type={passwordVisible ? "text" : "password"}
            value={password}
            variant="password"
            width={352}
            x={842}
            y={561}
          />
          <button
            aria-label={passwordVisible ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={passwordVisible}
            className="admin-password-toggle"
            onClick={() => setPasswordVisible((visible) => !visible)}
            style={frameStyle(1194, 561, 48, 52)}
            type="button"
          >
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {!passwordVisible && <path d="m3 3 18 18" />}
            </svg>
          </button>
          <Hotspot
            height={52}
            label={`Login ${roleLabel}`}
            type="submit"
            width={400}
            x={842}
            y={656}
          />
          <Hotspot
            height={24}
            label="Kembali ke pilihan aktor"
            onClick={() => router.push("/sign-in")}
            width={90}
            x={996}
            y={710}
          />
          {loginError && <p className="auth-feedback" role="alert">{loginError}</p>}
          {submitting && <span className="sr-only" role="status">Memproses login...</span>}
        </form>
      </div>
    </main>
  );
}

type ApiResult = {
  error?: string;
  data?: unknown[];
  types?: unknown[];
  staff?: unknown[];
  [key: string]: unknown;
};

type AdminMemberRow = {
  id_member: string;
  users: { nama: string };
  kartu_member?: { id_kartu: string; status_kartu: string }[];
  transaksi?: {
    status_bayar: string;
    tgl_transaksi: string;
    tgl_mulai: string;
    tgl_berakhir: string;
    jenis_member?: { nama_jenis: string };
  }[];
};

type AdminPaymentRow = {
  id_transaksi: string;
  tgl_transaksi?: string;
  metode_bayar?: string;
  status_bayar: string;
  jumlah_bayar: string;
  member: { users: { nama: string } };
  jenis_member: { nama_jenis: string };
};

type AdminCardRow = {
  id_kartu: string;
  status_kartu: string;
  member: { users: { nama: string }; transaksi?: { id_transaksi: string }[] };
};

type AdminAttendanceRow = {
  id_checkin: string;
  tgl_checkin: string;
  jam_checkin: string;
  member: { users: { nama: string } };
};

type AdminNotificationRow = {
  id_notifikasi: string;
  jenis_notifikasi: string;
  member: { id_member: string; users: { nama: string } };
  transaksi?: { tgl_berakhir: string; status_bayar: string } | null;
};

type AdminScheduleRow = {
  id_jadwal: string;
  tgl_piket: string;
  jam_mulai: string;
  id_cs?: string;
  cs?: { id_cs: string; users: { nama: string } };
};

type MembershipOption = {
  id_jenis: string;
  nama_jenis: string;
  harga: string;
  durasi_hari: number;
};

type StaffOption = {
  id_cs: string;
  users: { nama: string };
};

type AdminLiveTableVariant =
  | "registration"
  | "payments"
  | "members"
  | "attendance"
  | "notifications"
  | "schedule";

function AdminLiveTable({
  variant,
  label,
  headers,
  rows,
  emptyMessage,
}: {
  variant: AdminLiveTableVariant;
  label: string;
  headers: string[];
  rows: { id: string; cells: ReactNode[] }[];
  emptyMessage: string;
}) {
  return (
    <div className={`admin-live-list admin-live-list-${variant}`}>
      <table aria-label={label}>
        <thead>
          <tr>
            {headers.map((header) => <th key={header} scope="col">{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {row.cells.map((cell, index) => <td key={`${row.id}-${index}`}>{cell}</td>)}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td className="admin-live-empty" colSpan={headers.length}>{emptyMessage}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const statusClass =
    status === "Lunas"
      ? "admin-payment-status-paid"
      : status === "Ditolak"
        ? "admin-payment-status-rejected"
        : "admin-payment-status-pending";
  return <span className={`admin-payment-status ${statusClass}`}>{status}</span>;
}

export default function AdminWorkspace({ section }: { section: string }) {
  const router = useRouter();
  const [frame, setFrame] = useState<Frame>(INITIAL_FRAMES[section] ?? FRAMES.dashboard);
  const [values, setValues] = useState<Record<string, string>>({});
  const [selectedMember, setSelectedMember] = useState("");
  const [checkedIn, setCheckedIn] = useState(false);
  const [search, setSearch] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState("");
  const [selectedPaymentReview, setSelectedPaymentReview] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("QRIS");
  const [attendanceBranch, setAttendanceBranch] = useState<"active" | "inactive">("active");
  const [members, setMembers] = useState<AdminMemberRow[]>([]);
  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);
  const [attendance, setAttendance] = useState<AdminAttendanceRow[]>([]);
  const [notifications, setNotifications] = useState<AdminNotificationRow[]>([]);
  const [schedules, setSchedules] = useState<AdminScheduleRow[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<MembershipOption[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [dashboardStats, setDashboardStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const value = (name: string) => values[name] ?? "";
  const setValue = (name: string, next: string) => setValues((current) => ({ ...current, [name]: next }));

  useEffect(() => {
    const resourceBySection: Record<string, string> = {
      dashboard: "dashboard",
      registration: "members",
      payments: "payments",
      members: "cards",
      attendance: "attendance",
      notifications: "notifications",
      schedule: "schedules",
    };
    const resource = resourceBySection[section];
    if (!resource) return;
    let active = true;
    void fetch(`/api/admin/${resource}`)
      .then(async (response) => {
        const result = await response.json() as ApiResult;
        if (!response.ok) throw new Error(result.error ?? "Data Admin gagal dimuat.");
        if (!active) return;
        if (resource === "dashboard") setDashboardStats(result as Record<string, number>);
        if (resource === "members") {
          if (Array.isArray(result.data)) setMembers(result.data as AdminMemberRow[]);
          if (Array.isArray(result.types)) setMembershipTypes(result.types as MembershipOption[]);
        }
        if (resource === "payments") {
          if (Array.isArray(result.data)) setPayments(result.data as AdminPaymentRow[]);
          if (Array.isArray(result.types)) setMembershipTypes(result.types as MembershipOption[]);
        }
        if (resource === "cards") {
          void fetch("/api/admin/members")
            .then(async (response) => {
              const membersResult = await response.json() as ApiResult;
              if (!response.ok) throw new Error(membersResult.error ?? "Daftar member gagal dimuat.");
              if (active && Array.isArray(membersResult.data)) setMembers(membersResult.data as AdminMemberRow[]);
            })
            .catch((error: unknown) => {
              if (active) setFeedback(error instanceof Error ? error.message : "Daftar member gagal dimuat.");
            });
        }
        if (resource === "attendance" && Array.isArray(result.data)) setAttendance(result.data as AdminAttendanceRow[]);
        if (resource === "notifications" && Array.isArray(result.data)) setNotifications(result.data as AdminNotificationRow[]);
        if (resource === "schedules") {
          if (Array.isArray(result.data)) setSchedules(result.data as AdminScheduleRow[]);
          if (Array.isArray(result.staff)) setStaffOptions(result.staff as StaffOption[]);
        }
      })
      .catch((error: unknown) => {
        if (active) setFeedback(error instanceof Error ? error.message : "Data Admin gagal dimuat.");
      });
    return () => { active = false; };
  }, [section]);

  useEffect(() => {
    if (section !== "dashboard") return;
    let active = true;
    void Promise.all(
      ["payments", "schedules"].map(async (resource) => {
        const response = await fetch(`/api/admin/${resource}`);
        const result = await response.json() as ApiResult;
        if (!response.ok) throw new Error(result.error ?? `Data ${resource} gagal dimuat.`);
        return { resource, result };
      }),
    )
      .then((results) => {
        if (!active) return;
        for (const { resource, result } of results) {
          if (resource === "payments" && Array.isArray(result.data)) {
            setPayments(result.data as AdminPaymentRow[]);
          }
          if (resource === "schedules" && Array.isArray(result.data)) {
            setSchedules(result.data as AdminScheduleRow[]);
          }
        }
      })
      .catch((error: unknown) => {
        if (active) setFeedback(error instanceof Error ? error.message : "Data dashboard gagal dimuat.");
      });
    return () => { active = false; };
  }, [section]);

  async function submitApi(resource: string, method: "POST" | "PATCH", body: Record<string, unknown>) {
    setLoading(true);
    setFeedback("");
    try {
      const response = await fetch(`/api/admin/${resource}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json() as ApiResult;
      if (!response.ok) throw new Error(result.error ?? "Operasi Admin gagal.");
      setFeedback("Data berhasil disimpan.");
      const listResource = resource === "cards" || resource === "members" ? "members" : resource;
      const refresh = await fetch(`/api/admin/${listResource}`);
      const refreshed = await refresh.json() as ApiResult;
      if (!refresh.ok) throw new Error("Data tersimpan, tetapi daftar terbaru gagal dimuat.");
      if (listResource === "members" && Array.isArray(refreshed.data)) setMembers(refreshed.data as AdminMemberRow[]);
      if (listResource === "payments" && Array.isArray(refreshed.data)) setPayments(refreshed.data as AdminPaymentRow[]);
      if (listResource === "attendance" && Array.isArray(refreshed.data)) setAttendance(refreshed.data as AdminAttendanceRow[]);
      if (listResource === "notifications" && Array.isArray(refreshed.data)) setNotifications(refreshed.data as AdminNotificationRow[]);
      if (listResource === "schedules" && Array.isArray(refreshed.data)) setSchedules(refreshed.data as AdminScheduleRow[]);
      return true;
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Operasi Admin gagal.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function reviewPayment(decision: "approve" | "reject") {
    if (!selectedPaymentReview) return;
    const saved = await submitApi("payments", "POST", {
      transactionId: selectedPaymentReview,
      decision,
    });
    if (saved) {
      setSelectedPaymentReview(null);
      setFrame(FRAMES.payments);
    }
  }

  function renderNavigation() {
    const positions = [156, 244, 327, 407, 485, 569, 653];
    return (
      <>
        {ADMIN_NAVIGATION.map((item, index) => (
          <Hotspot key={item.section} height={57} label={item.label} onClick={() => router.push(item.href)} width={311} x={44} y={positions[index]} />
        ))}
        <LogoutLink
          className="admin-hotspot"
          style={frameStyle(48, 894, 250, 60)}
        />
      </>
    );
  }

  function renderRegistration() {
    if (isFrame(frame, [FRAMES.registrationList, FRAMES.registrationUpdatedList, FRAMES.registrationFinalList])) {
      return (
        <>
          <AdminLiveTable
            variant="registration"
            label="Pendaftaran member dari database"
            headers={["No Member", "Nama", "Jenis", "Tanggal Daftar", "Status"]}
            rows={members.slice(0, 5).map((member) => ({
              id: member.id_member,
              cells: [
                <span className="admin-live-id" key="id">{member.id_member}</span>,
                member.users.nama,
                member.transaksi?.[0]?.jenis_member?.nama_jenis ?? "Belum ada transaksi",
                <span className="admin-live-date" key="date">
                  {member.transaksi?.[0]?.tgl_transaksi.slice(0, 10) ?? "—"}
                </span>,
                member.transaksi?.[0]
                  ? <PaymentStatusBadge key="status" status={member.transaksi[0].status_bayar} />
                  : "—",
              ],
            }))}
            emptyMessage="Belum ada data pendaftaran member."
          />
          <Hotspot
            height={48}
            label="Tambah Member"
            onClick={() => {
              setValues({});
              setFrame(frame === FRAMES.registrationUpdatedList ? FRAMES.registrationFinalList : FRAMES.registrationForm);
            }}
            width={805}
            x={537}
            y={170}
          />
          <Hotspot height={48} label="Buka data member terdaftar" onClick={() => setFrame(FRAMES.memberList)} width={900} x={464} y={344} />
        </>
      );
    }
    if (frame === FRAMES.registrationInvalid) {
      return <Hotspot height={52} label="Kembali ke formulir pendaftaran" onClick={() => setFrame(FRAMES.registrationForm)} width={90} x={1115} y={600} />;
    }
    if (frame === FRAMES.registrationSaved) {
      return <Hotspot height={52} label="Kembali ke daftar member" onClick={() => setFrame(FRAMES.registrationUpdatedList)} width={90} x={1230} y={600} />;
    }

    return (
      <form
        className="admin-reference-overlay"
        onSubmit={async (event) => {
          event.preventDefault();
          const required = ["memberName", "gender", "phone", "address", "city", "membership"];
          if (required.some((field) => !value(field).trim())) {
            setFeedback("Semua kolom pendaftaran wajib diisi.");
            setFrame(FRAMES.registrationInvalid);
            return;
          }
          const saved = await submitApi("members", "POST", {
            name: value("memberName"),
            gender: value("gender"),
            phone: value("phone"),
            address: value("address"),
            city: value("city"),
            membershipType: value("membership"),
          });
          if (saved) setFrame(FRAMES.registrationSaved);
        }}
      >
        <OverlayInput height={49} label="Nama Member" name="memberName" onChange={(next) => { setValue("memberName", next); if (next) setFrame(FRAMES.registrationGender); }} required value={value("memberName")} width={778} x={542} y={248} />
        <OverlayInput height={52} label="Nomor HP" name="phone" onChange={(next) => setValue("phone", next)} required type="tel" value={value("phone")} width={369} x={950} y={348} />
        <OverlayInput height={50} label="Alamat" name="address" onChange={(next) => setValue("address", next)} required value={value("address")} width={369} x={542} y={450} />
        <OverlayInput height={50} label="Kota" name="city" onChange={(next) => setValue("city", next)} required value={value("city")} width={369} x={950} y={450} />
        <select aria-label="Jenis Kelamin" className="admin-overlay-input" onChange={(event) => { setValue("gender", event.target.value); setFrame(FRAMES.registrationGender); }} required style={frameStyle(542, 348, 369, 52)} value={value("gender")}>
          <option value="">Pilih Jenis Kelamin</option><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option>
        </select>
        <select aria-label="Jenis Membership" className="admin-overlay-input" onChange={(event) => { setValue("membership", event.target.value); setFrame(FRAMES.registrationMembership); }} required style={frameStyle(542, 550, 369, 50)} value={value("membership")}>
          <option value="">Pilih Jenis Membership</option>{membershipTypes.map((type) => <option key={type.id_jenis} value={type.nama_jenis}>{type.nama_jenis}</option>)}
        </select>
        <Hotspot height={38} label="Batalkan pendaftaran" onClick={() => setFrame(FRAMES.registrationList)} width={89} x={1115} y={600} />
        <Hotspot height={38} label="Simpan pendaftaran member" type="submit" width={89} x={1230} y={600} />
      </form>
    );
  }

  function renderPayments() {
    if (isFrame(frame, [FRAMES.paymentQrHistory, FRAMES.paymentCashHistory, FRAMES.paymentQrHistoryAlt, FRAMES.paymentCashHistoryAlt])) {
      const isCash = isFrame(frame, [FRAMES.paymentCashHistory, FRAMES.paymentCashHistoryAlt]);
      return (
        <>
          <Hotspot height={21} label="Lihat pembayaran tersimpan" onClick={() => setFrame(isCash ? FRAMES.paymentCashHistoryAlt : FRAMES.paymentQrHistoryAlt)} width={870} x={464} y={415} />
          <Hotspot height={50} label="Input pembayaran berikutnya" onClick={() => { setValues({}); setPaymentMethod("QRIS"); setFrame(FRAMES.payments); }} width={808} x={536} y={170} />
        </>
      );
    }
    if (frame === FRAMES.paymentSuccess || frame === FRAMES.paymentInvalid) {
      return <Hotspot height={44} label="Kembali ke pembayaran" onClick={() => setFrame(frame === FRAMES.paymentInvalid ? FRAMES.payments : paymentMethod === "Tunai" ? FRAMES.paymentCashHistory : FRAMES.paymentQrHistory)} width={150} x={643} y={577} />;
    }
    if (frame === FRAMES.payments) {
      return (
        <>
          <AdminLiveTable
            variant="payments"
            label="Transaksi dari database"
            headers={["ID Transaksi", "Nama Customer", "Membership", "Status", "Total", "Aksi"]}
            rows={payments.map((payment) => ({
              id: payment.id_transaksi,
              cells: [
                <span className="admin-live-id" key="id">{payment.id_transaksi}</span>,
                payment.member.users.nama,
                payment.jenis_member.nama_jenis,
                <PaymentStatusBadge key="status" status={payment.status_bayar} />,
                <span className="admin-live-amount" key="amount">
                  Rp{Number(payment.jumlah_bayar).toLocaleString("id-ID")}
                </span>,
                payment.status_bayar === "Menunggu Verifikasi" ? (
                  <button
                    className="admin-live-action"
                    disabled={loading}
                    key="action"
                    onClick={() => setSelectedPaymentReview(payment.id_transaksi)}
                    type="button"
                  >
                    Validasi
                  </button>
                ) : (
                  <span className="admin-live-no-action" key="action">—</span>
                ),
              ],
            }))}
            emptyMessage="Belum ada transaksi."
          />
          <Hotspot height={48} label="Input Pembayaran" onClick={() => { setValues({}); setPaymentMethod("QRIS"); setFrame(FRAMES.paymentForm); }} width={806} x={536} y={170} />
          {selectedPaymentReview && (
            <div className="admin-payment-review-backdrop">
              <section
                aria-labelledby="admin-payment-review-title"
                aria-modal="true"
                className="admin-payment-review-card"
                role="dialog"
              >
                <h2 id="admin-payment-review-title">Validasi Pembayaran</h2>
                <p>
                  {payments.find((payment) => payment.id_transaksi === selectedPaymentReview)?.member.users.nama}
                  {" · "}
                  {selectedPaymentReview}
                </p>
                <p>
                  Setujui hanya setelah pembayaran diperiksa. Persetujuan mengubah status menjadi Lunas
                  dan mengaktifkan masa membership. Penolakan mengubah status menjadi Ditolak.
                </p>
                <div className="admin-payment-review-actions">
                  <button
                    className="admin-payment-review-secondary"
                    disabled={loading}
                    onClick={() => setSelectedPaymentReview(null)}
                    type="button"
                  >
                    Batal
                  </button>
                  <button
                    className="admin-payment-review-secondary"
                    disabled={loading}
                    onClick={() => void reviewPayment("reject")}
                    type="button"
                  >
                    Tolak
                  </button>
                  <button
                    className="admin-payment-review-primary"
                    disabled={loading}
                    onClick={() => void reviewPayment("approve")}
                    type="button"
                  >
                    Setujui & Aktifkan
                  </button>
                </div>
              </section>
            </div>
          )}
        </>
      );
    }
    return (
      <form className="admin-reference-overlay" onSubmit={(event) => {
        event.preventDefault();
        void (async () => {
          if (!value("paymentMember").trim() || !value("paymentType").trim() || !value("paymentAmount").trim()) {
            setFeedback("Semua kolom pembayaran wajib diisi.");
            setFrame(FRAMES.paymentInvalid);
            return;
          }
          const saved = await submitApi("payments", "POST", {
            memberName: value("paymentMember"),
            paymentType: value("paymentType"),
            paymentMethod,
            amount: Number(value("paymentAmount")),
          });
          if (saved) setFrame(FRAMES.paymentSuccess);
          else setFrame(FRAMES.paymentInvalid);
        })();
      }}>
        <OverlayInput height={49} label="Nama Member" name="paymentMember" onChange={(next) => { setValue("paymentMember", next); if (next) setFrame(FRAMES.paymentName); }} placeholder="Masukkan nama member" required value={value("paymentMember")} width={779} x={542} y={248} />
        <select aria-label="Jenis Membership" className="admin-overlay-input" onChange={(event) => {
          setValue("paymentType", event.target.value);
          const type = membershipTypes.find((item) => item.nama_jenis === event.target.value);
          if (type) setValue("paymentAmount", type.harga);
          setFrame(FRAMES.paymentType);
        }} required style={frameStyle(542, 344, 779, 49)} value={value("paymentType")}>
          <option value="">Pilih Jenis Membership</option>{membershipTypes.map((type) => <option key={type.id_jenis} value={type.nama_jenis}>{type.nama_jenis}</option>)}
        </select>
        <Hotspot height={49} label="Pilih pembayaran QRIS" onClick={() => { setPaymentMethod("QRIS"); setFrame(FRAMES.paymentType); }} width={372} x={542} y={440} />
        <Hotspot height={49} label="Pilih pembayaran tunai" onClick={() => { setPaymentMethod("Tunai"); setFrame(FRAMES.paymentCash); }} width={372} x={949} y={440} />
        <OverlayInput height={49} label="Jumlah Pembayaran" name="paymentAmount" onChange={(next) => { setValue("paymentAmount", next); if (next) setFrame(FRAMES.paymentAmount); }} placeholder="Rp" required type="number" value={value("paymentAmount")} width={372} x={542} y={536} />
        <Hotspot height={39} label="Batalkan input pembayaran" onClick={() => setFrame(FRAMES.payments)} width={89} x={1117} y={552} />
        <Hotspot height={39} label="Simpan pembayaran" type="submit" width={89} x={1232} y={552} />
      </form>
    );
  }

  function renderMembers() {
    if (frame === FRAMES.memberList) {
      const visibleMembers = members.filter((member) =>
        `${member.users.nama} ${member.id_member}`.toLocaleLowerCase("id-ID").includes(search.toLocaleLowerCase("id-ID")),
      );
      return (
        <>
          <AdminLiveTable
            variant="members"
            label="Member dan kartu membership dari database"
            headers={["No Member", "Nama", "Jenis Member", "Tanggal Berakhir", "Kartu Member", "Aksi"]}
            rows={visibleMembers.slice(0, 5).map((member) => {
              const latestTransaction = member.transaksi?.[0];
              const existingCard = member.kartu_member?.[0];
              return {
                id: member.id_member,
                cells: [
                  <span className="admin-live-id" key="id">{member.id_member}</span>,
                  member.users.nama,
                  latestTransaction?.jenis_member?.nama_jenis ?? "—",
                  <span className="admin-live-date" key="date">
                    {latestTransaction?.tgl_berakhir.slice(0, 10) ?? "—"}
                  </span>,
                  existingCard?.id_kartu ?? "Belum ada kartu",
                  <button
                    className="admin-live-action"
                    key="action"
                    onClick={() => {
                      if (existingCard) {
                        setFeedback(`Kartu ${existingCard.id_kartu} (${existingCard.status_kartu}) sudah terdaftar.`);
                        return;
                      }
                      setSelectedMember(member.users.nama);
                      setValue("memberCardNumber", "");
                      setFrame(FRAMES.memberCardForm);
                    }}
                    type="button"
                  >
                    Pilih
                  </button>,
                ],
              };
            })}
            emptyMessage="Tidak ada member yang cocok."
          />
          <OverlayInput height={38} label="Cari nama atau ID member" name="member-search" onChange={setSearch} placeholder="Cari Nama/ ID Member" value={search} variant="search" width={898} x={506} y={203} />
          {visibleMembers.length === 0 && <p className="sr-only" role="status">Tidak ada member yang cocok dengan pencarian.</p>}
          <div className="sr-only" role="status">{feedback}</div>
        </>
      );
    }
    if (frame === FRAMES.memberActive) {
      return <Hotspot height={52} label="Selanjutnya, buat kartu membership" onClick={() => setFrame(FRAMES.memberCardPreview)} width={184} x={602} y={612} />;
    }
    if (frame === FRAMES.memberInactive) {
      return <Hotspot height={52} label="Kembali ke pemeriksaan kartu" onClick={() => setFrame(selectedMember === "Siti Kurniawan" ? FRAMES.memberInactiveNumber : FRAMES.memberCardForm)} width={184} x={630} y={607} />;
    }
    if (frame === FRAMES.memberCardPreview) {
      return (
        <>
          <Hotspot height={91} label="Simpan Kartu" onClick={() => {
            void submitApi("cards", "POST", {
              memberName: selectedMember,
              cardId: value("memberCardNumber").trim(),
            }).then((saved) => {
              if (saved) setFrame(FRAMES.memberCardSaved);
            });
          }} width={230} x={608} y={644} />
          <Hotspot height={91} label="Kembali ke daftar member" onClick={() => setFrame(FRAMES.memberList)} width={230} x={924} y={644} />
        </>
      );
    }
    if (frame === FRAMES.memberCardSaved) {
      return <Hotspot height={52} label="Kembali ke daftar" onClick={() => setFrame(FRAMES.memberList)} width={253} x={701} y={547} />;
    }
    const inactive = frame === FRAMES.memberInactiveForm || frame === FRAMES.memberInactiveNumber;
    return (
      <>
        <OverlayInput height={55} label="Nomor Kartu Member" name="memberCardNumber" onChange={(next) => { setValue("memberCardNumber", next); if (next) setFrame(inactive ? FRAMES.memberInactiveNumber : FRAMES.memberCardNumber); }} placeholder="Contoh: KM-0001" required value={value("memberCardNumber")} width={312} x={475} y={563} />
        <Hotspot height={42} label="Cek status membership" onClick={() => {
          if (!selectedMember || !value("memberCardNumber").trim()) {
            setFeedback("Pilih member dan isi nomor kartu terlebih dahulu.");
            return;
          }
          void fetch(`/api/admin/cards?memberName=${encodeURIComponent(selectedMember)}`)
            .then(async (response) => {
              const result = await response.json() as { error?: string; eligible?: boolean; existingCard?: { id_kartu: string } | null };
              if (!response.ok) throw new Error(result.error ?? "Status membership gagal diperiksa.");
              if (!result.eligible) {
                setFeedback("Membership belum lunas atau tidak aktif.");
                setFrame(FRAMES.memberInactive);
              } else if (result.existingCard) {
                setFeedback(`Member sudah memiliki kartu ${result.existingCard.id_kartu}.`);
                setFrame(FRAMES.memberInactive);
              } else {
                setFeedback("");
                setFrame(FRAMES.memberActive);
              }
            })
            .catch((error: unknown) => setFeedback(error instanceof Error ? error.message : "Status membership gagal diperiksa."));
        }} width={184} x={1043} y={642} />
      </>
    );
  }

  function renderAttendance() {
    if (frame === FRAMES.attendanceList) {
      return (
        <>
          <AdminLiveTable
            variant="attendance"
            label="Kehadiran dari database"
            headers={["Nama Member", "ID Check-in", "Tanggal", "Jam"]}
            rows={attendance.slice(0, 5).map((row) => ({
              id: row.id_checkin,
              cells: [
                row.member.users.nama,
                <span className="admin-live-id" key="id">{row.id_checkin}</span>,
                <span className="admin-live-date" key="date">{row.tgl_checkin.slice(0, 10)}</span>,
                <span className="admin-live-date" key="time">{row.jam_checkin.slice(11, 16)}</span>,
              ],
            }))}
            emptyMessage="Belum ada data kehadiran."
          />
          {[446, 498, 545].map((y, index) => <Hotspot key={y} height={22} label={`Catat kehadiran member ${index + 1}`} onClick={() => { setValue("attendanceCard", ""); setFrame(FRAMES.attendanceCard); }} width={76} x={1156} y={y} />)}
        </>
      );
    }
    if (isFrame(frame, [FRAMES.attendanceCardFound, FRAMES.attendanceInactiveFound])) {
      return <Hotspot height={52} label="Lanjutkan ke pengecekan status" onClick={() => setFrame(attendanceBranch === "active" ? FRAMES.attendanceStatus : FRAMES.attendanceInactiveStatus)} width={184} x={614} y={687} />;
    }
    if (frame === FRAMES.attendanceSuccess) {
      return <Hotspot height={52} label="Lihat rekapan kehadiran" onClick={() => setFrame(FRAMES.attendanceRecap)} width={524} x={455} y={632} />;
    }
    if (frame === FRAMES.attendanceRecap) {
      return <Hotspot height={52} label="Kembali ke daftar kehadiran" onClick={() => setFrame(FRAMES.attendanceList)} width={145} x={1254} y={555} />;
    }
    if (frame === FRAMES.attendanceActive || frame === FRAMES.attendanceChecked) {
      return (
        <>
          <Hotspot height={30} label={checkedIn ? "Batalkan tanda hadir" : "Tandai hadir hari ini"} onClick={() => { const next = !checkedIn; setCheckedIn(next); setFrame(next ? FRAMES.attendanceChecked : FRAMES.attendanceActive); }} width={30} x={493} y={865} />
          <Hotspot height={52} label="Simpan kehadiran" onClick={() => {
            if (!checkedIn) {
              setFeedback("Centang Hadir hari ini sebelum menyimpan.");
              return;
            }
            const cardId = value("attendanceStatusNumber") || value("attendanceCard");
            void submitApi("attendance", "POST", { cardId }).then((saved) => {
              if (saved) setFrame(FRAMES.attendanceSuccess);
            });
          }} width={184} x={1162} y={853} />
          <div className="sr-only" role="status">{feedback}</div>
        </>
      );
    }
    if (frame === FRAMES.attendanceInactive) {
      return <Hotspot height={52} label="Kembali ke pengecekan status membership" onClick={() => setFrame(attendanceBranch === "active" ? FRAMES.attendanceStatus : FRAMES.attendanceInactiveStatus)} width={184} x={756} y={867} />;
    }
    if (frame === FRAMES.attendanceInvalid) {
      return <Hotspot height={52} label="Kembali ke pemeriksaan nomor kartu" onClick={() => setFrame(FRAMES.attendanceInvalidCard)} width={184} x={614} y={687} />;
    }
    const statusEntry = isFrame(frame, [FRAMES.attendanceStatus, FRAMES.attendanceStatusNumber, FRAMES.attendanceInactiveStatus, FRAMES.attendanceInactiveStatusNumber]);
    const cardInput = statusEntry ? "attendanceStatusNumber" : "attendanceCard";
    return (
      <>
        <OverlayInput height={statusEntry ? 49 : 56} label="Nomor Kartu Member" name={cardInput} onChange={(next) => {
          setValue(cardInput, next);
          if (statusEntry) setFrame(attendanceBranch === "active" ? FRAMES.attendanceStatusNumber : FRAMES.attendanceInactiveStatusNumber);
          else if (next) setFrame(next.toUpperCase() === "KM-0002" ? FRAMES.attendanceInactiveNumber : next.toUpperCase() === "KM-0001" ? FRAMES.attendanceCardNumber : FRAMES.attendanceInvalidNumber);
        }} placeholder={statusEntry ? "" : "ex :MBR1022"} required value={value(cardInput)} variant="active" width={statusEntry ? 575 : 533} x={statusEntry ? 488 : 639} y={statusEntry ? 274 : 450} />
        <Hotspot height={52} label={statusEntry ? "Cek Status" : "Periksa Kartu"} onClick={() => {
          const card = value(cardInput).trim();
          if (!card) {
            setFeedback("Masukkan nomor kartu member.");
            return;
          }
          void fetch(`/api/admin/cards?cardId=${encodeURIComponent(card)}`)
            .then(async (response) => {
              const result = await response.json() as { error?: string; data?: AdminCardRow[] };
              if (!response.ok) throw new Error(result.error ?? "Kartu gagal diperiksa.");
              const found = result.data?.[0];
              if (!found) {
                setFrame(FRAMES.attendanceInvalid);
                setFeedback("Kartu tidak ditemukan.");
                return;
              }
              const active = found.status_kartu === "Aktif" && Boolean(found.member.transaksi?.length);
              setAttendanceBranch(active ? "active" : "inactive");
              setValue("attendanceCard", card);
              if (!active) {
                setFrame(FRAMES.attendanceInactiveFound);
                setFeedback("Membership belum lunas atau sudah tidak aktif.");
              } else if (statusEntry) {
                setCheckedIn(false);
                setFrame(FRAMES.attendanceActive);
                setFeedback("");
              } else {
                setValue("attendanceStatusNumber", card);
                setFrame(FRAMES.attendanceCardFound);
                setFeedback("");
              }
            })
            .catch((error: unknown) => {
              setFrame(FRAMES.attendanceInvalid);
              setFeedback(error instanceof Error ? error.message : "Kartu gagal diperiksa.");
            });
        }} width={183} x={statusEntry ? 1084 : 814} y={statusEntry ? 274 : 549} />
      </>
    );
  }

  function renderNotifications() {
    if (frame === FRAMES.notificationSent) {
      return <Hotspot height={58} label="Kembali ke daftar notifikasi" onClick={() => setFrame(FRAMES.notifications)} width={184} x={733} y={533} />;
    }
    return (
      <>
        <AdminLiveTable
          variant="notifications"
          label="Notifikasi dari database"
          headers={["ID Member", "Nama Member", "Jenis Notifikasi", "Berakhir", "Status Pembayaran", "Aksi"]}
          rows={notifications.slice(0, 5).map((row) => ({
            id: row.id_notifikasi,
            cells: [
              <span className="admin-live-id" key="id">{row.member.id_member}</span>,
              row.member.users.nama,
              row.jenis_notifikasi,
              <span className="admin-live-date" key="date">{row.transaksi?.tgl_berakhir.slice(0, 10) ?? "—"}</span>,
              row.transaksi
                ? <PaymentStatusBadge key="status" status={row.transaksi.status_bayar} />
                : "—",
              <button
                className="admin-live-action"
                key="action"
                onClick={() => setFrame(FRAMES.notificationSent)}
                type="button"
              >
                Pilih
              </button>,
            ],
          }))}
          emptyMessage="Belum ada notifikasi."
        />
        <OverlayInput height={38} label="Cari nama atau ID member" name="notification-search" onChange={setSearch} placeholder="Cari Nama/ ID Member" value={search} variant="search" width={924} x={493} y={218} />
        <Hotspot
          height={36}
          label="Buat pengingat perpanjangan untuk membership yang akan berakhir"
          onClick={() => {
            void submitApi("notifications", "POST", {}).then((saved) => {
              if (saved) setFrame(FRAMES.notificationSent);
            });
          }}
          width={280}
          x={1038}
          y={170}
        />
      </>
    );
  }

  function renderSchedule() {
    if (scheduleOpen) {
      return (
        <form className="admin-schedule-editor" onSubmit={async (event) => {
          event.preventDefault();
          const saved = await submitApi("schedules", editingScheduleId ? "PATCH" : "POST", {
            ...(editingScheduleId ? { scheduleId: editingScheduleId } : {}),
            date: value("scheduleDate"),
            time: value("scheduleTime"),
            csId: value("scheduleStaff"),
          });
          if (saved) {
            setScheduleOpen(false);
            setEditingScheduleId("");
            setFrame(FRAMES.scheduleUpdated);
          }
        }}>
          <label>Tanggal<input aria-label="Tanggal jadwal" name="date" onChange={(event) => setValue("scheduleDate", event.target.value)} required type="date" value={value("scheduleDate")} /></label>
          <label>Jam Mulai<input aria-label="Jam mulai jadwal" name="time" onChange={(event) => setValue("scheduleTime", event.target.value)} required type="time" value={value("scheduleTime")} /></label>
          <label>Petugas<select aria-label="Petugas jadwal" name="staff" onChange={(event) => setValue("scheduleStaff", event.target.value)} required value={value("scheduleStaff")}><option value="">Pilih petugas</option>{staffOptions.map((staff) => <option key={staff.id_cs} value={staff.id_cs}>{staff.users.nama}</option>)}</select></label>
          <button type="button" onClick={() => { setScheduleOpen(false); setEditingScheduleId(""); }}>Batal</button>
          <button disabled={loading} type="submit">{editingScheduleId ? "Perbarui Jadwal" : "Simpan Jadwal"}</button>
        </form>
      );
    }
    return (
      <>
        <AdminLiveTable
          variant="schedule"
          label="Jadwal piket dari database"
          headers={["Tanggal", "Jam Mulai", "Petugas", "Status", "Aksi"]}
          rows={schedules.slice(0, 5).map((schedule) => ({
            id: schedule.id_jadwal,
            cells: [
              <span className="admin-live-date" key="date">{schedule.tgl_piket.slice(0, 10)}</span>,
              <span className="admin-live-date" key="time">{schedule.jam_mulai.slice(11, 16)}</span>,
              schedule.cs?.users.nama ?? schedule.id_cs,
              "Terjadwal",
              <button
                className="admin-live-action"
                key="action"
                onClick={() => {
                  setEditingScheduleId(schedule.id_jadwal);
                  setValues({
                    scheduleDate: schedule.tgl_piket.slice(0, 10),
                    scheduleTime: schedule.jam_mulai.slice(11, 16),
                    scheduleStaff: schedule.id_cs ?? schedule.cs?.id_cs ?? "",
                  });
                  setScheduleOpen(true);
                }}
                type="button"
              >
                Ubah
              </button>,
            ],
          }))}
          emptyMessage="Belum ada jadwal piket."
        />
        <Hotspot height={48} label="Input Jadwal Piket" onClick={() => { setValues({}); setEditingScheduleId(""); setScheduleOpen(true); }} width={806} x={536} y={170} />
      </>
    );
  }

  function renderContent() {
    switch (section) {
      case "dashboard": return null;
      case "registration": return renderRegistration();
      case "payments": return renderPayments();
      case "members": return renderMembers();
      case "attendance": return renderAttendance();
      case "notifications": return renderNotifications();
      case "schedule": return renderSchedule();
      default: return null;
    }
  }

  function renderDashboardData() {
    const metrics = [
      { key: "members", x: 556 },
      { key: "activeMembers", x: 895 },
      { key: "todayAttendance", x: 1235 },
    ];

    return (
      <>
        {metrics.map(({ key, x }) => (
          <span
            key={key}
            className="admin-dashboard-value"
            style={frameStyle(x, 239, 96, 42)}
          >
            {dashboardStats[key] ?? "—"}
          </span>
        ))}
        <section
          aria-label="Riwayat pembayaran dari database"
          className="admin-dashboard-panel"
          style={frameStyle(458, 372, 923, 297)}
        >
          <h2>Riwayat Pembayaran</h2>
          <div className="admin-dashboard-table-head">
            <span>ID Transaksi</span><span>Nama</span><span>Jenis</span>
            <span>Tanggal</span><span>Metode</span><span>Jumlah</span><span>Status</span>
          </div>
          {payments.slice(0, 3).map((payment) => (
            <div className="admin-dashboard-table-row" key={payment.id_transaksi}>
              <span>{payment.id_transaksi}</span>
              <span>{payment.member.users.nama}</span>
              <span>{payment.jenis_member.nama_jenis}</span>
              <span>{payment.tgl_transaksi?.slice(0, 10) ?? "—"}</span>
              <span>{payment.metode_bayar ?? "—"}</span>
              <span>Rp{Number(payment.jumlah_bayar).toLocaleString("id-ID")}</span>
              <span>{payment.status_bayar}</span>
            </div>
          ))}
          {payments.length === 0 && <p className="admin-dashboard-empty">Belum ada transaksi.</p>}
        </section>
        <section
          aria-label="Jadwal piket dari database"
          className="admin-dashboard-panel admin-dashboard-schedules"
          style={frameStyle(458, 705, 867, 297)}
        >
          <h2>Jadwal Piket</h2>
          <div className="admin-dashboard-table-head">
            <span>Tanggal</span><span>Jam Mulai</span><span>Petugas</span><span>Status</span>
          </div>
          {schedules.slice(0, 3).map((schedule) => (
            <div className="admin-dashboard-table-row" key={schedule.id_jadwal}>
              <span>{schedule.tgl_piket.slice(0, 10)}</span>
              <span>{schedule.jam_mulai.slice(11, 16)}</span>
              <span>{schedule.cs?.users.nama ?? schedule.id_cs}</span>
              <span>Terjadwal</span>
            </div>
          ))}
          {schedules.length === 0 && <p className="admin-dashboard-empty">Belum ada jadwal piket.</p>}
        </section>
      </>
    );
  }

  return (
    <main className="admin-reference-screen">
      <FrameStage frame={frame}>
        <div className="admin-reference-overlay">
          {renderNavigation()}
          {renderContent()}
          {section === "dashboard" && renderDashboardData()}
          {feedback && <p className="admin-workspace-feedback" role="status">{feedback}</p>}
          {loading && <span className="sr-only" role="status">Memproses perubahan database...</span>}
          {section === "dashboard" && (
            <div className="sr-only" aria-label="Ringkasan dashboard Admin" role="status">
              {JSON.stringify(dashboardStats)}
            </div>
          )}
        </div>
      </FrameStage>
    </main>
  );
}
