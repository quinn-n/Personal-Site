"use client";

import React from "react";

export const AddEncryptionPasswordContext = React.createContext(
  // `password` is needed for type inference.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (password: string): void => {
    throw new Error("AddEncryptionPasswordContext not implemented");
  },
);
