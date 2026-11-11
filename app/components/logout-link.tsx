"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export default function LogoutLink({
  className,
  style,
  children = "Log Out",
}: {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const router = useRouter();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!dialogOpen) return;
    cancelButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) setDialogOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dialogOpen, loading]);

  async function confirmLogout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout tidak dapat diselesaikan. Silakan coba lagi.");
      setDialogOpen(false);
      router.replace("/sign-in");
      router.refresh();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Logout gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        aria-label="Log Out"
        className={className}
        onClick={() => {
          setError("");
          setDialogOpen(true);
        }}
        style={style}
        type="button"
      >
        {children}
      </button>
      {dialogOpen && typeof document !== "undefined" && createPortal(
        <div
          className="logout-dialog-backdrop"
          onClick={() => {
            if (!loading) setDialogOpen(false);
          }}
        >
          <div
            aria-describedby="logout-dialog-description"
            aria-labelledby="logout-dialog-title"
            aria-modal="true"
            className="logout-dialog"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <Image
              alt=""
              className="logout-dialog-artwork"
              fill
              sizes="min(700px, 90vw)"
              src="/figma/admin/logout-modal.png"
              unoptimized
            />
            <h2 className="sr-only" id="logout-dialog-title">Log Out?</h2>
            <p className="sr-only" id="logout-dialog-description">
              Anda Akan Keluar Dari Sistem dan Kembali Ke Halaman Sign In
            </p>
            {error && <p className="logout-dialog-error" role="alert">{error}</p>}
            <button
              aria-label="BATAL"
              className="logout-dialog-action logout-dialog-cancel"
              disabled={loading}
              onClick={() => setDialogOpen(false)}
              ref={cancelButtonRef}
              type="button"
            />
            <button
              aria-label={loading ? "Memproses logout" : "YA, LOG OUT"}
              className="logout-dialog-action logout-dialog-confirm"
              disabled={loading}
              onClick={() => void confirmLogout()}
              type="button"
            />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
