import fs from 'fs';

const path = 'src/pages/users.tsx';
if (!fs.existsSync(path)) {
  console.log(`${path} does not exist`);
  process.exit(1);
}

const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');
console.log(`File lines count: ${lines.length}`);

lines.forEach((line, index) => {
  if (line.toLowerCase().includes('clearance') || line.toLowerCase().includes('attendance') || line.toLowerCase().includes('permission') || line.toLowerCase().includes('module')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
