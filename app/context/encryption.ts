"use client";

import React from "react";

export const SetEncryptionPasswordContext = React.createContext(
  // Password is needed for type inference.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (password: string): void => {
    throw new Error("SetEncryptionPasswordContext not implemented");
  },
);
