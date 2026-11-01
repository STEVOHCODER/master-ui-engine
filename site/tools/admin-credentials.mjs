/* Repo-local: create the three Vercel environment values for the owner console
   without storing the password anywhere.

     node site/tools/admin-credentials.mjs --username me --generate
       writes site/.env.admin and prints one fresh password, once, to copy

     printf '%s' "$PASS" | node site/tools/admin-credentials.mjs --username me
       hashes a password you choose instead

   Either way the file keeps only the scrypt hash, never the password. Add each
   value to Vercel with:

     set -o pipefail && grep '^ADMIN_PASSWORD_HASH=' .env.admin | cut -d= -f2- \
       | vercel env add ADMIN_PASSWORD_HASH production */
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPasswordHash } from "../api/_admin.js";

const SITE = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);

/* No I/O/0/1 so the password survives being retyped from a terminal. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function flag(name) {
  const index = args.indexOf(name);
  return index === -1 ? "" : String(args[index + 1] || "");
}

function has(name) {
  return args.includes(name);
}

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function generatedPassword() {
  const bytes = randomBytes(18);
  let out = "";
  for (let index = 0; index < bytes.length; index += 1) out += ALPHABET.charAt(bytes[index] % ALPHABET.length);
  return out.replace(/(.{6})(?=.)/g, "$1-");
}

const emit = flag("--emit");
const username = flag("--username") || "site-owner";
const piped = readStdin();
const password = has("--generate") ? generatedPassword() : piped.replace(/\r?\n$/, "");

if (emit) {
  if (emit !== "ADMIN_SESSION_SECRET") {
    process.stderr.write("this tool only emits ADMIN_SESSION_SECRET; the hash is in site/.env.admin\n");
    process.exit(1);
  }
  process.stdout.write(randomBytes(32).toString("base64"));
  process.exit(0);
}

if (password.length < 8) {
  process.stderr.write("pipe the password in via stdin, or pass --generate to have one created (minimum 8 characters)\n");
  process.exit(1);
}

const values = {
  ADMIN_USERNAME: username,
  ADMIN_PASSWORD_HASH: createPasswordHash(password),
  ADMIN_SESSION_SECRET: randomBytes(32).toString("base64"),
};

const target = join(SITE, ".env.admin");
writeFileSync(target, Object.entries(values).map(([key, value]) => key + "=" + value).join("\n") + "\n", { mode: 0o600 });

process.stdout.write(
  (has("--generate")
    ? "sign-in password (shown once, not stored anywhere):\n  " + password + "\n\n"
    : "") +
  "wrote " + target + "\n" +
  "  ADMIN_USERNAME       = " + username + "\n" +
  "  ADMIN_PASSWORD_HASH  = scrypt hash of the password (" + password.length + " characters, not stored)\n" +
  "  ADMIN_SESSION_SECRET = 44-character base64 token key\n" +
  "add each value to Vercel, then delete this file:\n" +
  "  set -o pipefail && grep '^ADMIN_PASSWORD_HASH=' .env.admin | cut -d= -f2- | vercel env add ADMIN_PASSWORD_HASH production\n"
);

