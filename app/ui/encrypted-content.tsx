"use client";

import { AddEncryptionPasswordContext } from "@/app/context/encryption";
import { cachedFetch } from "@/app/lib/networking";
import { AES } from "encryption-for-node/lib/esm/AES.mjs";
import React, { useState } from "react";

export type Key_T = Buffer;

type EncryptedContentProps = {
  encryptedSourceURL: string;
  keyList: Key_T[];
  addKeyToList: (key: Key_T) => void;
};

type EncryptedBlobJson = {
  iv: Uint8Array;
  cipher_text: string;
  password_verification_cipher_text: string;
  password_verification_plaintext: string;
};

export function EncryptedContent({
  encryptedSourceURL,
  keyList,
  addKeyToList,
}: EncryptedContentProps) {
  const [encryptionJson, setEncryptionJson] = useState<
    EncryptedBlobJson | undefined
  >(undefined);
  const [decryptedText, setDecryptedText] = useState<string | undefined>(
    undefined,
  );

  const [isPasswordIncorrect, setIsPasswordIncorrect] = useState(false);

  // Checks if the provided key matches the password verification
  function checkKey(key: Buffer) {
    // TODO: Save key until encryptionJson is set, then check key
    if (!encryptionJson) return false;

    const passwordVerificationText = decryptData(
      Buffer.from(encryptionJson.password_verification_cipher_text, "base64"),
      key,
      Uint8Array.from(encryptionJson.iv),
    ).toString();
    return (
      passwordVerificationText ===
      encryptionJson.password_verification_plaintext
    );
  }

  // Add key to the list if it is correct
  function addPassword(password: string) {
    // Pad password to 32 bytes
    const paddedPassword = password.padEnd(32, " ");
    const key = Buffer.from(paddedPassword);
    if (checkKey(key)) {
      addKeyToList(key);
    } else {
      // Flash password box red if password is incorrect
      setIsPasswordIncorrect(true);
      setTimeout(() => setIsPasswordIncorrect(false), 1000);
      // TODO: "Password Incorrect" modal
    }
  }

  // Fetch encrypted blob
  React.useEffect(() => {
    if (!encryptionJson) {
      cachedFetch(encryptedSourceURL).then((response) => {
        response.blob().then((blob) => {
          blob.text().then((text) => {
            setEncryptionJson(JSON.parse(text));
          });
        });
      });
    }
  }, [encryptedSourceURL, encryptionJson]);

  // Find the key for this blob from the key list
  let thisAesKey: Key_T | undefined = undefined;
  for (const key of keyList) {
    if (checkKey(key)) {
      thisAesKey = key;
    }
  }

  React.useEffect(() => {
    // Decrypt blob if we have the key & encrypted data.
    if (encryptionJson && thisAesKey && !decryptedText) {
      const plaintext = decryptData(
        Buffer.from(encryptionJson.cipher_text, "base64"),
        thisAesKey,
        Uint8Array.from(encryptionJson.iv),
      ).toString();

      setDecryptedText(plaintext);
    }
  }, [encryptionJson, thisAesKey, decryptedText]);

  if (!decryptedText) {
    return (
      <AddEncryptionPasswordContext.Provider value={addPassword}>
        <PasswordBox isPasswordIncorrect={isPasswordIncorrect} />
      </AddEncryptionPasswordContext.Provider>
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
  const addEncryptionPassword = React.useContext(AddEncryptionPasswordContext);
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
          addEncryptionPassword(event.currentTarget.value);
        }
      }}
    />
  );
}
