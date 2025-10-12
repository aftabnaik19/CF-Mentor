import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const packageJsonPath = resolve(process.cwd(), 'package.json');
const manifestPath = resolve(process.cwd(), 'src/manifest.json');
const readmePath = resolve(process.cwd(), 'README.md');

// Get version from package.json, which is the source of truth
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const { version } = packageJson;

if (!version) {
  console.error('Error: Version not found in package.json. Aborting.');
  process.exit(1);
}

console.log(`Found version ${version}. Syncing to other files...`);

// 1. Sync to manifest.json
try {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  manifest.version = version;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`✅ Successfully updated ${manifestPath}`);
} catch (error) {
  console.error(`❌ Error updating ${manifestPath}:`, error);
  process.exit(1);
}

// 2. Sync to README.md
try {
  let readme = readFileSync(readmePath, 'utf-8');
  // Regex to find and replace the version in the badge URL
  const readmeRegex = /(\!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-)(.*)(-blue\.svg\))/;
  if (!readmeRegex.test(readme)) {
    throw new Error('Could not find the version badge in README.md. Please ensure it follows the pattern: ![Version](https://img.shields.io/badge/version-X.X.X-blue.svg)');
  }
  readme = readme.replace(readmeRegex, `$1${version}$3`);
  writeFileSync(readmePath, readme);
  console.log(`✅ Successfully updated ${readmePath}`);
} catch (error) {
  console.error(`❌ Error updating ${readmePath}:`, error);
  process.exit(1);
}

console.log('\nVersion synchronization complete.');
