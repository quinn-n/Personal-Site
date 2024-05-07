import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TopNav } from "@/app/ui/topnav";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

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
          <div className="flex justify-center items-center flex-grow flex-shrink">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
/*
          <div className="flex justify-center items-center w-full h-full">
            {children}
          </div>
*/


//          <TopNav className="fixed top-0 z-50 w-full" />

/*
          <div className="flex flex-col flex-grow justify-center items-center max-h-[96%]">
            {children}
          </div>
*/