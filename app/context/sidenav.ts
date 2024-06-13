"use client";
import React from "react";

export const SetIsSideNavOpenContext = React.createContext(
  // Parameter is needed for type inference.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (isSideNavOpen: boolean): void => {
    throw new Error("SetIsSideNavOpenContext not implemented");
  },
);
