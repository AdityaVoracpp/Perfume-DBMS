const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('../config/db');

let genAI = null;
let model = null;

function getModel() {
  if (!model) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const err = new Error('GEMINI_API_KEY is not configured');
      err.status = 503;
      throw err;
    }
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }
  return model;
}

/**
 * Fetch a summary of all perfumes for the AI context.
 * This gives Gemini awareness of the entire catalog.
 */
async function getCatalogSummary() {
  const [rows] = await pool.execute(`
    SELECT p.perfume_id, p.name, p.gender, p.price, p.release_year,
           b.brand_name, bt.type_name AS brand_type,
           perf.longevity, perf.sillage,
           GROUP_CONCAT(DISTINCT n.note_name ORDER BY n.note_type SEPARATOR ', ') AS notes,
           GROUP_CONCAT(DISTINCT s.name SEPARATOR ', ') AS seasons,
           GROUP_CONCAT(DISTINCT o.name SEPARATOR ', ') AS occasions,
           GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') AS categories,
           ROUND(AVG(r.rating), 1) AS avg_rating
    FROM Perfume p
    LEFT JOIN Brand b ON p.brand_id = b.brand_id
    LEFT JOIN BrandType bt ON b.brand_type_id = bt.brand_type_id
    LEFT JOIN Performance perf ON p.perfume_id = perf.perfume_id
    LEFT JOIN PerfumeNote pn ON p.perfume_id = pn.perfume_id
    LEFT JOIN Note n ON pn.note_id = n.note_id
    LEFT JOIN PerfumeSeason ps ON p.perfume_id = ps.perfume_id
    LEFT JOIN Season s ON ps.season_id = s.season_id
    LEFT JOIN PerfumeOccasion po ON p.perfume_id = po.perfume_id
    LEFT JOIN Occasion o ON po.occasion_id = o.occasion_id
    LEFT JOIN PerfumeCategory pc ON p.perfume_id = pc.perfume_id
    LEFT JOIN Category c ON pc.category_id = c.category_id
    LEFT JOIN Review r ON p.perfume_id = r.perfume_id
    GROUP BY p.perfume_id
    ORDER BY p.name
  `);
  return rows;
}

/**
 * AI Recommendation — natural language perfume finder.
 * User describes what they want; Gemini picks from the real catalog.
 */
async function recommend(userQuery) {
  const ai = getModel();
  const catalog = await getCatalogSummary();

  const catalogText = catalog.map(p =>
    `[ID:${p.perfume_id}] ${p.brand_name} - ${p.name} | ${p.gender} | $${p.price} | ${p.brand_type} | ` +
    `Notes: ${p.notes || 'N/A'} | Seasons: ${p.seasons || 'N/A'} | Occasions: ${p.occasions || 'N/A'} | ` +
    `Categories: ${p.categories || 'N/A'} | Longevity: ${p.longevity || 'N/A'} | Sillage: ${p.sillage || 'N/A'} | ` +
    `Rating: ${p.avg_rating || 'N/A'}/5`
  ).join('\n');

  const prompt = `You are an expert perfume consultant. A user is looking for a fragrance recommendation.

Here is the complete perfume catalog you can recommend from:
${catalogText}

USER REQUEST: "${userQuery}"

Based on the user's request, recommend 3-5 perfumes from the catalog above. For each recommendation:
1. State the perfume name and brand
2. Explain WHY it matches the user's request (reference specific notes, performance, seasons, etc.)
3. Mention the price

Format your response as a JSON array with this structure:
[
  {
    "perfume_id": <number>,
    "name": "<brand> - <perfume name>",
    "reason": "<1-2 sentence explanation>",
    "price": <number>
  }
]

IMPORTANT: Only recommend perfumes that exist in the catalog above. Return ONLY the JSON array, no other text.`;

  const result = await ai.generateContent(prompt);
  const text = result.response.text().trim();

  // Extract JSON from the response (handle markdown code blocks)
  let jsonStr = text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  try {
    const recommendations = JSON.parse(jsonStr);
    return { recommendations, raw_response: text };
  } catch {
    return { recommendations: [], raw_response: text, error: 'Failed to parse AI response' };
  }
}

