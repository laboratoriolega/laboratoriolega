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
  description: "Sistema profesional de gestión de turnos para laboratorios.", // v1.1.7 build
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LEGA",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

import ShellLayout from "@/components/ShellLayout";
import { headers } from "next/headers";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession() as any;
  const headerList = await headers();
  const pathname = headerList.get('x-pathname') || '';
  const isPortal = pathname.startsWith('/resultado') || pathname.startsWith('/totem');

  let userData = null;
  if (session) {
    const res = await getProfileData();
    userData = res.data;
  }

  // If it's the public portal, don't show the admin shell/nav ever
  if (isPortal || !session) {
    return (
      <html lang="es">
        <head>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="LEGA" />
          <meta name="mobile-web-app-capable" content="yes" />
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
          <div style={isPortal ? { minHeight: '100vh' } : { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {children}
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="es">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LEGA" />
        <meta name="mobile-web-app-capable" content="yes" />
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
