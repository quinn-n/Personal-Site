"use client";

import { SetIsSideNavOpenContext } from "@/app/context/sidenav";
import { shouldHighlightLink } from "@/app/ui/should-highlight";
import { SideNavToggleButton } from "@/app/ui/sidenav-toggle";
import { Backdrop } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export type NavLink_T = {
  path: string;
  label: string;
};

export function SideNav(props: {
  navLinks: NavLink_T[];
}) {
  const pathname = usePathname();

  const [isSideNavOpen, setIsSideNavOpen] = React.useState(false);
  function closeSideNav() {
    setIsSideNavOpen(false);
  }

  return (
    <div className="z-10">
      <Backdrop
        className="cursor-pointer"
        open={isSideNavOpen}
        onClick={closeSideNav}
      />
      <div
        className={`fixed flex h-full top-0 z-10 duration-200 ${
          isSideNavOpen ? "" : "-translate-x-full"
        }`}
      >
        <div
          className={`bg-gray-900 h-full duration-200 ${
            isSideNavOpen ? "z-20" : ""
          }`}
        >
          {props.navLinks.map((navLink, index) => {
            return (
              <NavLink
                path={navLink.path}
                label={navLink.label}
                highlight={shouldHighlightLink(pathname, navLink.path, 2)}
                onClick={closeSideNav}
                // biome-ignore lint/suspicious/noArrayIndexKey: Arrays are hard-coded with intentional order.
                key={index}
              />
            );
          })}
        </div>
      </div>
      <div
        className={`fixed bottom-2 md:bottom-auto md:top-8 w-16 rounded-full duration-200 z-30 ${
          isSideNavOpen ? "left-32" : "left-2"
        }`}
      >
        <SetIsSideNavOpenContext.Provider value={setIsSideNavOpen}>
          <SideNavToggleButton shown={true} sideNavOpen={isSideNavOpen} />
        </SetIsSideNavOpenContext.Provider>
      </div>
    </div>
  );
}

function NavLink(props: {
  path: string;
  label: string;
  highlight: boolean;
  onClick?: () => void;
}) {
  const fillColor = props.highlight ? "bg-gray-700" : "bg-gray-600";
  const border = props.highlight
    ? "border-r-2 border-red-700"
    : "border-r-2 border-gray-600 hover:border-white";
  return (
    <Link href={props.path} onClick={props.onClick} onKeyUp={props.onClick}>
      <div
        className={`px-4 py-2 w-fill min-w-max border-box hover:bg-gray-800 active:bg-gray-900 hover:duration-300 active:duration-100 ${border} ${fillColor}`}
      >
        {props.label}
      </div>
    </Link>
  );
}
