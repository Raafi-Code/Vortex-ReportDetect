import './globals.css';
import Sidebar from '@/components/Sidebar';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'BNI WhatsApp ReportDetect - Dashboard',
  description: 'WhatsApp message monitoring and auto-forwarding dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content animate-fade-in">{children}</main>
        </div>
      </body>
    </html>
  );
}
