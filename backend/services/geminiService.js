const { GoogleGenAI, Type } = require('@google/genai');
const db = require('../db');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const intentSchema = {
    type: Type.OBJECT,
    properties: {
        include_notes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Notes the user wants in the perfume (e.g. vanilla, woody, citrus, aquatic)."
        },
        exclude_notes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Notes the user specifically dislikes or wants to avoid."
        },
        season: {
            type: Type.STRING,
            description: "A specific season if requested (e.g. Summer, Winter, Fall, Spring)."
        },
        gender: {
            type: Type.STRING,
            description: "Gender preference if requested (e.g. Male, Female, Unisex)."
        }
    }
};

const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite', // 500 RPD limit
  'gemini-3.1-flash-lite', // 500 RPD limit
  'gemini-3.6-flash',      // 20 RPD limit
  'gemini-3.5-flash',      // 20 RPD limit
  'gemini-3-flash',        // 20 RPD limit
  'gemini-2.5-flash'       // 20 RPD limit
];

async function generateSearchIntent(query) {
    let lastError = null;
    
    for (const model of FALLBACK_MODELS) {
        try {
            const response = await ai.models.generateContent({
                model: model,
                contents: `Extract the perfume search intent from the following user request. Do not make up notes, just extract what the user is asking for: "${query}"`,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: intentSchema,
                }
            });
            
            return JSON.parse(response.text);
        } catch (error) {
            console.error(`Model ${model} failed:`, error.message);
            lastError = error;
            // Continue to the next fallback model
        }
    }
    
    console.error("All fallback models failed. Last error:", lastError);
    throw new Error("Failed to process request with AI after trying all fallback models.");
}

async function executeDynamicQuery(intent) {
    let query = `
        SELECT DISTINCT p.* 
        FROM Perfume p
        LEFT JOIN PerfumeNote pn ON p.perfume_id = pn.perfume_id
        LEFT JOIN Note n ON pn.note_id = n.note_id
        LEFT JOIN PerfumeSeason ps ON p.perfume_id = ps.perfume_id
        LEFT JOIN Season s ON ps.season_id = s.season_id
        WHERE 1=1
    `;
    const params = [];

    if (intent.gender) {
        // Simple heuristic to match enum values
        const normalizedGender = intent.gender.charAt(0).toUpperCase() + intent.gender.slice(1).toLowerCase();
        if (['Male', 'Female', 'Unisex'].includes(normalizedGender)) {
            query += ` AND p.gender = ?`;
            params.push(normalizedGender);
        }
    }

    if (intent.season) {
        query += ` AND LOWER(s.name) = LOWER(?)`;
        params.push(intent.season);
    }

    if (intent.include_notes && intent.include_notes.length > 0) {
        const noteConditions = intent.include_notes.map(() => `LOWER(n.note_name) LIKE ?`);
        query += ` AND (${noteConditions.join(' OR ')})`;
        intent.include_notes.forEach(note => params.push(`%${note.toLowerCase()}%`));
    }

    if (intent.exclude_notes && intent.exclude_notes.length > 0) {
        const excludeConditions = intent.exclude_notes.map(() => `LOWER(n2.note_name) LIKE ?`);
        query += ` AND p.perfume_id NOT IN (
            SELECT p2.perfume_id FROM Perfume p2
            JOIN PerfumeNote pn2 ON p2.perfume_id = pn2.perfume_id
            JOIN Note n2 ON pn2.note_id = n2.note_id
            WHERE (${excludeConditions.join(' OR ')})
        )`;
        intent.exclude_notes.forEach(note => params.push(`%${note.toLowerCase()}%`));
    }

    query += ` LIMIT 10`;

    try {
        const [rows] = await db.query(query, params);
        
        // Let's also fetch the notes for the matched perfumes so the frontend can display them properly
        for (let perfume of rows) {
            const [notes] = await db.query(`
                SELECT n.note_name, n.note_type 
                FROM Note n
                JOIN PerfumeNote pn ON n.note_id = pn.note_id
                WHERE pn.perfume_id = ?
            `, [perfume.perfume_id]);
            perfume.notes = notes;
        }

        return rows;
    } catch (error) {
        console.error("Error executing dynamic SQL:", error);
        throw new Error("Database query failed.");
    }
}

module.exports = {
    generateSearchIntent,
    executeDynamicQuery
};
