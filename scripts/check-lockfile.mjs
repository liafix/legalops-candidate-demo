import { existsSync, readFileSync } from "node:fs";

const lockPath = new URL("../package-lock.json", import.meta.url);
const packagePath = new URL("../package.json", import.meta.url);

if (!existsSync(lockPath)) {
  console.error(
    "RELEASE BLOCKED: package-lock.json is missing. Run `npm run release:lock` in a networked environment and commit the generated lockfile.",
  );
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
const lock = JSON.parse(readFileSync(lockPath, "utf8"));
const root = lock?.packages?.[""];

if (!root || Number(lock.lockfileVersion) < 3) {
  console.error(
    "RELEASE BLOCKED: package-lock.json is not an npm lockfile v3 with a root package entry.",
  );
  process.exit(1);
}

for (const section of ["dependencies", "devDependencies"]) {
  const expected = pkg[section] ?? {};
  const actual = root[section] ?? {};
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(actual).sort();

  if (JSON.stringify(expectedKeys) !== JSON.stringify(actualKeys)) {
    console.error(`RELEASE BLOCKED: package-lock root ${section} keys do not match package.json.`);
    process.exit(1);
  }

  for (const [name, spec] of Object.entries(expected)) {
    if (actual[name] !== spec) {
      console.error(
        `RELEASE BLOCKED: ${section}.${name} differs between package.json (${spec}) and package-lock.json (${actual[name]}).`,
      );
      process.exit(1);
    }
  }
}

console.log("Lockfile consistency check PASS.");
