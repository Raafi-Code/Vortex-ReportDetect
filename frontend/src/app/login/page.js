"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, Mail, Languages } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isAllowedUserEmail } from "@/lib/auth";
import { useLanguage } from "@/contexts/language-context";
import ThemeToggle from "@/components/theme-toggle";

export default function LoginPage() {
  const { language, toggleLanguage } = useLanguage();
  const isId = language === "id";
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const t = {
    denied: isId
      ? "Email tidak diizinkan mengakses dashboard ini."
      : "This email is not allowed to access this dashboard.",
    noAccess: isId
      ? "Email ini tidak memiliki akses."
      : "This email does not have access.",
    loginFailed: isId
      ? "Login gagal, silakan coba lagi."
      : "Login failed, please try again.",
    secureAccess: isId ? "Akses Aman" : "Secure Access",
    appName: "ATM Report",
    subtitle: isId
      ? "Login dengan email Anda untuk membuka dashboard monitoring."
      : "Login using your email to open the monitoring dashboard.",
    email: "Email",
    password: isId ? "Password" : "Password",
    emailPlaceholder: isId ? "nama@domain.com" : "name@domain.com",
    passwordPlaceholder: isId ? "Masukkan password" : "Enter password",
    processing: isId ? "Memproses..." : "Processing...",
    submit: isId ? "Masuk ke Dashboard" : "Sign In to Dashboard",
  };

  const redirectTo = useMemo(
    () => searchParams.get("next") || "/",
    [searchParams],
  );
  const initialError = useMemo(() => {
    const reason = searchParams.get("error");
    if (reason === "unauthorized") {
      return t.denied;
    }
    return "";
  }, [searchParams, t.denied]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        throw signInError;
      }

      const loggedInEmail = data.user?.email || email;
      if (!isAllowedUserEmail(loggedInEmail)) {
        await supabase.auth.signOut();
        throw new Error(t.noAccess);
      }

      router.replace(redirectTo);
    } catch (err) {
      setError(err.message || t.loginFailed);
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
            <Image
              src="/logo bni.png"
              alt="BNI logo"
              width={100}
              height={100}
              className="login-logo"
              priority
            />
            <p className="login-kicker">{t.secureAccess}</p>
          </div>
          <h1>{t.appName}</h1>
          <p>{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="form-label" htmlFor="email">
            {t.email}
          </label>
          <div className="login-input-wrap">
            <Mail size={16} />
            <input
              id="email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              required
            />
          </div>

          <label className="form-label" htmlFor="password">
            {t.password}
          </label>
          <div className="login-input-wrap">
            <Lock size={16} />
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.passwordPlaceholder}
              required
              minLength={6}
            />
          </div>

          {(initialError || error) && (
            <p className="login-error">{error || initialError}</p>
          )}

          <button
            type="submit"
            className="btn btn-primary login-submit shadow-lg shadow-emerald-500/20"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            <span>{isLoading ? t.processing : t.submit}</span>
          </button>
        </form>
      </div>
    </section>
  );
}
