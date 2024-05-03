"use client";

import Link from "next/link";
import { shouldHighlightLink } from "@/app/ui/should-highlight";

export function SideNav(props: { navLinks: { path: string, label: string }[] } ) {
  return <div className="bg-gray-900">
    {
      props.navLinks.map((navLink, index) => {
        return <NavLink path={navLink.path} label={navLink.label} highlight={shouldHighlightLink(navLink.path, 2)} key={index}/>;
      })
    }
  </div>;
}

function NavLink(props: { path: string, label: string, highlight: boolean }) {
  const fillColor = props.highlight ? "bg-gray-700" : "bg-gray-600";
  const border = props.highlight ? "border-r-2 border-red-700" : "border-r-2 border-gray-600 hover:border-white";
  return <Link href={props.path}>
    <div className={`px-4 py-2 w-fill min-w-max border-box hover:bg-gray-800 active:bg-gray-900 hover:duration-300 active:duration-100 ${border} ${fillColor}`}>
      {props.label}
    </div>
  </Link>
}
