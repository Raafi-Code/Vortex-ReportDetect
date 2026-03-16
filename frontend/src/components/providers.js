"use client";

import { ThemeProvider } from "next-themes";
import AuthGate from "@/components/auth-gate";
import AppShell from "@/components/app-shell";
import { LanguageProvider } from "@/contexts/language-context";

export default function Providers({ children }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <LanguageProvider>
        <AuthGate>
          <AppShell>{children}</AppShell>
        </AuthGate>
      </LanguageProvider>
    </ThemeProvider>
  );
}
