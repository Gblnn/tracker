import fs from 'fs';

const content = fs.readFileSync('src/pages/ProjectsMaster.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('openEmpSelect') || line.includes('empSearch')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
