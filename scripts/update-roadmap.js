const { execSync } = require("child_process");
const fs = require("fs");

const roadmapPath = "ROADMAP.md";
const STATUS_VALUES = ["Pendiente", "En curso", "Hecho"];

function runGit(command) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
  } catch (error) {
    console.error(`Error ejecutando "${command}":`, error.message);
    process.exit(1);
  }
}

if (!fs.existsSync(roadmapPath)) {
  console.error(`No se encontró ${roadmapPath}.`);
  process.exit(1);
}

const branch = runGit("git rev-parse --abbrev-ref HEAD");

if (!branch.startsWith("feature/")) {
  console.log("No estás en una rama feature/*, ROADMAP.md no se actualizará.");
  process.exit(0);
}

const rawCommits = runGit("git log --oneline -5");
const commits = rawCommits ? rawCommits.split("\n") : [];

let newState = "Pendiente";
if (commits.some((c) => /\b(feat|fix|docs)\b/i.test(c))) {
  newState = "En curso";
}
if (commits.some((c) => /\b(merge|done|close(d)?)\b/i.test(c))) {
  newState = "Hecho";
}

const branchToken = `\`${branch}\``;
const roadmapLines = fs.readFileSync(roadmapPath, "utf-8").split(/\r?\n/);

let wasUpdated = false;
const statusRegex = new RegExp(`(\\|\\s*)(?:${STATUS_VALUES.join("|")})(\\s*\\|)`, "i");

const updatedLines = roadmapLines.map((line) => {
  if (!line.includes(branchToken)) {
    return line;
  }

  const newLine = line.replace(statusRegex, (match, prefix, suffix) => {
    if (match.toLowerCase().includes(newState.toLowerCase())) {
      return match;
    }
    wasUpdated = true;
    return `${prefix}${newState}${suffix}`;
  });

  return newLine;
});

if (!wasUpdated) {
  console.log(`No se encontró la rama ${branch} o ya estaba en el estado "${newState}".`);
  process.exit(0);
}

fs.writeFileSync(roadmapPath, updatedLines.join("\n"), "utf-8");
console.log(`ROADMAP.md actualizado: ${branch} → ${newState}`);
