const axios = require('axios');
const csv = require('csv-parser');
const db = require('./db');

const CSV_URL = 'https://raw.githubusercontent.com/rfordatascience/tidytuesday/main/data/2024/2024-12-10/parfumo_data_clean.csv';

async function clearDatabase() {
  console.log('Clearing old data...');
  // Since we have ON DELETE CASCADE and foreign keys, we need to clear in correct order
  // Or temporarily disable foreign key checks
  await db.query('SET FOREIGN_KEY_CHECKS = 0');
  await db.query('TRUNCATE TABLE Review');
  await db.query('TRUNCATE TABLE Performance');
  await db.query('TRUNCATE TABLE PerfumeSeason');
  await db.query('TRUNCATE TABLE PerfumeCategory');
  await db.query('TRUNCATE TABLE PerfumeNote');
  await db.query('TRUNCATE TABLE Note');
  await db.query('TRUNCATE TABLE Perfume');
  await db.query('TRUNCATE TABLE Brand');
  await db.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('Old data cleared.');
}

function generateRandomPrice(brand) {
  const prestigeBrands = ['Creed', 'Tom Ford', 'Roja Parfums', 'Amouage', 'Clive Christian', 'Xerjoff', 'Nishane'];
  const highEndBrands = ['Dior', 'Chanel', 'Yves Saint Laurent', 'Guerlain', 'Hermès'];
  
  let min = 50, max = 150;
  if (prestigeBrands.some(b => brand.includes(b))) {
    min = 250; max = 500;
  } else if (highEndBrands.some(b => brand.includes(b))) {
    min = 120; max = 200;
  }
  
  return (Math.random() * (max - min) + min).toFixed(2);
}

function determineGender(mainAccords) {
    if (!mainAccords) return 'Unisex';
    const acc = mainAccords.toLowerCase();
    if (acc.includes('masculine') || (acc.includes('woody') && acc.includes('spicy') && !acc.includes('floral'))) return 'Male';
    if (acc.includes('feminine') || (acc.includes('sweet') && acc.includes('fruity') && acc.includes('floral'))) return 'Female';
    return 'Unisex';
}

async function runImport() {
  await clearDatabase();
  
  const results = [];
  console.log('Downloading and parsing CSV dataset...');
  
  try {
    const response = await axios({
      method: 'get',
      url: CSV_URL,
      responseType: 'stream'
    });

    response.data
      .pipe(csv())
      .on('data', (data) => {
          // data format: Name,Brand,Release_Year,Rating_Value,Rating_Count,Main_Accords,Top_Notes,Middle_Notes,Base_Notes
          if (data.Rating_Count && parseInt(data.Rating_Count) > 0) {
              results.push(data);
          }
      })
      .on('end', async () => {
        console.log(`Parsed ${results.length} perfumes with ratings.`);
        
        // Sort by Rating_Count descending
        results.sort((a, b) => parseInt(b.Rating_Count || 0) - parseInt(a.Rating_Count || 0));
        
        // Select 600 top popular
        const selected = results.slice(0, 600);
        const selectedNames = new Set(selected.map(p => p.Name + p.Brand));
        
        // Target specific notes for diversity (musk, leather, oud, aquatic, green)
        const targetNotes = ['Musk', 'Leather', 'Oud', 'Aquatic', 'Green', 'Vanilla', 'Rose', 'Vetiver', 'Patchouli', 'Citrus'];
        
        let remainingIndex = 600;
        let noteIndex = 0;
        
        while (selected.length < 1000 && remainingIndex < results.length) {
            const perfume = results[remainingIndex];
            const allNotes = [perfume.Top_Notes, perfume.Middle_Notes, perfume.Base_Notes, perfume.Main_Accords].join(' ').toLowerCase();
            
            const currentTarget = targetNotes[noteIndex % targetNotes.length];
            
            if (!selectedNames.has(perfume.Name + perfume.Brand) && allNotes.includes(currentTarget.toLowerCase())) {
                selected.push(perfume);
                selectedNames.add(perfume.Name + perfume.Brand);
                noteIndex++; // move to next target note to distribute evenly
            }
            remainingIndex++;
        }
        
        // If we didn't hit 1000 due to strict note requirements, fill with the next most popular
        remainingIndex = 600;
        while (selected.length < 1000 && remainingIndex < results.length) {
            const perfume = results[remainingIndex];
            if (!selectedNames.has(perfume.Name + perfume.Brand)) {
                selected.push(perfume);
                selectedNames.add(perfume.Name + perfume.Brand);
            }
            remainingIndex++;
        }

        console.log(`Selected ${selected.length} perfumes for import. Inserting to DB...`);
        
        const brandMap = new Map();
        const noteMap = new Map();
        
        for (let i = 0; i < selected.length; i++) {
            const p = selected[i];
            
            // Handle Brand
            let brandId = brandMap.get(p.Brand);
            if (!brandId) {
                const [brandRes] = await db.query('INSERT INTO Brand (brand_name) VALUES (?)', [p.Brand || 'Unknown Brand']);
                brandId = brandRes.insertId;
                brandMap.set(p.Brand, brandId);
            }
            
            // Handle Perfume
            const releaseYear = isNaN(parseInt(p.Release_Year)) ? null : parseInt(p.Release_Year);
            const price = generateRandomPrice(p.Brand || '');
            const gender = determineGender(p.Main_Accords);
            const desc = `Concentration: ${p.Concentration || 'N/A'}\nMain Accords: ${p.Main_Accords || 'N/A'}\nPerfumers: ${p.Perfumers || 'Unknown'}`;
            
            const [perfumeRes] = await db.query(`
                INSERT INTO Perfume (name, brand_id, gender, release_year, price, description)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [p.Name || 'Unknown Perfume', brandId, gender, releaseYear, price, desc]);
            
            const perfumeId = perfumeRes.insertId;
            
            // Handle Notes helper
            const insertNotes = async (noteStr, type) => {
                if (!noteStr || noteStr === 'NA' || noteStr === 'N/A') return;
                const noteNames = noteStr.split(',').map(n => n.trim()).filter(n => n);
                for (const noteName of noteNames) {
                    let noteId = noteMap.get(noteName.toLowerCase() + '_' + type);
                    if (!noteId) {
                        const [noteRes] = await db.query('INSERT INTO Note (note_name, note_type) VALUES (?, ?)', [noteName, type]);
                        noteId = noteRes.insertId;
                        noteMap.set(noteName.toLowerCase() + '_' + type, noteId);
                    }
                    try {
                        await db.query('INSERT INTO PerfumeNote (perfume_id, note_id) VALUES (?, ?)', [perfumeId, noteId]);
                    } catch(e) {
                        // ignore duplicate entry errors
                    }
                }
            };
            
            await insertNotes(p.Top_Notes, 'Top');
            await insertNotes(p.Middle_Notes, 'Middle');
            await insertNotes(p.Base_Notes, 'Base');
            
            if (i % 100 === 0) console.log(`Inserted ${i} perfumes...`);
        }
        
        console.log('Successfully imported all data!');
        
        // Start scraping script in background
        console.log('Starting image scraping automatically in the background...');
        const { spawn } = require('child_process');
        const scraper = spawn('node', ['scrape_images.js'], { detached: true, stdio: 'ignore' });
        scraper.unref();
        
        process.exit(0);
      });
  } catch (error) {
    console.error('Error during import:', error);
    process.exit(1);
  }
}

runImport();
