/**
 * Mahalliy (yoki bo'sh) bazada birinchi admin yaratadi. Parol pre-save da hashlanadi.
 *
 *   cd backend && npm run seed:admin
 *
 * O'z login/parolingiz: bir martalik
 *   SEED_ADMIN_LOGIN=a SEED_ADMIN_PASSWORD=b npm run seed:admin
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import AdminSchema from "../src/schemas/admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const login = process.env.SEED_ADMIN_LOGIN?.trim() || "log1n";
const password = process.env.SEED_ADMIN_PASSWORD || "passw0rd";
const fullname = process.env.SEED_ADMIN_NAME?.trim() || "Administrator";

async function main() {
  const uri = process.env.DB_URL?.trim();
  if (!uri) {
    console.error("DB_URL .env da yo'q.");
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15_000 });

  const exists = await AdminSchema.findOne({ login });
  if (exists) {
    console.log(`Admin allaqachon bor: login="${login}"`);
    await mongoose.disconnect();
    return;
  }

  await AdminSchema.create({ fullname, login, password });
  console.log("Admin yaratildi.");
  console.log(`  login:    ${login}`);
  console.log(`  password: ${password}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
