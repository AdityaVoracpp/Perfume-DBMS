const fs = require('fs');

const brandTypes = ['Designer', 'Niche', 'Middle Eastern', 'Indie'];
const brands = [
  { name: 'Dior', country: 'France', type: 1 },
  { name: 'Amouage', country: 'Oman', type: 2 },
  { name: 'Lattafa', country: 'UAE', type: 3 },
  { name: 'Creed', country: 'France', type: 2 },
  { name: 'Tom Ford', country: 'USA', type: 1 },
  { name: 'Chanel', country: 'France', type: 1 },
  { name: 'Roja Parfums', country: 'UK', type: 2 },
  { name: 'Nishane', country: 'Turkey', type: 2 },
  { name: 'Versace', country: 'Italy', type: 1 },
  { name: 'Xerjoff', country: 'Italy', type: 2 }
];

const notes = [
  { name: 'Bergamot', type: 'Top' }, { name: 'Lemon', type: 'Top' }, { name: 'Apple', type: 'Top' },
  { name: 'Lavender', type: 'Middle' }, { name: 'Rose', type: 'Middle' }, { name: 'Jasmine', type: 'Middle' }, { name: 'Incense', type: 'Middle' },
  { name: 'Vanilla', type: 'Base' }, { name: 'Amber', type: 'Base' }, { name: 'Oud', type: 'Base' }, { name: 'Sandalwood', type: 'Base' }, { name: 'Musk', type: 'Base' }
];

const seasons = ['Summer', 'Winter', 'Fall', 'Spring'];
const occasions = ['Office', 'Party', 'Casual', 'Date Night', 'Formal'];
const categories = ['Fresh', 'Smoky', 'Sweet', 'Woody', 'Floral', 'Citrus', 'Spicy'];

const adjectives = ['Intense', 'Aqua', 'Noir', 'Oud', 'Absolu', 'Sport', 'Extreme', 'Elixir', 'Parfum', 'Cologne'];
const baseNames = ['Wood', 'Rose', 'Spice', 'Blue', 'Gold', 'Night', 'Day', 'Sea', 'Wind', 'Fire', 'Soul', 'Dreams'];

