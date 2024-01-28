#!/usr/bin/env node
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import parseArgs from "minimist";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import walkdir from "walkdir";
import mime from "mime";

const MINUTE_IN_SECONDS = 60;
const HOUR_IN_SECONDS = MINUTE_IN_SECONDS * 60;
const DAY_IN_SECONDS = HOUR_IN_SECONDS * 24;
const YEAR_IN_SECONDS = DAY_IN_SECONDS * 365;

const usage = `
deploy [-h]
-h help

Deploys "dist" folder to S3 bucket "shitfranciscosays.com" and triggers invalidation
  for root key
`;

const args = parseArgs(process.argv.slice(2), {
  boolean: ["help"],
  alias: {
    h: "help",
  },
});

if (args.help) {
  console.log(usage);
  process.exit();
}

await copyToS3();

async function copyToS3() {
  const s3Client = new S3Client({
    region: "us-west-1",
  });
  const dirpath = fileURLToPath(new URL("../dist/", import.meta.url));
  const filepaths = walkdir.sync(dirpath);
  for (const filepath of filepaths) {
    const relpath = path.relative(dirpath, filepath);
    await s3Client.send(
      new PutObjectCommand({
        Key: relpath,
        Bucket: "shitfranciscosays.com",
        Body: readFileSync(filepath),
        ContentType: mime.getType(filepath) || "application/octet-stream",
        CacheControl:
          // Don't cache .html files because they never change path
          relpath.endsWith(".html")
            ? "no-cache"
            : `max-age=${10 * YEAR_IN_SECONDS}`,
      })
    );
  }
  s3Client.destroy();
}
