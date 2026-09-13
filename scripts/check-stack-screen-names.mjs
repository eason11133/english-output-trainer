import fs from 'node:fs';

const source = fs.readFileSync(new URL('../app/_layout.tsx', import.meta.url), 'utf8');
const names = [...source.matchAll(/<Stack\.Screen\s+name="([^"]+)"/g)].map((match) => match[1]);
const duplicates = names.filter((name, index) => names.indexOf(name) !== index);

if (duplicates.length) {
  console.error(`Duplicate Stack.Screen names: ${[...new Set(duplicates)].join(', ')}`);
  process.exit(1);
}
for (const required of ['placement/explanation', 'placement/diagnostic-v2', 'coach/index']) {
  const count = names.filter((name) => name === required).length;
  if (count !== 1) {
    console.error(`Expected exactly one Stack.Screen named ${required}; found ${count}.`);
    process.exit(1);
  }
}
console.log(`Stack.Screen names are unique (${names.length} registrations).`);
