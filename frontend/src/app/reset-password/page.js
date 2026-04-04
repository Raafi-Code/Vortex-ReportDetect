"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Lock,
  Languages,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/language-context";
import ThemeToggle from "@/components/theme-toggle";

export default function ResetPasswordPage() {
  const { language, toggleLanguage } = useLanguage();
  const isId = language === "id";
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  const t = {
    title: isId ? "Reset Password" : "Reset Password",
    subtitle: isId
      ? "Masukkan password baru Anda."
      : "Enter your new password.",
    newPassword: isId ? "Password Baru" : "New Password",
    confirmPassword: isId ? "Konfirmasi Password" : "Confirm Password",
    passwordPlaceholder: isId ? "Minimal 6 karakter" : "At least 6 characters",
    confirmPlaceholder: isId
      ? "Ulangi password baru"
      : "Re-enter new password",
    processing: isId ? "Memperbarui..." : "Updating...",
    submit: isId ? "Perbarui Password" : "Update Password",
    backToLogin: isId ? "Kembali ke Login" : "Back to Login",
    goToDashboard: isId ? "Buka Dashboard" : "Go to Dashboard",
    successTitle: isId ? "Password Diperbarui!" : "Password Updated!",
    successMessage: isId
      ? "Password Anda berhasil diperbarui. Anda sekarang bisa login dengan password baru."
      : "Your password has been updated successfully. You can now login with your new password.",
    mismatch: isId
      ? "Password tidak cocok."
      : "Passwords do not match.",
    tooShort: isId
      ? "Password minimal 6 karakter."
      : "Password must be at least 6 characters.",
    failedGeneric: isId
      ? "Gagal memperbarui password. Silakan coba lagi."
      : "Failed to update password. Please try again.",
    invalidLink: isId
      ? "Link reset password tidak valid atau sudah kedaluwarsa. Silakan minta link baru."
      : "The reset link is invalid or has expired. Please request a new link.",
    verifying: isId ? "Memverifikasi..." : "Verifying...",
    requestNew: isId ? "Minta Link Baru" : "Request New Link",
  };

  // Listen for Supabase PASSWORD_RECOVERY event from the hash fragment
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setSessionReady(true);
        }
      }
    );

    // Also check if there's already a session (user may have arrived directly)
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSessionReady(true);
      } else {
        // Give a moment for the hash to be processed
        setTimeout(async () => {
          const { data: retryData } = await supabase.auth.getSession();
          if (retryData.session) {
            setSessionReady(true);
          } else {
            setSessionError(true);
          }
        }, 2000);
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(t.tooShort);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.mismatch);
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || t.failedGeneric);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while verifying the token
  if (!sessionReady && !sessionError) {
    return (
      <section className="login-shell px-4 py-8 relative">
        <div className="login-top-controls">
          <ThemeToggle />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={toggleLanguage}
            aria-label="Switch language"
            title="Switch language"
          >
            <Languages size={14} />
          </button>
        </div>

        <div className="login-card w-full">
          <div className="reset-success">
            <Loader2 size={36} className="animate-spin" style={{ color: "var(--accent)" }} />
            <p className="reset-success-message" style={{ marginTop: 16 }}>
              {t.verifying}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Show error if link is invalid/expired
  if (sessionError) {
    return (
      <section className="login-shell px-4 py-8 relative">
        <div className="login-top-controls">
          <ThemeToggle />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={toggleLanguage}
            aria-label="Switch language"
            title="Switch language"
          >
            <Languages size={14} />
          </button>
        </div>

        <div className="login-card w-full">
          <div className="login-heading">
            <div className="login-heading-top">
              <div className="login-logo-text">
                <Image
                  src="/vortex.png"
                  alt="Vortex logo"
                  width={100}
                  height={100}
                  className="login-logo"
                  priority
                />
                <h1>Vortex</h1>
              </div>
            </div>
          </div>
          <div className="reset-success">
            <p className="login-error" style={{ textAlign: "center" }}>
              {t.invalidLink}
            </p>
            <Link
              href="/forgot-password"
              className="btn btn-primary login-submit"
              style={{ marginTop: 12 }}
            >
              <span>{t.requestNew}</span>
            </Link>
            <Link href="/login" className="auth-back-link" style={{ marginTop: 12 }}>
              <ArrowLeft size={14} />
              <span>{t.backToLogin}</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="login-shell px-4 py-8 relative">
      <div className="login-top-controls">
        <ThemeToggle />
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={toggleLanguage}
          aria-label="Switch language"
          title="Switch language"
        >
          <Languages size={14} />
        </button>
      </div>

      <div className="login-card w-full">
        <div className="login-heading">
          <div className="login-heading-top">
            <div className="login-logo-text">
              <Image
                src="/vortex.png"
                alt="Vortex logo"
                width={100}
                height={100}
                className="login-logo"
                priority
              />
              <h1>Vortex</h1>
            </div>
          </div>
          <p>{success ? t.successTitle : t.subtitle}</p>
        </div>

        {success ? (
          <div className="reset-success">
            <div className="reset-success-icon">
              <CheckCircle size={48} />
            </div>
            <p className="reset-success-message">{t.successMessage}</p>
            <button
              className="btn btn-primary login-submit"
              onClick={() => router.replace("/")}
            >
              <span>{t.goToDashboard}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <label className="form-label" htmlFor="new-password">
              {t.newPassword}
            </label>
            <div className="login-input-wrap">
              <Lock size={16} />
              <input
                id="new-password"
                className="input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                required
                minLength={6}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <label className="form-label" htmlFor="confirm-password">
              {t.confirmPassword}
            </label>
            <div className="login-input-wrap">
              <Lock size={16} />
              <input
                id="confirm-password"
                className="input"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.confirmPlaceholder}
                required
                minLength={6}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button
              type="submit"
              className="btn btn-primary login-submit shadow-lg shadow-emerald-500/20"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{isLoading ? t.processing : t.submit}</span>
            </button>

            <Link href="/login" className="auth-back-link">
              <ArrowLeft size={14} />
              <span>{t.backToLogin}</span>
            </Link>
          </form>
        )}
      </div>
    </section>
  );
}
