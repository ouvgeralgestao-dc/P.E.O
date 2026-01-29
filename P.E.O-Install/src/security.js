const crypto = require("crypto");

/**
 * P.E.O Security Engine (CommonJS)
 */
class SecurityEngine {
  constructor(secretKey) {
    this.key = crypto.scryptSync(secretKey, "pmdc-salt", 32);
    this.algorithm = "aes-256-gcm";
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  }

  decrypt(ciphertext) {
    const [ivHex, authTagHex, encrypted] = ciphertext.split(":");

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}

module.exports = { SecurityEngine };
