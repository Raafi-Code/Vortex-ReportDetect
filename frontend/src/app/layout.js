import "./globals.css";
import Providers from "@/components/providers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ATM Report | BNI",
  description: "WhatsApp message monitoring and auto-forwarding dashboard",
  icons: {
    icon: "/bnitabbar.png",
    shortcut: "/bnitabbar.png",
    apple: "/bnitabbar.png",
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
