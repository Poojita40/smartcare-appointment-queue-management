import fs from 'fs';
const data = JSON.parse(fs.readFileSync('db.json', 'utf8'));
data.doctors.forEach(doc => {
  if (doc.availability.includes("-")) {
    const parts = doc.availability.split("-");
    const start = parts[0].trim();
    doc.availability = `${start} - 10:00 PM`;
  }
});
fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
console.log('Fixed db.json');
