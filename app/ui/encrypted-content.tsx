"use client";

import { SetEncryptionPasswordContext } from "@/app/context/encryption";
import { cachedFetch } from "@/app/lib/networking";
import { AES } from "encryption-for-node/lib/esm/AES.mjs";
import React, { useState } from "react";

type EncryptedContentProps = { encryptedSourceURL: string };

type EncryptedBlobJson = {
  iv: Uint8Array;
  cipher_text: string;
  password_verification_cipher_text: string;
  password_verification_plaintext: string;
};

// TODO: placeholder children?
export function EncryptedContent({
  encryptedSourceURL,
}: EncryptedContentProps) {
  const [encryptionJson, setEncryptionJson] = useState<
    EncryptedBlobJson | undefined
  >(undefined);
  const [aesKey, setAesKey] = useState<Buffer | undefined>(undefined);

  const [decryptedText, setDecryptedText] = useState<string | undefined>(
    undefined,
  );

  const [isPasswordIncorrect, setIsPasswordIncorrect] = useState(false);

  function setEncryptionPassword(password: string) {
    // Pad password to 32 bytes
    const paddedPassword = password.padEnd(32, " ");
    setAesKey(Buffer.from(paddedPassword));
  }

  // Fetch encrypted blob
  if (!encryptionJson) {
    cachedFetch(encryptedSourceURL).then((response) => {
      console.log("got status:", response.status);
      response.blob().then((blob) => {
        blob.text().then((text) => {
          setEncryptionJson(JSON.parse(text));
        });
      });
    });
  }

  // Decrypt blob
  if (encryptionJson && aesKey && !decryptedText) {
    const passwordVerificationText = decryptData(
      Buffer.from(encryptionJson.password_verification_cipher_text, "base64"),
      aesKey,
      Uint8Array.from(encryptionJson.iv),
    ).toString();

    // Verify password
    if (
      passwordVerificationText ===
      encryptionJson.password_verification_plaintext
    ) {
      // Decrypt content if password is correct
      const decryptedText = decryptData(
        Buffer.from(encryptionJson.cipher_text, "base64"),
        aesKey,
        Uint8Array.from(encryptionJson.iv),
      ).toString();

      console.log("Decrypted text: ", decryptedText);
      setDecryptedText(decryptedText);
    } else {
      // Flash password box red if password is incorrect
      console.log("Password incorrect");
      setIsPasswordIncorrect(true);
      setAesKey(undefined);
      setTimeout(() => setIsPasswordIncorrect(false), 1000);
      // TODO: "Password Incorrect" modal
    }
  }

  if (!decryptedText) {
    return (
      <SetEncryptionPasswordContext.Provider value={setEncryptionPassword}>
        <PasswordBox isPasswordIncorrect={isPasswordIncorrect} />
      </SetEncryptionPasswordContext.Provider>
    );
  }

  return <div>{decryptedText}</div>;
}

/**
 * Decrypts data using AES
 * @param buffer Data to decrypt
 * @param key Encryption key
 * @param iv Initialization vector
 * @returns Decrypted data
 */
function decryptData(buffer: Buffer, key: Buffer, iv: Uint8Array) {
  const aes = new AES();
  aes.set_iv(iv);
  aes.set_key(key);
  return aes.decrypt(buffer, true);
}

// Password box component
function PasswordBox({
  isPasswordIncorrect,
}: { isPasswordIncorrect: boolean }) {
  const setEncryptionPassword = React.useContext(SetEncryptionPasswordContext);
  const backgroundColor = isPasswordIncorrect ? "bg-red-600" : "";
  const hoverColor = isPasswordIncorrect ? "" : "hover:bg-gray-200";
  const placeholderText = isPasswordIncorrect
    ? "Incorrect password"
    : "Enter password to decrypt";
  return (
    <input
      type="password"
      placeholder={placeholderText}
      className={`border-2 border-gray-600 text-black text-center rounded-full w-full h-8 duration-150 ${backgroundColor} ${hoverColor}`}
      onKeyUp={(event) => {
        if (event.key === "Enter") {
          console.log("Password entered: ", event.currentTarget.value);
          setEncryptionPassword(event.currentTarget.value);
        }
      }}
    />
  );
}
