import "./globals.css";
import Providers from "@/components/providers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vortex - ReportDetect",
  description: "WhatsApp message monitoring and auto-forwarding dashboard",
  icons: {
    icon: "/vortex.png",
    shortcut: "/vortex.png",
    apple: "/vortex.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
