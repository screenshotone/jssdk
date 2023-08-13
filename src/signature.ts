const encoder = new TextEncoder();

export async function signQueryString(queryString: string, secretKey: string) {
    let algorithm = { name: "HMAC", hash: "SHA-256" };
    let key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secretKey),
        algorithm,
        false,
        ["sign", "verify"]
    );
    const digest = await crypto.subtle.sign(
        algorithm.name,
        key,
        encoder.encode(queryString)
    );

    const signature = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    return signature;
}
