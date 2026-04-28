/**
 * Barcha MongoDB kolleksiyalarini JSON (Extended JSON) ga eksport qiladi.
 * Atlas yoki boshqa URI ishlayotganda: npm run db:backup
 * Natija: backend/backups/backup-<sana>/
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

const uri = process.env.DB_URL?.trim();
if (!uri) {
  console.error("DB_URL .env da yo‘q.");
  process.exit(1);
}

function safeDirName(d) {
  return d.replace(/[:.]/g, "-");
}

async function main() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 30_000 });
  const db = mongoose.connection.db;
  const dbName = db.databaseName;
  const stamp = safeDirName(new Date().toISOString());
  const outDir = path.join(backendRoot, "backups", `backup-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  const cols = await db.listCollections().toArray();
  const names = cols.map((c) => c.name).filter((n) => !n.startsWith("system."));

  const manifest = {
    exportedAt: new Date().toISOString(),
    database: dbName,
    collections: [],
  };

  for (const name of names.sort()) {
    const docs = await db.collection(name).find({}).toArray();
    const file = path.join(outDir, `${name}.json`);
    fs.writeFileSync(file, EJSON.stringify(docs, { relaxed: false }), "utf8");
    manifest.collections.push({ name, count: docs.length });
    console.log(`  ${name}: ${docs.length} hujjat`);
  }

  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  console.log(`\nTayyor: ${outDir}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
