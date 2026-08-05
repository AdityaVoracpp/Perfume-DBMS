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
        category: {
            type: Type.STRING,
            description: "The broad fragrance category. MUST be one of: 'Fresh', 'Sweet', 'Woody', 'Citrus', 'Smoky', 'Floral', 'Spicy', or '' if not specified."
        },
        season: {
            type: Type.STRING,
            description: "A specific season if requested (e.g. Summer, Winter, Fall, Spring)."
        },
        gender: {
            type: Type.STRING,
            description: "Gender preference if requested (e.g. Male, Female, Unisex)."
        },
        rationale: {
            type: Type.STRING,
            description: "A friendly 1-2 sentence explanation of WHY you chose these specific notes and gender based on the user's vibe/request. Act as a perfume expert."
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

async function generateSearchIntent(query, userGender = null) {
    let lastError = null;
    const userContext = userGender ? `User Profile Gender: ${userGender}\n` : '';
    
    for (const model of FALLBACK_MODELS) {
        try {
            const response = await ai.models.generateContent({
                model: model,
                contents: `Act as an expert perfumer. Extract the search intent from the user request.
${userContext}
RULES FOR GENDER & TARGET WEARER:
1. EXPLICIT RECIPIENT / GENDER IN PROMPT OVERRIDES EVERYTHING:
   - If the prompt is explicitly for a female recipient or feminine scent (e.g., 'for my girlfriend', 'for my wife', 'feminine scent', 'perfume for women', 'for her'), set 'gender' to 'Female'.
   - If the prompt is explicitly for a male recipient or masculine scent (e.g., 'for my boyfriend', 'for my husband', 'masculine scent', 'perfume for men', 'for him'), set 'gender' to 'Male'.
2. WEARER vs TARGET AUDIENCE:
   - If a male user asks for something to 'attract women' or 'drives girls crazy' for HIMSELF to wear, the wearer is Male, so set 'gender' to 'Male'.
3. DEFAULT TO USER PROFILE GENDER:
   - If no recipient or specific gender/vibe is mentioned in the prompt, default the 'gender' field to the User Profile Gender (if Male or Female).
   - If profile gender is 'Other' or not specified and prompt is ungendered, set 'gender' to '' (empty string).

If the user asks for a specific vibe, occasion, or feeling (like 'drives girls crazy', 'date night', 'office', 'seductive', 'fresh', 'bakery'), you MUST use your expertise to reason and infer the appropriate perfume notes and add them to the 'include_notes' array.
CRITICAL: If the user asks for a specific vibe (e.g. bakery/gourmand), identify contrasting notes that ruin that vibe (e.g. citrus, lavender, aquatic) and forcefully add them to the 'exclude_notes' array. Do this thoughtfully so you don't exclude complementary notes.
Provide a conversational 'rationale' explaining why you chose these parameters.
Query: "${query}"`,
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
        SELECT p.* 
        FROM Perfume p
        LEFT JOIN PerfumeNote pn ON p.perfume_id = pn.perfume_id
        LEFT JOIN Note n ON pn.note_id = n.note_id
        LEFT JOIN PerfumeSeason ps ON p.perfume_id = ps.perfume_id
        LEFT JOIN Season s ON ps.season_id = s.season_id
        LEFT JOIN PerfumeCategory pc ON p.perfume_id = pc.perfume_id
        LEFT JOIN Category c ON pc.category_id = c.category_id
        WHERE 1=1
    `;
    const params = [];

    if (intent.gender) {
        const normalizedGender = intent.gender.charAt(0).toUpperCase() + intent.gender.slice(1).toLowerCase();
        if (['Male', 'Female'].includes(normalizedGender)) {
            query += ` AND (p.gender = ? OR p.gender = 'Unisex')`;
            params.push(normalizedGender);
        } else if (normalizedGender === 'Unisex') {
            query += ` AND p.gender = 'Unisex'`;
        }
        // 'Other' or any other value -> recommend all perfumes
    }

    if (intent.season) {
        query += ` AND LOWER(s.name) = LOWER(?)`;
        params.push(intent.season);
    }
    
    if (intent.category && intent.category !== '') {
        query += ` AND LOWER(c.name) = LOWER(?)`;
        params.push(intent.category);
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

    query += ` GROUP BY p.perfume_id ORDER BY COUNT(DISTINCT n.note_id) DESC LIMIT 5`;

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
