import fs from "node:fs";

const rows = JSON.parse(fs.readFileSync("scripts/gym-urls.json", "utf8"));

async function ok(url, retries = 3) {
  const id = url.split("/embed/")[1]?.split(/[?&]/)[0];
  if (!id) return false;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(
        "https://www.youtube.com/oembed?url=" +
          encodeURIComponent("https://www.youtube.com/watch?v=" + id) +
          "&format=json",
      );
      return res.ok;
    } catch {
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  return false;
}

let good = 0;
let bad = 0;
const badSlugs = [];
for (const row of rows) {
  const pass = await ok(row.demo_video_url);
  if (pass) good++;
  else {
    bad++;
    badSlugs.push(row.slug);
  }
  await new Promise((r) => setTimeout(r, 50));
}
console.log(JSON.stringify({ good, bad, badSlugs }, null, 2));
