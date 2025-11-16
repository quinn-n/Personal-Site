"use client";
import { EncryptedContent, type Key_T } from "@/app/ui/encrypted-content";
import { useState } from "react";

export default function Page() {
  const [keyList, setKeyList] = useState<Key_T[]>([]);
  const addKeyToList = (key: Key_T) => {
    setKeyList((prev) => [...prev, key]);
  };
  return (
    <div className="flex flex-col items-center space-y-2 mx-2">
      <h1>Encryption Test</h1>
      <p>
        This is a test of the encryption system. The encrypted content is
        fetched from the server and decrypted in the browser.
      </p>
      <p>
        The password for the test file is{" "}
        <code className="bg-gray-700">91SY):[QC|xKG~`pzj1R?No9wRsl)TNX</code>.
      </p>
      <EncryptedContent
        encryptedSourceURL="/encrypted-content/test_encrypted.json"
        keyList={keyList}
        addKeyToList={addKeyToList}
      />
      <EncryptedContent
        encryptedSourceURL="/encrypted-content/test_encrypted_2.json"
        keyList={keyList}
        addKeyToList={addKeyToList}
      />
      <p>
        The password for this file is <code className="bg-gray-700">hello</code>
        .
      </p>
      <EncryptedContent
        encryptedSourceURL="/encrypted-content/odd_password_length.json"
        keyList={keyList}
        addKeyToList={addKeyToList}
      />
    </div>
  );
}
