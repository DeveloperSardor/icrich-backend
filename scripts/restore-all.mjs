/**
 * backup-all.mjs bilan yaratilgan papkadan barcha kolleksiyalarni tiklaydi.
 * Bo‘sh yoki yangi bazaga qo‘ying. DB_URL ni yangi cluster yoki local Mongo ga o‘rnating.
 *
 * Mahalliy Mongo misol: DB_URL=mongodb://127.0.0.1:27017/icrich
 *
 * Ishlatish: npm run db:restore -- ./backups/backup-2026-04-13T12-00-00-000Z
 * Mavjud hujjatlarni o‘chirib yuborib qayta yuklash: --force
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { EJSON } from "bson";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, "..");

dotenv.config({ path: path.join(backendRoot, ".env") });

const args = process.argv.slice(2).filter((a) => a !== "--force");
const force = process.argv.includes("--force");
const backupDir = args[0];

const uri = process.env.DB_URL?.trim();
if (!uri) {
  console.error("DB_URL .env da yo‘q.");
  process.exit(1);
}

if (!backupDir || !fs.existsSync(backupDir)) {
  console.error("Backup papkasini ko‘rsating: npm run db:restore -- ./backups/backup-...");
  process.exit(1);
}

async function main() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 30_000 });
  const db = mongoose.connection.db;

  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.endsWith(".json") && f !== "manifest.json");

  for (const file of files.sort()) {
    const name = path.basename(file, ".json");
    const raw = fs.readFileSync(path.join(backupDir, file), "utf8");
    const docs = EJSON.parse(raw);
    if (!Array.isArray(docs)) {
      console.warn(`  ${name}: kutilmagan format, o‘tkazib yuborildi`);
      continue;
    }
    if (docs.length === 0) {
      console.log(`  ${name}: 0 hujjat`);
      continue;
    }

    const col = db.collection(name);
    if (force) {
      await col.deleteMany({});
    }
    await col.insertMany(docs, { ordered: false });
    console.log(`  ${name}: ${docs.length} hujjat yuklandi`);
  }

  console.log("\nTiklash yakunlandi.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
