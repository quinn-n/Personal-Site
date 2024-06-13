import type React from "react";

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-row justify-start h-full w-screen">
      {children}
    </div>
  );
}
