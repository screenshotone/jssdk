import { Crypto } from "@peculiar/webcrypto";

const encoder = new TextEncoder();

export async function signQueryString(queryString: string, secretKey: string) {
    const webCrypto =
        typeof globalThis.crypto !== "undefined"
            ? globalThis.crypto
            : new Crypto();

    let algorithm = { name: "HMAC", hash: "SHA-256" };
    let key = await webCrypto.subtle.importKey(
        "raw",
        encoder.encode(secretKey),
        algorithm,
        false,
        ["sign", "verify"]
    );
    const digest = await webCrypto.subtle.sign(
        algorithm.name,
        key,
        encoder.encode(queryString)
    );

    const signature = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    return signature;
}
