"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";

import { shouldHighlightLink } from "@/app/ui/should-highlight";

const NAV_LINKS = [
  { path: "/", label: "Home" },
  { path: "/resume", label: "Resume" },
  { path: "/side-projects", label: "Side Projects" },
];

type TopNavProps = { className?: string } & React.ComponentProps<"div">;

// https://github.com/jsx-eslint/eslint-plugin-react/issues/3284
// eslint-disable-next-line react/prop-types
export function TopNav({ className, ...otherProps }: TopNavProps) {
  const pathname = usePathname();

  return (
    <div
      className={`flex flex-row justify-center space-x-6 bg-gray-900 h-full ${className}`}
      {...otherProps}
    >
      {NAV_LINKS.map((navLink, index) => {
        return (
          <NavLink
            path={navLink.path}
            label={navLink.label}
            highlight={shouldHighlightLink(pathname, navLink.path, 1)}
            // biome-ignore lint/suspicious/noArrayIndexKey: Arrays are hard-coded with intentional order.
            key={index}
          />
        );
      })}
    </div>
  );
}

function NavLink(props: { path: string; label: string; highlight: boolean }) {
  // TODO: DRY these two lines with the SideNav component
  const fillColor = props.highlight ? "bg-gray-700" : "bg-gray-600";
  const bottomBorder = props.highlight
    ? "border-b-2 border-red-700"
    : "border-b-2 border-gray-600 hover:border-white";
  return (
    <Link href={props.path}>
      <div
        className={`px-2 py-1 border-box hover:bg-gray-800 hover:duration-100 active:bg-gray-900 ${fillColor} ${bottomBorder}`}
      >
        {props.label}
      </div>
    </Link>
  );
}
