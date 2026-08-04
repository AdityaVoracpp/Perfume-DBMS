const axios = require('axios');
const cheerio = require('cheerio');
const db = require('./db');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchImageForPerfume(brandName, perfumeName) {
  try {
    const query = encodeURIComponent(`${brandName} ${perfumeName} perfume bottle white background`);
    const url = `https://www.bing.com/images/search?q=${query}&form=HDRSC3&first=1&tsc=ImageHoverTitle`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const firstIusc = $('a.iusc').first().attr('m');
    
    if (firstIusc) {
      const data = JSON.parse(firstIusc);
      return data.murl; // Direct URL to the image
    }
    
    // Fallback: try to find any image that looks like a search result
    const fallbackImg = $('.mimg').first().attr('src');
    if (fallbackImg && fallbackImg.startsWith('http')) {
        return fallbackImg;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching image for ${brandName} ${perfumeName}:`, error.message);
    return null;
  }
}

async function run() {
  console.log('Starting image scraping process...');
  
  try {
    // Get perfumes without an image_url
    const [perfumes] = await db.query(`
      SELECT p.perfume_id, p.name as perfume_name, b.brand_name 
      FROM Perfume p
      JOIN Brand b ON p.brand_id = b.brand_id
      WHERE p.image_url IS NULL OR p.image_url = '' OR p.image_url LIKE '%via.placeholder.com%'
    `);

    if (perfumes.length === 0) {
      console.log('All perfumes already have images!');
      process.exit(0);
    }

    console.log(`Found ${perfumes.length} perfumes missing images.`);

    for (let i = 0; i < perfumes.length; i++) {
      const perfume = perfumes[i];
      console.log(`[${i+1}/${perfumes.length}] Fetching image for: ${perfume.brand_name} ${perfume.perfume_name}`);
      
      const imageUrl = await fetchImageForPerfume(perfume.brand_name, perfume.perfume_name);
      
      if (imageUrl) {
        console.log(`  -> Found image: ${imageUrl.substring(0, 50)}...`);
        // Update database
        await db.query('UPDATE Perfume SET image_url = ? WHERE perfume_id = ?', [imageUrl, perfume.perfume_id]);
      } else {
        console.log(`  -> No image found.`);
      }
      
      // Be polite to Bing
      await delay(2000); 
    }
    
    console.log('Finished updating images!');
  } catch (err) {
    console.error('Database error:', err);
  } finally {
    process.exit(0);
  }
}

run();
