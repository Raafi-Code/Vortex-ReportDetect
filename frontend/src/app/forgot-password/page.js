"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Mail, Languages, ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/language-context";
import ThemeToggle from "@/components/theme-toggle";

export default function ForgotPasswordPage() {
  const { language, toggleLanguage } = useLanguage();
  const isId = language === "id";

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const t = {
    title: isId ? "Lupa Password" : "Forgot Password",
    subtitle: isId
      ? "Masukkan email Anda untuk menerima link reset password."
      : "Enter your email to receive a password reset link.",
    email: "Email",
    emailPlaceholder: isId ? "nama@domain.com" : "name@domain.com",
    processing: isId ? "Mengirim..." : "Sending...",
    submit: isId ? "Kirim Link Reset" : "Send Reset Link",
    backToLogin: isId ? "Kembali ke Login" : "Back to Login",
    successTitle: isId ? "Email Terkirim!" : "Email Sent!",
    successMessage: isId
      ? "Periksa inbox email Anda untuk link reset password. Link ini akan kedaluwarsa dalam 1 jam."
      : "Check your email inbox for the password reset link. The link will expire in 1 hour.",
    failedGeneric: isId
      ? "Gagal mengirim email reset. Silakan coba lagi."
      : "Failed to send reset email. Please try again.",
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: redirectUrl }
      );

      if (resetError) {
        throw resetError;
      }

      setSent(true);
    } catch (err) {
      setError(err.message || t.failedGeneric);
    } finally {
      setIsLoading(false);
    }
  };

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
          <p>{sent ? t.successTitle : t.subtitle}</p>
        </div>

        {sent ? (
          <div className="reset-success">
            <div className="reset-success-icon">
              <CheckCircle size={48} />
            </div>
            <p className="reset-success-message">{t.successMessage}</p>
            <Link href="/login" className="btn btn-secondary login-submit">
              <ArrowLeft size={16} />
              <span>{t.backToLogin}</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <label className="form-label" htmlFor="forgot-email">
              {t.email}
            </label>
            <div className="login-input-wrap">
              <Mail size={16} />
              <input
                id="forgot-email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
              />
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
