import { TopNav } from "@/app/ui/topnav";
import type { Metadata } from "next";

import { Inter } from "next/font/google";
import type React from "react";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col h-screen w-screen">
          <TopNav className="h-max" />
          <div className="flex justify-center items-center flex-grow">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