/**
 * AI Chat — freeform conversation about perfumes.
 * Gemini acts as a perfume expert with catalog knowledge.
 */
async function chat(message, history = []) {
  const ai = getModel();
  const catalog = await getCatalogSummary();

  const catalogText = catalog.map(p =>
    `${p.brand_name} - ${p.name} ($${p.price}, ${p.gender}) [Notes: ${p.notes || 'N/A'}] [${p.longevity || '?'} longevity, ${p.sillage || '?'} sillage] [Seasons: ${p.seasons || 'N/A'}] [Categories: ${p.categories || 'N/A'}] [Rating: ${p.avg_rating || 'N/A'}/5]`
  ).join('\n');

  const systemPrompt = `You are "ScentAI", an expert perfume consultant and sommelier. You have deep knowledge about fragrances, notes, accords, and perfumery.

You have access to this perfume catalog database:
${catalogText}

Rules:
- Be warm, knowledgeable, and enthusiastic about fragrances
- When recommending, always reference specific perfumes from the catalog
- Explain fragrance notes, performance, and suitability in an engaging way
- If asked about a perfume not in the catalog, say so honestly
- Keep responses concise but informative (2-3 paragraphs max)
- Use fragrance terminology naturally (sillage, dry-down, projection, etc.)`;

  const chatHistory = history.map(h => ({
    role: h.role,
    parts: [{ text: h.content }]
  }));

  const chat = ai.startChat({
    history: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I\'m ScentAI, your personal fragrance consultant! I have access to a curated catalog of perfumes and I\'m here to help you find your perfect scent. What are you looking for today?' }] },
      ...chatHistory
    ]
  });

  const result = await chat.sendMessage(message);
  return { response: result.response.text() };
}

/**
 * AI Description — generate a poetic description for a perfume.
 */
async function generateDescription(perfumeId) {
  const ai = getModel();

  const [rows] = await pool.execute(`
    SELECT p.name, p.gender, p.price, p.release_year,
           b.brand_name, bt.type_name AS brand_type,
           perf.longevity, perf.sillage,
           GROUP_CONCAT(DISTINCT CONCAT(n.note_type, ': ', n.note_name) SEPARATOR ', ') AS notes,
           GROUP_CONCAT(DISTINCT s.name SEPARATOR ', ') AS seasons,
           GROUP_CONCAT(DISTINCT o.name SEPARATOR ', ') AS occasions,
           GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') AS categories
    FROM Perfume p
    LEFT JOIN Brand b ON p.brand_id = b.brand_id
    LEFT JOIN BrandType bt ON b.brand_type_id = bt.brand_type_id
    LEFT JOIN Performance perf ON p.perfume_id = perf.perfume_id
    LEFT JOIN PerfumeNote pn ON p.perfume_id = pn.perfume_id
    LEFT JOIN Note n ON pn.note_id = n.note_id
    LEFT JOIN PerfumeSeason ps ON p.perfume_id = ps.perfume_id
    LEFT JOIN Season s ON ps.season_id = s.season_id
    LEFT JOIN PerfumeOccasion po ON p.perfume_id = po.perfume_id
    LEFT JOIN Occasion o ON po.occasion_id = o.occasion_id
    LEFT JOIN PerfumeCategory pc ON p.perfume_id = pc.perfume_id
    LEFT JOIN Category c ON pc.category_id = c.category_id
    WHERE p.perfume_id = ?
    GROUP BY p.perfume_id
  `, [perfumeId]);

  if (rows.length === 0) {
    const err = new Error('Perfume not found');
    err.status = 404;
    throw err;
  }

  const p = rows[0];
  const prompt = `Write a compelling, poetic 2-3 sentence description for this perfume. It should sound like premium marketing copy from a luxury fragrance house.

Perfume: ${p.brand_name} - ${p.name}
Gender: ${p.gender}
Release Year: ${p.release_year}
Notes: ${p.notes}
Longevity: ${p.longevity}
Sillage: ${p.sillage}
Best For: ${p.seasons} | ${p.occasions}
Category: ${p.categories}

Return ONLY the description text, nothing else.`;

  const result = await ai.generateContent(prompt);
  return { description: result.response.text().trim() };
}

module.exports = { recommend, chat, generateDescription };
