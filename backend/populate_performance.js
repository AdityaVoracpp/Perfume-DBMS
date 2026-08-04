const db = require('./db');

async function populatePerformance() {
  console.log('Populating performance data (Longevity & Sillage)...');

  const [perfumes] = await db.query('SELECT perfume_id, description FROM Perfume');

  for (const p of perfumes) {
    const desc = (p.description || '').toLowerCase();
    
    let longevity = 'Moderate';
    let sillage = 'Moderate';
    
    // Educated guesses based on Concentration found in description
    if (desc.includes('extrait de parfum') || desc.includes('parfum') && !desc.includes('eau de parfum')) {
      longevity = Math.random() > 0.5 ? 'Beast' : 'Long Lasting';
      sillage = Math.random() > 0.5 ? 'Enormous' : 'Heavy';
    } else if (desc.includes('eau de parfum') || desc.includes('edp')) {
      longevity = 'Long Lasting';
      sillage = Math.random() > 0.5 ? 'Heavy' : 'Moderate';
    } else if (desc.includes('eau de toilette') || desc.includes('edt')) {
      longevity = 'Moderate';
      sillage = 'Moderate';
    } else if (desc.includes('eau de cologne') || desc.includes('fraiche')) {
      longevity = 'Poor';
      sillage = 'Soft';
    } else {
      // Complete random fallback if concentration is missing/unknown
      const longOptions = ['Poor', 'Moderate', 'Long Lasting', 'Beast'];
      const silOptions = ['Soft', 'Moderate', 'Heavy', 'Enormous'];
      longevity = longOptions[Math.floor(Math.random() * longOptions.length)];
      sillage = silOptions[Math.floor(Math.random() * silOptions.length)];
    }

    try {
      await db.query(`
        INSERT IGNORE INTO Performance (perfume_id, longevity, sillage)
        VALUES (?, ?, ?)
      `, [p.perfume_id, longevity, sillage]);
    } catch (err) {
      console.error('Error inserting for perfume_id:', p.perfume_id, err.message);
    }
  }

  console.log('Performance data successfully populated!');
  process.exit(0);
}

populatePerformance().catch(console.error);
