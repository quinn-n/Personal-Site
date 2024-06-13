import { SetIsSideNavOpenContext } from "@/app/context/sidenav";
import {
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
} from "@heroicons/react/24/outline";
import React from "react";

export function SideNavToggleButton({
  shown,
  sideNavOpen,
}: { shown: boolean; sideNavOpen: boolean }) {
  const setIsSideNavOpen = React.useContext(SetIsSideNavOpenContext);
  function toggleSideNav() {
    setIsSideNavOpen(!sideNavOpen);
  }
  return (
    <div
      className={`cursor-pointer ${shown ? "" : "hidden"}`}
      onClick={toggleSideNav}
      onKeyUp={toggleSideNav}
    >
      {sideNavOpen ? <ArrowLeftCircleIcon /> : <ArrowRightCircleIcon />}
    </div>
  );
}
