"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useState,
  useEffect,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import LogoutLink from "./logout-link";

const CUSTOMER_FRAMES = {
  dashboard: "C03_Dashboard customer.png",
  registration: "Form Pendaftaran Member.png",
  payment: "Data Tagihan.png",
  attendance: "Desktop - 1.png",
  notification: "Desktop - 5.png",
} as const;

type CustomerFrame = (typeof CUSTOMER_FRAMES)[keyof typeof CUSTOMER_FRAMES];
type MembershipType = "Pelajar" | "Umum";

type CustomerBill = {
  id_transaksi: string;
  id_jenis: string;
  tgl_transaksi: string;
  status_bayar: string;
  jumlah_bayar: string;
  metode_bayar: string;
  jenis_transaksi: string;
  jenis_member: { nama_jenis: string };
  member: { users: { nama: string } };
};

type CustomerType = {
  id_jenis: string;
  nama_jenis: string;
  harga: string;
  durasi_hari: number;
};

type CustomerAttendance = {
  id_checkin: string;
  tgl_checkin: string;
  jam_checkin: string;
};

type CustomerNotification = {
  id_notifikasi: string;
  jenis_notifikasi: string;
  transaksi?: { tgl_berakhir: string; status_bayar: string };
};

type CustomerDashboard = {
  hasMemberProfile: boolean;
  membership: {
    status_bayar: string;
    jumlah_bayar: string;
    jenis_member: { nama_jenis: string };
  } | null;
  latestMembership: {
    status_bayar: string;
    jumlah_bayar: string;
    jenis_member: { nama_jenis: string };
  } | null;
  attendanceCount: number;
  notificationCount: number;
};

type RegistrationReceipt = {
  name: string;
  gender: string;
  membership: string;
  registrationDate: string;
  amount: string;
};

function PaymentStatusBadge({ status }: { status: string }) {
  const statusClass =
    status === "Lunas"
      ? "customer-status-paid"
      : status === "Ditolak"
        ? "customer-status-rejected"
        : "customer-status-pending";
  return <span className={`customer-status-badge ${statusClass}`}>{status}</span>;
}

function jakartaDateToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

const customerNavigation = [
  { section: "dashboard", label: "Dashboard", href: "/customer/dashboard", y: 153 },
  { section: "registration", label: "Pendaftaran Membership", href: "/customer/registration", y: 237 },
  { section: "payment", label: "Pembayaran/Perpanjangan Membership", href: "/customer/payment", y: 328 },
  { section: "attendance", label: "Kehadiran Member", href: "/customer/attendance", y: 421 },
] as const;

function framePosition(x: number, y: number, width: number, height: number) {
  return {
    left: `${(x / 1440) * 100}%`,
    top: `${(y / 1024) * 100}%`,
    width: `${(width / 1440) * 100}%`,
    height: `${(height / 1024) * 100}%`,
  };
}

function CustomerStage({
  frame,
  children,
}: {
  frame: CustomerFrame;
  children: ReactNode;
}) {
  return (
    <div className="customer-stage">
      <Image
        alt={`Desain Customer: ${frame.replace(/\.png$/i, "")}`}
        className="customer-reference-image"
        fill
        priority
        sizes="100vw"
        src={`/figma/customer/frames/${encodeURIComponent(frame)}`}
        unoptimized
      />
      {children}
    </div>
  );
}

function CustomerHotspot({
  label,
  style,
  onClick,
  type = "button",
  className = "",
  ariaPressed,
  disabled = false,
}: {
  label: string;
  style: CSSProperties;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  ariaPressed?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={ariaPressed}
      className={`customer-hotspot ${className}`}
      disabled={disabled}
      onClick={onClick}
      style={style}
      type={type}
    />
  );
}

