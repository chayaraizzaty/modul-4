export type GymRole = "admin" | "owner" | "customer" | "cleaning-service";

type NavigationItem = {
  label: string;
  href: string;
};

export const roleDetails: Record<
  GymRole,
  { label: string; user: string; navigation: NavigationItem[] }
> = {
  admin: {
    label: "Admin",
    user: "Rina Marlina",
    navigation: [
      { label: "Dashboard", href: "/admin/dashboard" },
      { label: "Pendaftaran Membership", href: "/admin/registration" },
      { label: "Pembayaran", href: "/admin/payments" },
      { label: "Kartu Membership", href: "/admin/members" },
      { label: "Kehadiran Member", href: "/admin/attendance" },
      { label: "Notifikasi Perpanjangan", href: "/admin/notifications" },
      { label: "Jadwal Piket", href: "/admin/schedule" },
    ],
  },
  owner: {
    label: "Owner",
    user: "Musri Maharani",
    navigation: [
      { label: "Dashboard", href: "/owner/dashboard" },
      { label: "Laporan Pendapatan", href: "/owner/revenue" },
      { label: "Laporan Kondisi Fasilitas", href: "/owner/facilities" },
      { label: "Laporan Kunjungan Member", href: "/owner/visits" },
      { label: "Laporan Pendaftaran Member", href: "/owner/registrations" },
    ],
  },
  customer: {
    label: "Customer",
    user: "Citra Piliang",
    navigation: [
      { label: "Dashboard", href: "/customer/dashboard" },
      { label: "Pendaftaran Membership", href: "/customer/registration" },
      { label: "Pembayaran/Perpanjangan Membership", href: "/customer/payment" },
      { label: "Kehadiran Member", href: "/customer/attendance" },
      { label: "Notifikasi", href: "/customer/notifications" },
    ],
  },
  "cleaning-service": {
    label: "Cleaning Service",
    user: "Nadia Putri",
    navigation: [
      { label: "Dashboard", href: "/cleaning-service/dashboard" },
      { label: "Jadwal Piket Kebersihan", href: "/cleaning-service/schedule" },
      { label: "Lapor Kondisi Fasilitas", href: "/cleaning-service/facilities" },
    ],
  },
};

export function isGymRole(value: string): value is GymRole {
  return value in roleDetails;
}

export function getRoleNavigation(role: GymRole) {
  return roleDetails[role].navigation;
}
