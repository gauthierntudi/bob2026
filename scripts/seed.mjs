import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

function d1(sql) {
  const out = execFileSync(
    "npx",
    ["wrangler", "d1", "execute", "bob-votes", "--local", "--json", "--command", sql],
    { encoding: "utf8" },
  );
  const start = out.indexOf("[");
  return JSON.parse(out.slice(start));
}

const count = d1("SELECT count(*) AS n FROM candidates")[0].results[0].n;
if (Number(count) > 0) {
  console.log("La base contient déjà des candidats. Seed ignoré.");
  process.exit(0);
}

const people = [
  ["Amina Diallo", "Halo", 12],
  ["Luc Mensah", "Lose Yourself", 7],
  ["Chloé N'Guessan", "Respect", 5],
  ["Yanis Traoré", "Blinding Lights", 3],
];
const sheets = {
  "Amina Diallo": [
    [92, 90, 88, 86],
    [88, 94, 90, 84],
  ],
  "Luc Mensah": [
    [78, 80, 84, 76],
    [74, 82, 79, 80],
  ],
  "Chloé N'Guessan": [
    [70, 76, 72, 81],
    [68, 74, 77, 73],
  ],
  "Yanis Traoré": [
    [64, 60, 70, 66],
    [61, 67, 63, 69],
  ],
};

const lines = [];
people.forEach(([name, song], index) => {
  lines.push(
    `INSERT INTO candidates (name, song, sort_order) VALUES ('${name.replaceAll("'", "''")}', '${song}', ${index + 1});`,
  );
});
lines.push(`INSERT INTO jurors (name, code) VALUES ('Nadia K.', 'JURY01');`);
lines.push(`INSERT INTO jurors (name, code) VALUES ('Marc E.', 'JURY02');`);
people.forEach(([name, , votes]) => {
  const safe = name.replaceAll("'", "''");
  for (let n = 1; n <= votes; n += 1) {
    lines.push(
      `INSERT INTO public_votes (voter_token, candidate_id) SELECT 'seed-${indexKey(name)}-${n}', id FROM candidates WHERE name = '${safe}';`,
    );
  }
});
for (const [name, rows] of Object.entries(sheets)) {
  const safe = name.replaceAll("'", "''");
  rows.forEach((scores, jurorIndex) => {
    const code = jurorIndex === 0 ? "JURY01" : "JURY02";
    lines.push(
      `INSERT INTO jury_scores (juror_id, candidate_id, technique, interpretation, presence, originality) SELECT j.id, c.id, ${scores.join(", ")} FROM jurors j, candidates c WHERE j.code = '${code}' AND c.name = '${safe}';`,
    );
  });
}

function indexKey(name) {
  return name.slice(0, 3).toLowerCase().replaceAll("'", "");
}

const sql = lines.join("\n");

writeFileSync("scripts/seed.sql", sql.trim() + "\n");
execFileSync("npx", ["wrangler", "d1", "execute", "bob-votes", "--local", "--file", "scripts/seed.sql"], {
  stdio: "inherit",
});
console.log("Seed inséré. Codes jury : JURY01, JURY02.");
