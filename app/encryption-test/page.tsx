import { EncryptedContent } from "@/app/ui/encrypted-content";

export default function Page() {
  return (
    <div className="flex flex-col items-center space-y-2 mx-2">
      <h1>Encryption Test</h1>
      <p>
        This is a test of the encryption system. The encrypted content is
        fetched from the server and decrypted in the browser.
      </p>
      <p>
        The password for the test file is `91SY):[QC|xKG~`pzj1R?No9wRsl)TNX`.
      </p>
      <EncryptedContent encryptedSourceURL="/encrypted-content/test_encrypted.json" />
    </div>
  );
}
