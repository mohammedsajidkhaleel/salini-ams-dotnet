import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { AuthProvider } from "@/contexts/auth-context-new";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { AuthDebug } from "@/components/auth-debug";
import { NavigationProvider } from "@/components/navigation-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Salini AMS - IT Asset Management System",
  description: "Comprehensive IT asset tracking and management platform for Salini Construction",
  generator: "Next.js",
  keywords: ["IT", "Asset Management", "Inventory", "Tracking", "Salini"],
  authors: [{ name: "Salini Construction" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ErrorBoundary>
          <AuthProvider>
            <NavigationProvider>
              <Suspense 
                fallback={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading...</p>
                    </div>
                  </div>
                }
              >
                {children}
              </Suspense>
              <AuthDebug />
            </NavigationProvider>
          </AuthProvider>
        </ErrorBoundary>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