export default function CustomerWorkspace({ section }: { section: string }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    gender: "",
    address: "",
    city: "",
  });
  const [registrationDate] = useState(jakartaDateToday);
  const [registrationStep, setRegistrationStep] = useState<
    "form" | "validating" | "validated" | "saving" | "invalid" | "success"
  >("form");
  const [registrationChecks, setRegistrationChecks] = useState<{ label: string; valid: boolean }[]>([]);
  const [registrationError, setRegistrationError] = useState("");
  const [registrationReceipt, setRegistrationReceipt] = useState<RegistrationReceipt | null>(null);
  const [membership, setMembership] = useState<MembershipType | "">("");
  const [feedback, setFeedback] = useState("");
  const [bills, setBills] = useState<CustomerBill[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<CustomerType[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<CustomerAttendance[]>([]);
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [checkInReason, setCheckInReason] = useState("");
  const [notificationRows, setNotificationRows] = useState<CustomerNotification[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerHasMemberProfile, setCustomerHasMemberProfile] = useState(false);
  const [dashboard, setDashboard] = useState<CustomerDashboard | null>(null);
  const [qrisInfoOpen, setQrisInfoOpen] = useState(false);
  const [qrisExpanded, setQrisExpanded] = useState(false);
  const [qrisAssetError, setQrisAssetError] = useState(false);
  const [qrisBillId, setQrisBillId] = useState("");
  const [qrisStatusMessage, setQrisStatusMessage] = useState("");
  const [renewalTypeId, setRenewalTypeId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const endpoint: Record<string, string> = {
      dashboard: "dashboard",
      registration: "membership",
      payment: "bills",
      attendance: "attendance",
      notifications: "notifications",
      membership: "membership",
    };
    const resource = endpoint[section];
    if (!resource) return;
    let active = true;
    void fetch(`/api/customer/${resource}`)
      .then(async (response) => {
        const result = (await response.json()) as {
          error?: string;
          data?: unknown[];
          types?: CustomerType[];
          user?: { name?: string };
          profile?: { name?: string; users?: { nama?: string } } | null;
          canCheckIn?: boolean;
          reason?: string | null;
          hasMemberProfile?: boolean;
          membership?: CustomerDashboard["membership"];
          latestMembership?: CustomerDashboard["latestMembership"];
          attendanceCount?: number;
          notificationCount?: number;
        };
        if (!response.ok) throw new Error(result.error ?? "Data Customer gagal dimuat.");
        if (!active) return;
        if (section === "payment" && Array.isArray(result.data)) {
          setBills(result.data as CustomerBill[]);
          setRenewalTypeId("");
          setCustomerHasMemberProfile(result.hasMemberProfile ?? false);
        }
        if (section === "attendance" && Array.isArray(result.data)) {
          setAttendanceRows(result.data as CustomerAttendance[]);
          setCanCheckIn(result.canCheckIn ?? false);
          setCheckInReason(result.reason ?? "");
        }
        if (section === "notifications" && Array.isArray(result.data)) {
          setNotificationRows(result.data as CustomerNotification[]);
        }
        if (section === "dashboard") {
          setCustomerHasMemberProfile(result.hasMemberProfile ?? false);
          setDashboard({
            hasMemberProfile: result.hasMemberProfile ?? false,
            membership: result.membership ?? null,
            latestMembership: result.latestMembership ?? null,
            attendanceCount: result.attendanceCount ?? 0,
            notificationCount: result.notificationCount ?? 0,
          });
        }
        if (section === "registration") {
          setCustomerHasMemberProfile(Boolean(result.profile));
        }
        setMembershipTypes(Array.isArray(result.types) ? result.types : []);
        if (result.user?.name) setCustomerName(result.user.name);
        else if (result.profile?.name ?? result.profile?.users?.nama) {
          setCustomerName(result.profile.name ?? result.profile.users?.nama ?? "");
        }
        setFeedback("");
      })
      .catch((error: unknown) => {
        if (active) {
          setFeedback(error instanceof Error ? error.message : "Data Customer gagal dimuat.");
        }
      });
    return () => {
      active = false;
    };
  }, [section]);

  function registrationPayload(validateOnly: boolean) {
    const selectedType = membershipTypes.find(
      (type) => type.nama_jenis.toLocaleLowerCase("id-ID") === membership.toLocaleLowerCase("id-ID"),
    );
    if (!selectedType) {
      throw new Error("Jenis membership belum berhasil dimuat dari database.");
    }
    return {
      name: formData.name,
      phone: formData.phone,
      gender: formData.gender,
      address: formData.address,
      city: formData.city,
      registrationDate,
      membershipId: selectedType.id_jenis,
      validateOnly,
    };
  }

  async function validateRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!membership) {
      setFeedback("Pilih jenis membership untuk melanjutkan.");
      return;
    }
    setRegistrationStep("validating");
    setRegistrationError("");
    setFeedback("");
    try {
      const response = await fetch("/api/customer/membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationPayload(true)),
      });
      const result = (await response.json()) as {
        error?: string;
        checks?: { label: string; valid: boolean }[];
      };
      if (!response.ok) throw new Error(result.error ?? "Pendaftaran membership gagal.");
      setRegistrationChecks(result.checks ?? []);
      setRegistrationStep("validated");
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : "Validasi pendaftaran gagal.");
      setRegistrationStep("invalid");
    }
  }

  async function saveRegistration() {
    setRegistrationStep("saving");
    setRegistrationError("");
    try {
      const response = await fetch("/api/customer/membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationPayload(false)),
      });
      const result = (await response.json()) as {
        error?: string;
        receipt?: RegistrationReceipt;
      };
      if (!response.ok || !result.receipt) {
        throw new Error(result.error ?? "Pendaftaran membership gagal disimpan.");
      }
      setRegistrationReceipt(result.receipt);
      setRegistrationStep("success");
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : "Pendaftaran membership gagal disimpan.");
      setRegistrationStep("invalid");
    }
  }

  async function submitCheckIn() {
    setLoading(true);
    setFeedback("");
    try {
      const response = await fetch("/api/customer/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = (await response.json()) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "Check-in gagal dicatat.");

      const historyResponse = await fetch("/api/customer/attendance");
      const historyResult = (await historyResponse.json()) as {
        error?: string;
        data?: CustomerAttendance[];
        canCheckIn?: boolean;
        reason?: string | null;
      };
      if (!historyResponse.ok) {
        throw new Error(historyResult.error ?? "Check-in tersimpan, tetapi riwayat gagal dimuat.");
      }
      setAttendanceRows(historyResult.data ?? []);
      setCanCheckIn(historyResult.canCheckIn ?? false);
      setCheckInReason(historyResult.reason ?? "");
      setFeedback(result.message ?? "Check-in berhasil dicatat.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Check-in gagal dicatat.");
    } finally {
      setLoading(false);
    }
  }

  async function openPaymentInstructions() {
    setFeedback("");
    setQrisStatusMessage("");
    const pendingBill = bills.find((bill) => bill.status_bayar === "Menunggu Verifikasi");
    if (pendingBill) {
      setQrisBillId(pendingBill.id_transaksi);
      setQrisInfoOpen(true);
      return;
    }

    if (!customerHasMemberProfile) {
      router.push("/customer/registration");
      return;
    }

    const selectedTypeId = renewalTypeId || bills[0]?.id_jenis;
    if (!selectedTypeId) {
      setFeedback("Pilih jenis membership untuk membuat tagihan.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/customer/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "QRIS", membershipId: selectedTypeId }),
      });
      const result = (await response.json()) as {
        error?: string;
        data?: { id_transaksi: string };
        message?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "Tagihan tidak dapat dibuat.");
      if (!result.data) throw new Error("Tagihan berhasil diproses tetapi nomor transaksi tidak tersedia.");

      const billsResponse = await fetch("/api/customer/bills");
      const billsResult = (await billsResponse.json()) as {
        error?: string;
        data?: CustomerBill[];
        types?: CustomerType[];
      };
      if (!billsResponse.ok) {
        throw new Error(billsResult.error ?? "Tagihan dibuat, tetapi daftar tagihan gagal dimuat.");
      }
      setBills(billsResult.data ?? []);
      if (Array.isArray(billsResult.types)) setMembershipTypes(billsResult.types);
      setQrisBillId(result.data.id_transaksi);
      setQrisInfoOpen(true);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Tagihan tidak dapat dibuat.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshBillStatus() {
    setLoading(true);
    setQrisStatusMessage("");
    try {
      const response = await fetch("/api/customer/bills");
      const result = (await response.json()) as {
        error?: string;
        data?: CustomerBill[];
        types?: CustomerType[];
      };
      if (!response.ok) throw new Error(result.error ?? "Status tagihan gagal diperbarui.");
      const refreshedBills = result.data ?? [];
      setBills(refreshedBills);
      if (Array.isArray(result.types)) setMembershipTypes(result.types);
      const currentBill = refreshedBills.find((item) => item.id_transaksi === qrisBillId);
      setQrisStatusMessage(
        currentBill
          ? `Status terbaru: ${currentBill.status_bayar}.`
          : "Tagihan ini tidak ditemukan pada data terbaru.",
      );
    } catch (error) {
      setQrisStatusMessage(error instanceof Error ? error.message : "Status tagihan gagal diperbarui.");
    } finally {
      setLoading(false);
    }
  }

  function renderSidebar() {
    return (
      <>
        {customerNavigation.map((item) => (
          <Link
            key={item.section}
            aria-label={item.label}
            aria-current={section === item.section ? "page" : undefined}
            className="customer-hotspot customer-nav-link"
            href={item.href}
            style={framePosition(39, item.y, 346, 62)}
          >
            <span className="sr-only">{item.label}</span>
          </Link>
        ))}
        <LogoutLink
          className="customer-hotspot customer-nav-link"
          style={framePosition(40, 872, 190, 62)}
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
        <span className="customer-dashboard-welcome" style={framePosition(485, 70, 910, 72)}>
          Selamat Datang, {customerName || "Customer"}!
        </span>
        <Link
          aria-label="Buka notifikasi masa aktif membership"
          className="customer-hotspot"
          href="/customer/notifications"
          style={framePosition(1206, 16, 50, 48)}
        />
        <CustomerHotspot
          label={customerHasMemberProfile ? "Buka tagihan membership" : "Buka pendaftaran membership"}
          onClick={() => router.push(customerHasMemberProfile ? "/customer/payment" : "/customer/registration")}
          style={framePosition(485, 238, 919, 140)}
        />
        <span className="customer-dashboard-stat" style={framePosition(622, 340, 736, 25)}>
          {dashboard?.membership
            ? `Membership aktif · ${dashboard.membership.jenis_member.nama_jenis}`
            : dashboard?.latestMembership
              ? `Membership tidak aktif · ${dashboard.latestMembership.jenis_member.nama_jenis} (${dashboard.latestMembership.status_bayar})`
              : dashboard?.hasMemberProfile
                ? "Profil member tersedia; belum ada transaksi membership."
              : dashboard
                ? "Belum terdaftar sebagai member."
                : "Memuat status membership..."}
        </span>
        <span className="customer-dashboard-stat" style={framePosition(622, 363, 736, 23)}>
          {dashboard?.latestMembership
            ? `Tagihan Rp${Number(dashboard.latestMembership.jumlah_bayar).toLocaleString("id-ID")} · ${dashboard.latestMembership.status_bayar}`
            : "Belum ada tagihan membership."}
        </span>
        <CustomerHotspot
          label="Buka pembayaran atau perpanjangan membership"
          onClick={() => router.push("/customer/payment")}
          style={framePosition(485, 436, 919, 139)}
        />
        <span className="customer-dashboard-stat" style={framePosition(622, 540, 736, 24)}>
          Notifikasi membership: {dashboard?.notificationCount ?? "—"}
        </span>
        <CustomerHotspot
          label="Buka kehadiran member"
          onClick={() => router.push("/customer/attendance")}
          style={framePosition(485, 633, 919, 140)}
        />
        <span className="customer-dashboard-stat" style={framePosition(622, 738, 736, 24)}>
          Total kehadiran: {dashboard?.attendanceCount ?? "—"}
        </span>
      </>
    );
  }

  function renderRegistration() {
    if (customerHasMemberProfile && registrationStep === "form") {
      return (
        <>
          {renderSidebar()}
          <div className="customer-flow-backdrop">
            <section aria-labelledby="customer-existing-member-title" className="customer-flow-card" role="status">
              <h1 id="customer-existing-member-title">Profil Member Sudah Terdaftar</h1>
              <p>Data membership dan tagihan Anda dapat dilihat pada menu Pembayaran/Perpanjangan Membership.</p>
              <button
                className="customer-flow-primary"
                onClick={() => router.push("/customer/payment")}
                type="button"
              >
                Buka Tagihan
              </button>
            </section>
          </div>
        </>
      );
    }

    if (registrationStep !== "form") {
      return (
        <>
          {renderSidebar()}
          <div className="customer-flow-backdrop">
            <section
              aria-labelledby="customer-registration-flow-title"
              aria-live="polite"
              className="customer-flow-card"
              role="status"
            >
              {registrationStep === "success" && registrationReceipt ? (
                <>
                  <div className="customer-flow-icon" aria-hidden="true">✓</div>
                  <h1 id="customer-registration-flow-title">Pendaftaran Berhasil!</h1>
                  <p>Data pendaftaran member dan tagihan telah tersimpan.</p>
                  <div className="customer-receipt">
                    <h2>Bukti Pendaftaran</h2>
                    <dl>
                      <div><dt>Nama Customer</dt><dd>{registrationReceipt.name}</dd></div>
                      <div><dt>Jenis Kelamin</dt><dd>{registrationReceipt.gender}</dd></div>
                      <div><dt>Jenis Membership</dt><dd>{registrationReceipt.membership}</dd></div>
                      <div><dt>Tanggal Pendaftaran</dt><dd>{registrationReceipt.registrationDate}</dd></div>
                      <div><dt>Nominal Tagihan</dt><dd>Rp{Number(registrationReceipt.amount).toLocaleString("id-ID")}</dd></div>
                    </dl>
                  </div>
                  <p className="customer-flow-note">
                    Bukti ini adalah bukti pendaftaran, bukan bukti pembayaran. Tagihan menunggu verifikasi Admin.
                  </p>
                  <button
                    className="customer-flow-primary"
                    onClick={() => router.push("/customer/payment")}
                    type="button"
                  >
                    Selesai
                  </button>
                </>
              ) : (
                <>
                  <div className="customer-flow-icon" aria-hidden="true">
                    {registrationStep === "validating" || registrationStep === "saving" ? "…" : "✓"}
                  </div>
                  <h1 id="customer-registration-flow-title">Memvalidasi Data Pendaftaran</h1>
                  <p>
                    {registrationStep === "validating"
                      ? "Sistem sedang memeriksa kelengkapan data dan kesesuaiannya dengan database."
                      : registrationStep === "saving"
                        ? "Data valid. Sistem sedang menyimpan pendaftaran dan membuat tagihan."
                        : registrationStep === "invalid"
                          ? registrationError
                          : "Data lengkap dan dapat disimpan ke database."}
                  </p>
                  {registrationChecks.length > 0 && (
                    <ul className="customer-validation-list">
                      {registrationChecks.map((check) => (
                        <li key={check.label}>
                          <span aria-hidden="true">{check.valid ? "✓" : "!"}</span>
                          {check.label}
                        </li>
                      ))}
                    </ul>
                  )}
                  {registrationStep === "validating" || registrationStep === "saving" ? (
                    <div className="customer-validation-progress" role="progressbar" aria-label="Validasi pendaftaran">
                      <span />
                    </div>
                  ) : registrationStep === "validated" ? (
                    <div className="customer-flow-actions">
                      <button
                        className="customer-flow-secondary"
                        onClick={() => setRegistrationStep("form")}
                        type="button"
                      >
                        Kembali
                      </button>
                      <button className="customer-flow-primary" onClick={saveRegistration} type="button">
                        Selanjutnya
                      </button>
                    </div>
                  ) : (
                    <button
                      className="customer-flow-primary"
                      onClick={() => setRegistrationStep("form")}
                      type="button"
                    >
                      Kembali ke Formulir
                    </button>
                  )}
                </>
              )}
            </section>
          </div>
        </>
      );
    }

    return (
      <>
        {renderSidebar()}
        <form className="customer-overlay" onSubmit={validateRegistration}>
          <input
            aria-label="Nama Lengkap"
            autoComplete="name"
            className="customer-form-control"
            onChange={(event) =>
              setFormData((current) => ({ ...current, name: event.target.value }))
            }
            required
            style={framePosition(504, 337, 399, 52)}
            value={formData.name}
          />
          <input
            aria-label="No. HP"
            autoComplete="tel"
            className="customer-form-control"
            onChange={(event) =>
              setFormData((current) => ({ ...current, phone: event.target.value }))
            }
            required
            style={framePosition(948, 337, 400, 52)}
            type="tel"
            value={formData.phone}
          />
          <select
            aria-label="Jenis Kelamin"
            className="customer-form-control"
            onChange={(event) =>
              setFormData((current) => ({ ...current, gender: event.target.value }))
            }
            required
            style={framePosition(504, 428, 399, 51)}
            value={formData.gender}
          >
            <option value="" />
            <option value="Perempuan">Perempuan</option>
            <option value="Laki-laki">Laki-laki</option>
          </select>
          <input
            aria-label="Tanggal Pendaftaran"
            className="customer-form-control"
            readOnly
            style={framePosition(948, 425, 400, 51)}
            type="date"
            value={registrationDate}
          />
          <input
            aria-label="Alamat"
            className="customer-form-control"
            onChange={(event) =>
              setFormData((current) => ({ ...current, address: event.target.value }))
            }
            required
            style={framePosition(504, 519, 399, 52)}
            value={formData.address}
          />
          <span
            className="customer-form-label customer-form-label-date"
            style={framePosition(948, 399, 400, 24)}
          >
            Tanggal Pendaftaran
          </span>
          <span
            className="customer-form-label customer-form-label-city"
            style={framePosition(948, 493, 400, 24)}
          >
            Kota
          </span>
          <input
            aria-label="Kota"
            autoComplete="address-level2"
            className="customer-form-control"
            onChange={(event) =>
              setFormData((current) => ({ ...current, city: event.target.value }))
            }
            required
            style={framePosition(948, 519, 400, 52)}
            value={formData.city}
          />
          <CustomerHotspot
            ariaPressed={membership === "Pelajar"}
            className={membership === "Pelajar" ? "customer-membership-selected" : ""}
            label="Pilih Pelajar Rp100.000"
            onClick={() => setMembership("Pelajar")}
            style={framePosition(494, 743, 401, 109)}
          />
          <CustomerHotspot
            ariaPressed={membership === "Umum"}
            className={membership === "Umum" ? "customer-membership-selected" : ""}
            label="Pilih Umum Rp150.000"
            onClick={() => setMembership("Umum")}
            style={framePosition(946, 743, 401, 109)}
          />
          <CustomerHotspot
            label="Batal pendaftaran"
            onClick={() => router.push("/customer/dashboard")}
            style={framePosition(494, 930, 291, 66)}
          />
          <CustomerHotspot
            label="Selanjutnya ke data tagihan"
            className={loading || !membershipTypes.length ? "customer-hotspot-disabled" : ""}
            disabled={loading || !membershipTypes.length}
            type="submit"
            style={framePosition(835, 930, 289, 66)}
          />
        </form>
        {feedback && <p className="customer-feedback" role="alert">{feedback}</p>}
      </>
    );
  }

  function renderPayment() {
    const bill = bills[0];
    const qrisBill = qrisBillId
      ? bills.find((item) => item.id_transaksi === qrisBillId)
      : bills.find((item) => item.status_bayar === "Menunggu Verifikasi");
    const membershipLabel = bill?.jenis_member.nama_jenis ?? "—";
    const amount = bill
      ? `Rp${Number(bill.jumlah_bayar).toLocaleString("id-ID")}`
      : "—";

    return (
      <>
        {renderSidebar()}
        <div className="customer-bill-values" aria-label="Rincian tagihan pendaftaran">
          <div className="customer-bill-row">{(bill?.member.users.nama ?? customerName) || "—"}</div>
          <div className="customer-bill-row">{bill?.status_bayar ?? "—"}</div>
          <div className="customer-bill-row">{membershipLabel}</div>
          <div className="customer-bill-row">{bill?.tgl_transaksi.slice(0, 10) ?? "—"}</div>
          <div className="customer-bill-row">{amount}</div>
        </div>
        {!bill && customerHasMemberProfile && membershipTypes.length > 0 && (
          <select
            aria-label="Jenis membership untuk tagihan"
            className="customer-form-control customer-renewal-type"
            onChange={(event) => setRenewalTypeId(event.target.value)}
            value={renewalTypeId}
          >
            <option value="">Pilih jenis membership</option>
            {membershipTypes.map((type) => (
              <option key={type.id_jenis} value={type.id_jenis}>
                {type.nama_jenis} · Rp{Number(type.harga).toLocaleString("id-ID")}
              </option>
            ))}
          </select>
        )}
        <CustomerHotspot
          label="Bayar dengan QRIS"
          onClick={openPaymentInstructions}
          disabled={loading || (!bill && !renewalTypeId && membershipTypes.length > 0)}
          style={framePosition(452, 762, 384, 67)}
        />
        {qrisInfoOpen && (
          <div className="customer-flow-backdrop">
            <section aria-labelledby="customer-qris-title" className="customer-flow-card customer-qris-card" role="dialog" aria-modal="true">
              <h1 id="customer-qris-title">Pembayaran Membership</h1>
              {qrisBill ? (
                <>
                  <dl className="customer-qris-invoice">
                    <div><dt>Nomor Tagihan</dt><dd>{qrisBill.id_transaksi}</dd></div>
                    <div><dt>Nama Customer</dt><dd>{qrisBill.member.users.nama}</dd></div>
                    <div><dt>Jenis Membership</dt><dd>{qrisBill.jenis_member.nama_jenis}</dd></div>
                    <div><dt>Total Tagihan</dt><dd>Rp{Number(qrisBill.jumlah_bayar).toLocaleString("id-ID")}</dd></div>
                    <div>
                      <dt>Status Pembayaran</dt>
                      <dd><PaymentStatusBadge status={qrisBill.status_bayar} /></dd>
                    </div>
                  </dl>
                  {qrisBill.status_bayar === "Menunggu Verifikasi" ? (
                    <>
                      <div className="customer-qris-panel">
                        <div className="customer-qris-image-wrap">
                          {!qrisAssetError ? (
                            <Image
                              alt="QRIS pembayaran PIAI Gym"
                              className="customer-qris-image"
                              fill
                              onError={() => setQrisAssetError(true)}
                              sizes="(max-width: 640px) 70vw, 260px"
                              src="/images/qris.png"
                              unoptimized
                            />
                          ) : (
                            <p className="customer-qris-error" role="alert">
                              Aset /images/qris.png tersedia, tetapi berkasnya bukan PNG valid sehingga QRIS tidak dapat ditampilkan. Silakan hubungi Admin.
                            </p>
                          )}
                        </div>
                        {!qrisAssetError && (
                          <button
                            className="customer-qris-zoom"
                            onClick={() => setQrisExpanded(true)}
                            type="button"
                          >
                            Perbesar QRIS
                          </button>
                        )}
                      </div>
                      <p className="customer-qris-instructions">
                        Silakan pindai QRIS menggunakan aplikasi pembayaran yang mendukung QRIS. Setelah melakukan pembayaran, transaksi akan menunggu proses validasi oleh Admin.
                      </p>
                    </>
                  ) : (
                    <p className="customer-flow-note">
                      Status terakhir tagihan ini adalah {qrisBill.status_bayar}. QRIS tidak mengubah status transaksi; hanya Admin yang memvalidasi pembayaran.
                    </p>
                  )}
                  <button
                    className="customer-flow-secondary"
                    disabled={loading}
                    onClick={() => void refreshBillStatus()}
                    type="button"
                  >
                    Perbarui Status
                  </button>
                  {qrisStatusMessage && (
                    <p className="customer-qris-refresh-feedback" role="status">{qrisStatusMessage}</p>
                  )}
                </>
              ) : (
                <p className="customer-flow-note">Rincian tagihan belum dapat dimuat. Tutup dialog lalu muat ulang halaman.</p>
              )}
              <button
                className="customer-flow-primary"
                onClick={() => {
                  setQrisInfoOpen(false);
                  setQrisExpanded(false);
                }}
                type="button"
              >
                Kembali ke Tagihan
              </button>
              {qrisExpanded && !qrisAssetError && (
                <div className="customer-qris-expanded" role="presentation">
                  <button
                    aria-label="Tutup QRIS diperbesar"
                    className="customer-qris-expanded-close"
                    onClick={() => setQrisExpanded(false)}
                    type="button"
                  >
                    Tutup
                  </button>
                  <div className="customer-qris-expanded-image">
                    <Image
                      alt="QRIS pembayaran PIAI Gym diperbesar"
                      className="customer-qris-image"
                      fill
                      onError={() => setQrisAssetError(true)}
                      sizes="min(88vw, 80vh)"
                      src="/images/qris.png"
                      unoptimized
                    />
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
        {feedback && <p className="customer-feedback customer-payment-feedback" role="status">{feedback}</p>}
      </>
    );
  }

  function renderAttendance() {
    return (
      <>
        {renderSidebar()}
        <div className="customer-history-list" aria-label="Riwayat kehadiran dari database">
          {attendanceRows.slice(0, 5).map((row) => (
            <p key={row.id_checkin}>
              {row.tgl_checkin.slice(0, 10)} · {row.jam_checkin.slice(11, 16)}
            </p>
          ))}
          {attendanceRows.length === 0 && <p>Belum ada riwayat kehadiran.</p>}
        </div>
        <CustomerHotspot
          label="Check-in Sekarang"
          className={!canCheckIn || loading ? "customer-hotspot-disabled" : ""}
          disabled={!canCheckIn || loading}
          onClick={submitCheckIn}
          style={framePosition(465, 644, 296, 57)}
        />
        {!canCheckIn && checkInReason && (
          <p className="customer-feedback customer-checkin-feedback" role="status">{checkInReason}</p>
        )}
        {feedback && <p className="customer-feedback customer-checkin-feedback" role="status">{feedback}</p>}
      </>
    );
  }

  function renderNotification() {
    return (
      <>
        {renderSidebar()}
        <div className="customer-notification-list" aria-label="Notifikasi dari database">
          {notificationRows.slice(0, 3).map((row) => (
            <p key={row.id_notifikasi}>
              {row.jenis_notifikasi}
              {row.transaksi?.tgl_berakhir
                ? ` · berakhir ${row.transaksi.tgl_berakhir.slice(0, 10)}`
                : ""}
            </p>
          ))}
          {notificationRows.length === 0 && <p>Tidak ada notifikasi membership.</p>}
        </div>
        <CustomerHotspot
          label="Perpanjang Membership"
          onClick={() => router.push("/customer/payment")}
          style={framePosition(944, 477, 227, 35)}
        />
        <CustomerHotspot
          label="Kembali ke Dashboard"
          onClick={() => router.push("/customer/dashboard")}
          style={framePosition(485, 560, 188, 66)}
        />
      </>
    );
  }

  const screens: Record<string, CustomerFrame> = {
    dashboard: CUSTOMER_FRAMES.dashboard,
    registration: CUSTOMER_FRAMES.registration,
    payment: CUSTOMER_FRAMES.payment,
    attendance: CUSTOMER_FRAMES.attendance,
    notifications: CUSTOMER_FRAMES.notification,
  };
  const frame = screens[section] ?? CUSTOMER_FRAMES.dashboard;

  let content;
  switch (section) {
    case "registration":
      content = renderRegistration();
      break;
    case "payment":
      content = renderPayment();
      break;
    case "attendance":
      content = renderAttendance();
      break;
    case "notifications":
      content = renderNotification();
      break;
    default:
      content = renderDashboard();
  }

  return (
    <main className={`customer-screen ${section === "payment" && bills.length > 1 ? "customer-screen-with-history" : ""}`}>
      <CustomerStage frame={frame}>{content}</CustomerStage>
      {section === "payment" && bills.length > 1 && (
        <section aria-label="Riwayat seluruh tagihan Customer" className="customer-bill-history">
          <h2>Riwayat Tagihan</h2>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th scope="col">Nomor Tagihan</th>
                  <th>Tanggal</th>
                  <th>Jenis Membership</th>
                  <th>Nominal</th>
                  <th>Metode</th>
                  <th>Status Pembayaran</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((item) => (
                  <tr key={item.id_transaksi}>
                    <td>{item.id_transaksi}</td>
                    <td>{item.tgl_transaksi.slice(0, 10)}</td>
                    <td>{item.jenis_member.nama_jenis}</td>
                    <td className="customer-bill-amount">Rp{Number(item.jumlah_bayar).toLocaleString("id-ID")}</td>
                    <td>{item.metode_bayar}</td>
                    <td><PaymentStatusBadge status={item.status_bayar} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {loading && <span className="sr-only" role="status">Memproses permintaan...</span>}
    </main>
  );
}
