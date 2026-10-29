import type { Metadata, Viewport } from "next";
// ฟอนต์ภาษาไทยแบบ self-host (ไม่ต้องเชื่อมต่อ Google Fonts ตอน build — เหมาะกับเครือข่ายภายในองค์กร)
import "@fontsource/ibm-plex-sans-thai/thai-400.css";
import "@fontsource/ibm-plex-sans-thai/thai-500.css";
import "@fontsource/ibm-plex-sans-thai/thai-600.css";
import "@fontsource/ibm-plex-sans-thai/thai-700.css";
import "@fontsource/ibm-plex-sans-thai/latin-400.css";
import "@fontsource/ibm-plex-sans-thai/latin-500.css";
import "@fontsource/ibm-plex-sans-thai/latin-600.css";
import "@fontsource/ibm-plex-sans-thai/latin-700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "แบบประเมินความพึงพอใจผู้ใช้งานระบบลา",
    template: "%s | แบบประเมินระบบลา",
  },
  description:
    "แบบประเมินความพึงพอใจผู้ใช้งานระบบลา (Leave Management System Satisfaction Survey)",
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