const genders = ['Male', 'Female', 'Unisex'];
const longevities = ['Poor', 'Moderate', 'Long Lasting', 'Beast'];
const sillages = ['Soft', 'Moderate', 'Heavy', 'Enormous'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

let sql = `USE PerfumeRecommendation;\n\n`;

// 1. BrandType
sql += `INSERT INTO BrandType (type_name) VALUES \n` + brandTypes.map(b => `('${b}')`).join(',\n') + `;\n\n`;

// 2. Brand
sql += `INSERT INTO Brand (brand_name, origin_country, brand_type_id) VALUES \n` + brands.map(b => `('${b.name}', '${b.country}', ${b.type})`).join(',\n') + `;\n\n`;

// 3. Perfume (50)
let perfumes = [];
for (let i = 1; i <= 50; i++) {
  let name = `${rand(baseNames)} ${rand(adjectives)}`;
  let brandId = randInt(1, brands.length);
  let gender = rand(genders);
  let year = randInt(1990, 2023);
  let price = randInt(30, 450) + 0.99;
  let image = `https://via.placeholder.com/400?text=${name.replace(' ', '+')}`;
  let desc = `A wonderful ${gender.toLowerCase()} fragrance launched in ${year}.`;
  perfumes.push(`('${name}', ${brandId}, '${gender}', ${year}, ${price}, '${image}', '${desc}')`);
}
sql += `INSERT INTO Perfume (name, brand_id, gender, release_year, price, image_url, description) VALUES \n` + perfumes.join(',\n') + `;\n\n`;

// 4. Note
sql += `INSERT INTO Note (note_name, note_type) VALUES \n` + notes.map(n => `('${n.name}', '${n.type}')`).join(',\n') + `;\n\n`;

// 5. PerfumeNote (Randomly assign 2-4 notes per perfume)
let perfumeNotes = [];
for (let i = 1; i <= 50; i++) {
  let numNotes = randInt(2, 4);
  let selectedNotes = new Set();
  while(selectedNotes.size < numNotes) { selectedNotes.add(randInt(1, notes.length)); }
  selectedNotes.forEach(nId => perfumeNotes.push(`(${i}, ${nId})`));
}
sql += `INSERT INTO PerfumeNote (perfume_id, note_id) VALUES \n` + perfumeNotes.join(',\n') + `;\n\n`;

// 6. Performance
let performances = [];
for(let i = 1; i <= 50; i++) {
  performances.push(`(${i}, '${rand(longevities)}', '${rand(sillages)}')`);
}
sql += `INSERT INTO Performance (perfume_id, longevity, sillage) VALUES \n` + performances.join(',\n') + `;\n\n`;

// 7. Users
let users = [
  "('john_doe', 'john@example.com', 'hashedpassword1', 25, 'Male')",
  "('perfumeQueen', 'queen@example.com', 'hashedpassword2', 30, 'Female')",
  "('unisexFan', 'fan@example.com', 'hashedpassword3', 22, 'Other')",
  "('scent_lover', 'scent@example.com', 'hashedpassword4', 28, 'Male')",
  "('frag_head', 'frag@example.com', 'hashedpassword5', 35, 'Female')"
];
sql += `INSERT INTO Users (username, email, password_hash, age, gender) VALUES \n` + users.join(',\n') + `;\n\n`;

// 8. Review (Random 0-3 reviews per perfume)
let reviews = [];
for(let i = 1; i <= 50; i++) {
  let numReviews = randInt(0, 3);
  for(let j=0; j<numReviews; j++) {
    let uId = randInt(1, 5);
    let rating = randInt(2, 5);
    let comment = rating >= 4 ? 'Great perfume!' : 'It is okay, nothing special.';
    reviews.push(`(${i}, ${uId}, ${rating}, '${comment}', '2023-${randInt(1,12).toString().padStart(2,'0')}-${randInt(1,28).toString().padStart(2,'0')}')`);
  }
}
if (reviews.length > 0) {
  sql += `INSERT INTO Review (perfume_id, user_id, rating, comment, review_date) VALUES \n` + reviews.join(',\n') + `;\n\n`;
}

// 9. Season
sql += `INSERT INTO Season (name) VALUES \n` + seasons.map(s => `('${s}')`).join(',\n') + `;\n\n`;

// 10. Occasion
sql += `INSERT INTO Occasion (name) VALUES \n` + occasions.map(o => `('${o}')`).join(',\n') + `;\n\n`;

// 11. Category
sql += `INSERT INTO Category (name) VALUES \n` + categories.map(c => `('${c}')`).join(',\n') + `;\n\n`;

// 12. PerfumeSeason
let perfumeSeasons = [];
for (let i = 1; i <= 50; i++) {
  let num = randInt(1, 2);
  let selected = new Set();
  while(selected.size < num) { selected.add(randInt(1, seasons.length)); }
  selected.forEach(sId => perfumeSeasons.push(`(${i}, ${sId})`));
}
sql += `INSERT INTO PerfumeSeason (perfume_id, season_id) VALUES \n` + perfumeSeasons.join(',\n') + `;\n\n`;

// 13. PerfumeOccasion
let perfumeOccasions = [];
for (let i = 1; i <= 50; i++) {
  let num = randInt(1, 3);
  let selected = new Set();
  while(selected.size < num) { selected.add(randInt(1, occasions.length)); }
  selected.forEach(oId => perfumeOccasions.push(`(${i}, ${oId})`));
}
sql += `INSERT INTO PerfumeOccasion (perfume_id, occasion_id) VALUES \n` + perfumeOccasions.join(',\n') + `;\n\n`;

// 14. PerfumeCategory
let perfumeCategories = [];
for (let i = 1; i <= 50; i++) {
  let num = randInt(1, 2);
  let selected = new Set();
  while(selected.size < num) { selected.add(randInt(1, categories.length)); }
  selected.forEach(cId => perfumeCategories.push(`(${i}, ${cId})`));
}
sql += `INSERT INTO PerfumeCategory (perfume_id, category_id) VALUES \n` + perfumeCategories.join(',\n') + `;\n\n`;

fs.writeFileSync('init_db/02-seed.sql', sql);
console.log('Seed file init_db/02-seed.sql generated successfully.');
