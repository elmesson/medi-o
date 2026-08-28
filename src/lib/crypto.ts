import crypto from "crypto";

const ALG = "aes-256-gcm";
function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY || "";
  // espera 64 hex chars = 32 bytes; se não, deriva com sha256
  if (/^[0-9a-fA-F]{64}$/.test(hex)) return Buffer.from(hex, "hex");
  return crypto.createHash("sha256").update(hex).digest();
}

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decrypt(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALG, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const dec = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return dec.toString("utf8");
}

export function hashCpfCnpj(doc: string): string {
  const clean = doc.replace(/\D/g, "");
  return crypto.createHash("sha256").update(clean).digest("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
