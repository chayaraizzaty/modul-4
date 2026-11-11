"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type AuthView =
  | "login"
  | "signup"
  | "username-used"
  | "registration-success";

const frames: Record<AuthView | "login-failed", string> = {
  login: "customer-login.png",
  "login-failed": "customer-login-failed.png",
  signup: "customer-signup.png",
  "username-used": "customer-username-used.png",
  "registration-success": "customer-registration-success.png",
};

function framePosition(x: number, y: number, width: number, height: number) {
  return {
    left: `${(x / 1440) * 100}%`,
    top: `${(y / 1024) * 100}%`,
    width: `${(width / 1440) * 100}%`,
    height: `${(height / 1024) * 100}%`,
  };
}

export default function CustomerAuth({
  initialView = "login",
}: {
  initialView?: "login" | "signup";
}) {
  const router = useRouter();
  const [view, setView] = useState<AuthView>(initialView);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const frame = frames[view === "login" && loginError ? "login-failed" : view];

  function resetForm() {
    setFullName("");
    setUsername("");
    setPassword("");
    setLoginError(null);
    setFeedback("");
    setShowPassword(false);
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback("");
    setLoginError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role: "customer" }),
      });
      const result = (await response.json()) as {
        error?: string;
        code?: string;
        user?: { role: string };
      };
      if (!response.ok) {
        if (response.status === 401) {
          setLoginError("Gagal login. Data tidak valid, periksa username dan password.");
        } else {
          setFeedback(result.error ?? "Login tidak dapat diproses.");
        }
        return;
      }

      if (result.user?.role !== "customer") {
        setFeedback("Akun tidak memiliki akses Customer.");
        return;
      }
      router.push("/customer/dashboard");
    } catch (error) {
      setLoginError(null);
      setFeedback(error instanceof Error ? error.message : "Server tidak dapat dijangkau.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback("");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, username, password }),
      });
      const result = (await response.json()) as { error?: string; code?: string };
      if (response.status === 409 && result.code === "USERNAME_TAKEN") {
        setView("username-used");
        return;
      }
      if (!response.ok) {
        setFeedback(result.error ?? "Pendaftaran tidak dapat diproses.");
        return;
      }
      resetForm();
      setView("registration-success");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Server tidak dapat dijangkau.");
    } finally {
      setSubmitting(false);
    }
  }

  function linkToLogin() {
    resetForm();
    router.push("/customer/login");
  }

  return (
    <main className="customer-auth-screen">
      <div className="customer-auth-stage">
        <Image
          alt={`Referensi desain Customer: ${frame.replace(/\.png$/i, "")}`}
          className="customer-auth-reference"
          fill
          priority
          sizes="100vw"
          src={`/figma/customer/auth/${frame}`}
          unoptimized
        />

        {view === "login" ? (
          <form
            aria-label="Sign In Customer"
            className="customer-auth-overlay"
            onSubmit={submitLogin}
          >
            <input
              aria-label="Username"
              autoComplete="username"
              className="customer-auth-control"
              onChange={(event) => {
                setUsername(event.target.value);
                setLoginError(null);
                setFeedback("");
              }}
              placeholder="Enter your username"
              required
              style={framePosition(830, 390, 400, 52)}
              value={username}
            />
            <input
              aria-label="Password"
              autoComplete="current-password"
              className="customer-auth-control"
              onChange={(event) => {
                setPassword(event.target.value);
                setLoginError(null);
                setFeedback("");
              }}
              placeholder="Enter your password"
              required
              style={framePosition(830, 495, 400, 52)}
              type={showPassword ? "text" : "password"}
              value={password}
            />
            {password && (
              <button
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                aria-pressed={showPassword}
                className="customer-auth-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                style={framePosition(1190, 504, 34, 34)}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  {showPassword ? (
                    <>
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                      <path d="M9.9 5.2A10.8 10.8 0 0112 5c5.5 0 9 7 9 7a15.7 15.7 0 01-3 3.8" />
                      <path d="M6.2 6.2C3.9 7.7 3 12 3 12s3.5 7 9 7a9.9 9.9 0 004.1-.9" />
                    </>
                  ) : (
                    <>
                      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </>
                  )}
                </svg>
              </button>
            )}
            <button
              aria-label="LOGIN"
              className="customer-auth-hotspot"
              disabled={submitting}
              style={framePosition(830, 590, 400, 52)}
              type="submit"
            />
            <Link
              aria-label="Belum punya akun? Sign Up"
              className="customer-auth-hotspot"
              href="/customer/signup"
              onClick={resetForm}
              style={framePosition(944, 651, 173, 21)}
            >
              <span className="sr-only">Belum punya akun? Sign Up</span>
            </Link>
            <Link
              aria-label="Kembali ke pilihan aktor"
              className="customer-auth-hotspot"
              href="/sign-in"
              style={framePosition(981, 674, 96, 22)}
            >
              <span className="sr-only">Kembali</span>
            </Link>
            {feedback && (
              <p className="customer-auth-feedback" role="alert">{feedback}</p>
            )}
            {loginError && <p className="sr-only" role="alert">{loginError}</p>}
          </form>
        ) : null}

        {view === "signup" ? (
          <form
            aria-label="Pendaftaran akun Customer"
            className="customer-auth-overlay"
            onSubmit={submitSignup}
          >
            <input
              aria-label="Nama Lengkap"
              autoComplete="name"
              className="customer-auth-control customer-auth-control-signup"
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Masukkan Nama Lengkap"
              required
              style={framePosition(849, 162, 519, 74)}
              value={fullName}
            />
            <input
              aria-label="Username"
              autoComplete="username"
              className="customer-auth-control customer-auth-control-signup"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Masukkan Username"
              required
              style={framePosition(849, 282, 519, 74)}
              value={username}
            />
            <input
              aria-label="Password"
              autoComplete="new-password"
              className="customer-auth-control customer-auth-control-signup"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan Password"
              required
              style={framePosition(849, 403, 519, 74)}
              type={showPassword ? "text" : "password"}
              value={password}
            />
            {password && (
              <button
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                aria-pressed={showPassword}
                className="customer-auth-password-toggle customer-auth-password-toggle-signup"
                onClick={() => setShowPassword((visible) => !visible)}
                style={framePosition(1327, 423, 34, 34)}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  {showPassword ? (
                    <>
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                      <path d="M9.9 5.2A10.8 10.8 0 0112 5c5.5 0 9 7 9 7a15.7 15.7 0 01-3 3.8" />
                      <path d="M6.2 6.2C3.9 7.7 3 12 3 12s3.5 7 9 7a9.9 9.9 0 004.1-.9" />
                    </>
                  ) : (
                    <>
                      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </>
                  )}
                </svg>
              </button>
            )}
            <button
              aria-label="Sign In"
              className="customer-auth-hotspot"
              disabled={submitting}
              style={framePosition(849, 505, 519, 56)}
              type="submit"
            />
            <Link
              aria-label="Kembali ke Sign In"
              className="customer-auth-signup-back"
              href="/customer/login"
              onClick={resetForm}
            >
              Kembali ke Sign In
            </Link>
            {feedback && (
              <p className="customer-auth-feedback customer-auth-signup-feedback" role="alert">
                {feedback}
              </p>
            )}
          </form>
        ) : null}

        {view === "username-used" ? (
          <div className="customer-auth-overlay">
            <Link
              aria-label="Sign Up dengan username lain"
              className="customer-auth-hotspot"
              href="/customer/signup"
              onClick={resetForm}
              style={framePosition(944, 651, 173, 21)}
            >
              <span className="sr-only">Sign Up dengan username lain</span>
            </Link>
            <Link
              aria-label="Kembali ke pilihan aktor"
              className="customer-auth-hotspot"
              href="/sign-in"
              style={framePosition(981, 674, 96, 22)}
            >
              <span className="sr-only">Kembali</span>
            </Link>
          </div>
        ) : null}

        {view === "registration-success" ? (
          <div className="customer-auth-overlay">
            <button
              aria-label="Sign In"
              className="customer-auth-hotspot"
              onClick={linkToLogin}
              style={framePosition(1005, 585, 183, 31)}
              type="button"
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}
