import type { Metadata } from "next";
import "./globals.css";
import { LogOut } from "lucide-react";
import SidebarNav from "@/components/SidebarNav";
import ThemeToggle from "@/components/ThemeToggle";
import MobileNav from "@/components/MobileNav";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { getProfileData } from "@/actions/users";

export const metadata: Metadata = {
  title: "LEGA Laboratorio | Sistema de Gestión",
  description: "Sistema profesional de gestión de turnos para laboratorios.",
  icons: {
    icon: "/logofavicon.png",
    apple: "/logofavicon.png",
  },
  openGraph: {
    title: "LEGA Laboratorio | Sistema de Gestión",
    description: "Gestión avanzada de turnos y pacientes para LEGA Laboratorio.",
    url: "https://legalaboratorio.vercel.app", // Fallback URL
    siteName: "LEGA Laboratorio",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "LEGA Laboratorio Logo",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
};

import ShellLayout from "@/components/ShellLayout";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession() as any;
  let userData = null;
  if (session) {
    const res = await getProfileData();
    userData = res.data;
  }

  if (!session) {
    return (
      <html lang="es">
        <head>
          <script dangerouslySetInnerHTML={{
            __html: `
            (function() {
              try {
                const theme = localStorage.getItem('theme') || 'light';
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            })()
          `}} />
        </head>
        <body>
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {children}
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="es">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
          (function() {
            try {
              const theme = localStorage.getItem('theme') || 'light';
              document.documentElement.setAttribute('data-theme', theme);
            } catch (e) {}
          })()
        `}} />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <MobileNav session={session} userData={userData} />
        <ShellLayout session={session} userData={userData}>
          {children}
        </ShellLayout>
      </body>
    </html>
  );
}
