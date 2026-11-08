const roles = [
  { label: "Owner", type: "owner" },
  { label: "Admin", type: "admin" },
  { label: "Customer", type: "customer" },
  { label: "Cleaning Service", type: "cleaning" },
] as const;

function RoleIcon({ type }: { type: (typeof roles)[number]["type"] }) {
  switch (type) {
    case "owner":
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true" className="h-11 w-11 text-black">
          <path
            d="M11 43.5h42l-4.3-22.4-11.2 8.5-9.5-16.9-9.5 16.9-11.2-8.5L11 43.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M20 47.5h24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M22 24.5h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "admin":
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true" className="h-11 w-11 text-black">
          <circle cx="32" cy="22" r="7.5" fill="none" stroke="currentColor" strokeWidth="3" />
          <path
            d="M18 48c1.5-7 8-10.5 14-10.5S44.5 41 46 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M49 18.5 52.5 15M49.5 28 56 26M33.5 11.5V7M20 18.5 16.5 15M17.5 28 11 26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "customer":
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true" className="h-11 w-11 text-black">
          <circle cx="32" cy="20" r="9" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M18 47c2-8 8.5-12.5 14-12.5S44 39 46 47" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "cleaning":
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true" className="h-11 w-11 text-black">
          <path d="M24 12h16v11.5c0 2.3-1.9 4.2-4.2 4.2h-7.6c-2.3 0-4.2-1.9-4.2-4.2V12Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          <path d="M23 18h18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M22 26h20l-2.5 22.5c-.5 4.6-4.2 8-8.8 8h-1.4c-4.6 0-8.3-3.4-8.8-8L22 26Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          <path d="M28 30v16M36 30v16M24 38h16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f7f2]">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <aside className="flex w-full items-center justify-start bg-[#d8f3e6] px-6 py-10 sm:px-8 md:px-10 lg:w-1/2 lg:px-12 xl:px-16">
          <div className="max-w-[540px]">
            <h1 className="font-display text-[clamp(3rem,5vw,6rem)] font-bold leading-[0.9] tracking-[-0.04em] text-black">
              PIAI GYM
            </h1>

            <p className="mt-6 text-[clamp(1.15rem,1.7vw,2.2rem)] font-bold uppercase tracking-[0.02em] text-black">
              YOUR FITNESS, YOUR POWER
            </p>

            <p className="mt-5 max-w-[460px] text-[clamp(1.05rem,1.55vw,1.8rem)] leading-relaxed text-black">
              Kelola membership gym dengan lebih mudah, cepat, dan terorganisasi.
            </p>
          </div>
        </aside>

        <main className="flex w-full items-center justify-center bg-[#f5f7f2] px-5 py-8 sm:px-8 lg:w-1/2 lg:px-10 xl:px-14">
          <div className="w-full max-w-[620px] rounded-[2rem] bg-[#f7f7f4] p-5 shadow-[0_10px_25px_rgba(0,0,0,0.08)] sm:p-7 lg:p-9">
            <h2 className="font-display text-[clamp(2rem,2.4vw,2.6rem)] font-bold leading-none text-black">
              Sign In
            </h2>
            <p className="mt-2 text-[0.95rem] text-[#4a6b5f] sm:text-[1rem]">
              Pilih peran Anda untuk melanjutkan.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5">
              {roles.map(({ label, type }) => (
                <button
                  key={label}
                  type="button"
                  aria-label={label}
                  className="group flex h-[140px] flex-col items-center justify-center rounded-[1.4rem] bg-[#dfece3] px-3 text-black transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#d7e8dc] focus:outline-none focus:ring-2 focus:ring-[#70af9e] sm:h-[150px]"
                >
                  <div className="flex items-center justify-center">
                    <RoleIcon type={type} />
                  </div>
                  <span className="mt-3 text-center font-display text-[1.1rem] font-bold leading-none sm:text-[1.35rem]">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
