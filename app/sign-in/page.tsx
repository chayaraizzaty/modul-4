import Image from "next/image";
import Link from "next/link";

const roles = [
  { label: "Owner", href: "/owner/login", x: 842, y: 397 },
  { label: "Admin", href: "/admin/login", x: 1107, y: 397 },
  { label: "Customer", href: "/customer/login", x: 842, y: 562 },
  { label: "Cleaning Service", href: "/cleaning-service/login", x: 1107, y: 562 },
] as const;

export default function SignIn() {
  return (
    <main className="actor-selection-screen">
      <div className="actor-selection-stage">
        <Image
          alt="PIAI Gym — pilihan peran Owner, Admin, Customer, dan Cleaning Service"
          fill
          priority
          sizes="100vw"
          src="/figma/admin/frames/00%20Pilihan%20Aktor.png"
          unoptimized
        />
        {roles.map(({ label, href, x, y }) => (
          <Link
            key={label}
            aria-label={label}
            className="actor-selection-link"
            href={href}
            style={{
              left: `${(x / 1440) * 100}%`,
              top: `${(y / 1024) * 100}%`,
              width: `${(248 / 1440) * 100}%`,
              height: `${(143 / 1024) * 100}%`,
            }}
          >
            <span className="sr-only">{label}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
