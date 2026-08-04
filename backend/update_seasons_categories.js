const db = require('./db');

async function populateCategoriesAndSeasons() {
  console.log('Populating missing categories and seasons...');

  // Setup basic categories and seasons in DB if missing
  const categories = ['Fresh', 'Sweet', 'Woody', 'Citrus', 'Smoky', 'Floral', 'Spicy'];
  const seasons = ['Summer', 'Winter', 'Fall', 'Spring'];

  const categoryMap = {};
  const seasonMap = {};

  for (const cat of categories) {
    const [res] = await db.query('INSERT IGNORE INTO Category (name) VALUES (?)', [cat]);
    const [rows] = await db.query('SELECT category_id FROM Category WHERE name = ?', [cat]);
    categoryMap[cat] = rows[0].category_id;
  }

  for (const s of seasons) {
    const [res] = await db.query('INSERT IGNORE INTO Season (name) VALUES (?)', [s]);
    const [rows] = await db.query('SELECT season_id FROM Season WHERE name = ?', [s]);
    seasonMap[s] = rows[0].season_id;
  }

  // Get all perfumes
  const [perfumes] = await db.query('SELECT perfume_id, description FROM Perfume');

  for (const p of perfumes) {
    const desc = (p.description || '').toLowerCase();
    
    // Determine categories based on Main Accords in description
    const catsToAdd = new Set();
    if (desc.includes('fresh') || desc.includes('aquatic') || desc.includes('green')) catsToAdd.add('Fresh');
    if (desc.includes('sweet') || desc.includes('vanilla') || desc.includes('gourmand')) catsToAdd.add('Sweet');
    if (desc.includes('woody') || desc.includes('oud')) catsToAdd.add('Woody');
    if (desc.includes('citrus') || desc.includes('lemon') || desc.includes('bergamot')) catsToAdd.add('Citrus');
    if (desc.includes('smoky') || desc.includes('leather') || desc.includes('tobacco')) catsToAdd.add('Smoky');
    if (desc.includes('floral') || desc.includes('rose') || desc.includes('white floral')) catsToAdd.add('Floral');
    if (desc.includes('spicy')) catsToAdd.add('Spicy');

    // Default category if none matched
    if (catsToAdd.size === 0) catsToAdd.add('Fresh'); 

    // Determine seasons based on categories
    const seasonsToAdd = new Set();
    if (catsToAdd.has('Fresh') || catsToAdd.has('Citrus')) {
      seasonsToAdd.add('Summer');
      seasonsToAdd.add('Spring');
    }
    if (catsToAdd.has('Sweet') || catsToAdd.has('Spicy') || catsToAdd.has('Smoky')) {
      seasonsToAdd.add('Winter');
      seasonsToAdd.add('Fall');
    }
    if (catsToAdd.has('Floral')) {
      seasonsToAdd.add('Spring');
    }
    if (catsToAdd.has('Woody')) {
      seasonsToAdd.add('Fall');
      seasonsToAdd.add('Winter');
    }

    // Default season if none matched
    if (seasonsToAdd.size === 0) seasonsToAdd.add('Spring');

    // Insert to DB
    for (const cat of catsToAdd) {
      await db.query('INSERT IGNORE INTO PerfumeCategory (perfume_id, category_id) VALUES (?, ?)', [p.perfume_id, categoryMap[cat]]);
    }
    for (const s of seasonsToAdd) {
      await db.query('INSERT IGNORE INTO PerfumeSeason (perfume_id, season_id) VALUES (?, ?)', [p.perfume_id, seasonMap[s]]);
    }
  }

  console.log('Categories and Seasons successfully populated for all perfumes!');
  process.exit(0);
}

populateCategoriesAndSeasons().catch(console.error);
