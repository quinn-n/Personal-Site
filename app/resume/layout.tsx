import { type NavLink_T, SideNav } from "@/app/ui/sidenav";

import type React from "react";

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-row justify-start h-full w-screen">
      <SideNav navLinks={NAV_LINKS} />
      <div className="absolute top-8 bottom-0 left-0 right-0 h-max">
        {children}
      </div>
    </div>
  );
}

const NAV_LINKS: NavLink_T[] = [
  { path: "/resume", label: "Overview" },
  { path: "/resume/backend", label: "Backend" },
  { path: "/resume/frontend", label: "Frontend" },
  { path: "/resume/embedded", label: "Embedded" },
  { path: "/resume/python", label: "Python" },
  { path: "/resume/react", label: "React" },
  { path: "/resume/cplusplus", label: "C++" },
  { path: "/resume/lua", label: "Lua" },
];
