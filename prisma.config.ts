import { defineConfig } from "prisma/config";
import * as fs from "fs";
import * as path from "path";

// Cargar .env manualmente
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    const value = rest.join("=").replace(/^"|"$/g, "");
    if (key && !process.env[key]) process.env[key] = value;
  }
}

export default defineConfig({});