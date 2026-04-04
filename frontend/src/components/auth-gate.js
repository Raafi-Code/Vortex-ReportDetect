"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isAllowedUserEmail } from "@/lib/auth";

function buildLoginUrl(pathname) {
  const next =
    pathname && pathname !== "/login"
      ? `?next=${encodeURIComponent(pathname)}`
      : "";
  return `/login${next}`;
}

export default function AuthGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  const isPublicPage = useMemo(
    () =>
      pathname === "/login" ||
      pathname === "/forgot-password" ||
      pathname === "/reset-password",
    [pathname],
  );

  const isResetPage = useMemo(() => pathname === "/reset-password", [pathname]);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error) {
        await supabase.auth.signOut();
        if (!isPublicPage) router.replace("/login");
        setIsChecking(false);
        return;
      }

      const user = data.session?.user;
      const email = user?.email;

      if (!user) {
        if (!isPublicPage) {
          router.replace(buildLoginUrl(pathname));
        }
        setIsChecking(false);
        return;
      }

      if (!isAllowedUserEmail(email)) {
        await supabase.auth.signOut();
        router.replace("/login?error=unauthorized");
        setIsChecking(false);
        return;
      }

      // Don't redirect away from reset-password even if logged in
      if (pathname === "/login") {
        router.replace("/");
      }

      setIsChecking(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;

      // Don't interfere with PASSWORD_RECOVERY flow
      if (_event === "PASSWORD_RECOVERY") return;

      const email = session?.user?.email;

      if (!session?.user) {
        if (!isPublicPage) {
          router.replace(buildLoginUrl(pathname));
        }
        return;
      }

      if (!isAllowedUserEmail(email)) {
        await supabase.auth.signOut();
        router.replace("/login?error=unauthorized");
        return;
      }

      if (pathname === "/login") {
        router.replace("/");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [isPublicPage, isResetPage, pathname, router]);

  if (isChecking && !isPublicPage) {
    return (
      <div className="loading-center" style={{ minHeight: "100vh" }}>
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  return children;
}
