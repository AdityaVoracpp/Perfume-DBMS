const pool = require('./db');

const comments = [
    "Absolutely love this scent, very long lasting!",
    "It's okay, a bit too strong for my taste.",
    "Perfect for evening wear.",
    "A classic! Can't go wrong with this one.",
    "Very unique and fresh.",
    "Not my favorite, it fades too quickly.",
    "I get so many compliments when I wear this.",
    "Signature scent material right here.",
    "A bit overpriced but smells amazing.",
    "Good for everyday use, very inoffensive."
];

async function populateReviews() {
    try {
        // Create 10 dummy users
        for (let i = 1; i <= 10; i++) {
            const username = `reviewer${i}`;
            const email = `reviewer${i}@example.com`;
            // Check if exists first to avoid duplicate email errors if not unique index
            const [exist] = await pool.execute('SELECT * FROM Users WHERE email = ?', [email]);
            if (exist.length === 0) {
                await pool.execute('INSERT INTO Users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, 'dummyhash']);
            }
        }
        
        const [userRows] = await pool.execute('SELECT user_id FROM Users WHERE email LIKE "reviewer%@example.com"');
        const userIds = userRows.map(u => u.user_id);

        if (userIds.length === 0) {
            throw new Error("No users found to post reviews.");
        }

        // Get all perfumes
        const [perfumes] = await pool.execute('SELECT p.perfume_id FROM Perfume p LEFT JOIN Review r ON p.perfume_id = r.perfume_id GROUP BY p.perfume_id HAVING COUNT(r.review_id) = 0');
        
        let reviewsAdded = 0;
        for (const perfume of perfumes) {
            // Add a random number of reviews between 5 and 15
            const numReviews = Math.floor(Math.random() * 11) + 5;
            for (let i = 0; i < numReviews; i++) {
                const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
                const randomRating = Math.floor(Math.random() * 3) + 3; // 3 to 5 stars
                const randomComment = comments[Math.floor(Math.random() * comments.length)];
                
                // Random date within the last year
                const randomDate = new Date(Date.now() - Math.floor(Math.random() * 31536000000));
                
                await pool.execute('INSERT INTO Review (perfume_id, user_id, rating, comment, review_date) VALUES (?, ?, ?, ?, ?)', [perfume.perfume_id, randomUserId, randomRating, randomComment, randomDate]);
                reviewsAdded++;
            }
        }

        console.log(`Successfully added ${reviewsAdded} artificial reviews to ${perfumes.length} perfumes.`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

populateReviews();
