/**
 * Seed script — populates the database with 100 real perfumes,
 * complete with brands, notes, performance, seasons, occasions,
 * categories, users, and reviews.
 *
 * Run: npm run seed
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'perfume_user',
  password: process.env.DB_PASSWORD || 'perfume_pass_2024',
  database: process.env.DB_NAME || 'PerfumeRecommendation',
  multipleStatements: true
};

// ═══════════════════════════════════════════════
// DATA DEFINITIONS
// ═══════════════════════════════════════════════

const BRAND_TYPES = ['Designer', 'Niche', 'Middle Eastern', 'Luxury', 'Indie'];

const BRANDS = [
  // [name, country, brandTypeIndex (1-based)]
  ['Dior', 'France', 1],
  ['Chanel', 'France', 1],
  ['Tom Ford', 'USA', 4],
  ['Versace', 'Italy', 1],
  ['Creed', 'UK', 2],
  ['Yves Saint Laurent', 'France', 1],
  ['Giorgio Armani', 'Italy', 1],
  ['Prada', 'Italy', 1],
  ['Maison Francis Kurkdjian', 'France', 2],
  ['Parfums de Marly', 'France', 2],
  ['Lattafa', 'UAE', 3],
  ['Al Haramain', 'UAE', 3],
  ['Dolce & Gabbana', 'Italy', 1],
  ['Jean Paul Gaultier', 'France', 1],
  ['Gucci', 'Italy', 1],
  ['Paco Rabanne', 'Spain', 1],
  ['Xerjoff', 'Italy', 2],
  ['Byredo', 'Sweden', 5],
  ['Azzaro', 'France', 1],
  ['Hugo Boss', 'Germany', 1],
];

const NOTES = [
  // [name, type]
  // Top notes (1-12)
  ['Bergamot', 'Top'], ['Lemon', 'Top'], ['Orange', 'Top'], ['Grapefruit', 'Top'],
  ['Pink Pepper', 'Top'], ['Saffron', 'Top'], ['Apple', 'Top'], ['Pineapple', 'Top'],
  ['Ginger', 'Top'], ['Cardamom', 'Top'], ['Mint', 'Top'], ['Elemi', 'Top'],
  // Middle notes (13-24)
  ['Rose', 'Middle'], ['Jasmine', 'Middle'], ['Iris', 'Middle'], ['Lavender', 'Middle'],
  ['Geranium', 'Middle'], ['Incense', 'Middle'], ['Nutmeg', 'Middle'], ['Cinnamon', 'Middle'],
  ['Oud', 'Middle'], ['Sage', 'Middle'], ['Violet', 'Middle'], ['Orris', 'Middle'],
  // Base notes (25-36)
  ['Vanilla', 'Base'], ['Amber', 'Base'], ['Musk', 'Base'], ['Sandalwood', 'Base'],
  ['Vetiver', 'Base'], ['Patchouli', 'Base'], ['Tonka Bean', 'Base'], ['Leather', 'Base'],
  ['Tobacco', 'Base'], ['Cedar', 'Base'], ['Oakmoss', 'Base'], ['Ambroxan', 'Base'],
];

const SEASONS = ['Summer', 'Winter', 'Fall', 'Spring'];
const OCCASIONS = ['Office', 'Party', 'Casual', 'Date Night', 'Formal', 'Sport', 'Evening'];
const CATEGORIES = ['Fresh', 'Smoky', 'Sweet', 'Woody', 'Floral', 'Oriental', 'Citrus', 'Aquatic', 'Spicy', 'Gourmand', 'Leather', 'Green'];

// Placeholder image
const IMG = 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop';

// 100 PERFUMES: [name, brandIdx(1-based), gender, year, price, noteIds[], longevity, sillage, seasonIds[], occasionIds[], categoryIds[]]
const PERFUMES = [
  // --- Dior (1) ---
  ['Sauvage EDP', 1, 'Male', 2018, 120, [1,5,16,36], 'Long Lasting', 'Heavy', [1,4], [1,3,4], [1,9]],
  ['Sauvage EDT', 1, 'Male', 2015, 95, [1,5,30], 'Long Lasting', 'Heavy', [1,4], [1,3], [1,7]],
  ['Dior Homme Intense', 1, 'Male', 2011, 130, [15,16,24,34], 'Long Lasting', 'Moderate', [3,4], [4,7], [5,4]],
  ['Miss Dior EDP', 1, 'Female', 2017, 120, [13,17,30], 'Moderate', 'Moderate', [4], [4,5], [5]],
  ["J'adore", 1, 'Female', 2000, 115, [14,13,23], 'Moderate', 'Moderate', [1,4], [5,4], [5]],
  ['Fahrenheit', 1, 'Male', 1988, 90, [16,32,29], 'Long Lasting', 'Heavy', [3,2], [3,7], [11,4]],
  ['Dior Homme', 1, 'Male', 2005, 100, [15,16,34], 'Moderate', 'Moderate', [4], [1,5], [5,4]],
  ['Poison Girl', 1, 'Female', 2016, 95, [3,25,31], 'Long Lasting', 'Heavy', [3,2], [4,2], [3,10]],

  // --- Chanel (2) ---
  ['Bleu de Chanel EDP', 2, 'Male', 2014, 135, [1,4,15,34], 'Long Lasting', 'Heavy', [1,3,4], [1,5,4], [4,1]],
  ['Allure Homme Sport', 2, 'Male', 2004, 100, [3,11,34], 'Moderate', 'Moderate', [1], [6,3], [1,8]],
  ['Chanel No. 5', 2, 'Female', 1921, 130, [14,13,25,27], 'Long Lasting', 'Heavy', [3,2,4], [5,7], [5,6]],
  ['Coco Mademoiselle', 2, 'Female', 2001, 125, [3,13,30,25], 'Long Lasting', 'Heavy', [4,1], [1,4], [5,7]],
  ['Bleu de Chanel Parfum', 2, 'Male', 2018, 150, [1,15,28,34], 'Beast', 'Heavy', [3,4], [5,4], [4]],
  ['Chance Eau Tendre', 2, 'Female', 2010, 105, [4,14,27], 'Moderate', 'Soft', [1,4], [1,3], [5,1]],
  ['Platinum Egoiste', 2, 'Male', 1993, 110, [16,13,28,34], 'Long Lasting', 'Moderate', [4], [1,5], [4,1]],

  // --- Tom Ford (3) ---
  ['Tobacco Vanille', 3, 'Unisex', 2007, 280, [33,25,20,10], 'Beast', 'Enormous', [2,3], [7,4], [3,9,10]],
  ['Oud Wood', 3, 'Unisex', 2007, 265, [21,28,34,29], 'Long Lasting', 'Moderate', [2,3], [5,7], [4,6]],
  ['Lost Cherry', 3, 'Unisex', 2018, 335, [7,25,31,26], 'Long Lasting', 'Heavy', [3,2], [4,7], [3,10]],
  ['Black Orchid', 3, 'Unisex', 2006, 155, [33,21,30,25], 'Beast', 'Heavy', [2,3], [7,4], [6,3]],
  ['Tuscan Leather', 3, 'Unisex', 2007, 280, [6,32,26], 'Beast', 'Enormous', [3,2], [7], [11,9]],
  ['Bitter Peach', 3, 'Unisex', 2020, 335, [7,14,25,30], 'Long Lasting', 'Heavy', [3], [4], [3,10]],
  ['Noir de Noir', 3, 'Unisex', 2007, 280, [13,6,21,30], 'Beast', 'Heavy', [2,3], [7,4], [6,5]],

  // --- Versace (4) ---
  ['Eros', 4, 'Male', 2012, 85, [11,7,25,31], 'Long Lasting', 'Heavy', [1,4], [2,4], [3,1]],
  ['Dylan Blue', 4, 'Male', 2016, 80, [1,4,23,36], 'Long Lasting', 'Heavy', [1,4], [1,3], [1,8]],
  ['Pour Homme', 4, 'Male', 2008, 70, [2,22,26,34], 'Moderate', 'Moderate', [1], [1,3], [1,7]],
  ['Crystal Noir', 4, 'Female', 2004, 75, [9,10,28,27], 'Moderate', 'Moderate', [3,2], [7,4], [6,9]],
  ['Bright Crystal', 4, 'Female', 2006, 70, [4,3,13,27], 'Moderate', 'Soft', [1,4], [3,1], [1,5]],
  ['Eros Flame', 4, 'Male', 2018, 85, [2,5,25,29], 'Long Lasting', 'Heavy', [3,2], [4,7], [9,4]],

  // --- Creed (5) ---
  ['Aventus', 5, 'Male', 2010, 445, [8,1,21,27], 'Long Lasting', 'Heavy', [1,4], [1,5,4], [1,4]],
  ['Green Irish Tweed', 5, 'Male', 1985, 420, [2,23,29,36], 'Long Lasting', 'Moderate', [1,4], [1,5], [12,1]],
  ['Silver Mountain Water', 5, 'Unisex', 1995, 385, [1,4,28,27], 'Moderate', 'Moderate', [1], [1,3], [1,8]],
  ['Viking', 5, 'Male', 2017, 435, [1,5,16,27], 'Long Lasting', 'Heavy', [4,1], [5,3], [1,9]],
  ['Millesime Imperial', 5, 'Unisex', 1995, 410, [2,1,15,27], 'Moderate', 'Moderate', [1], [3,1], [8,1]],
  ['Royal Oud', 5, 'Unisex', 2011, 425, [2,5,21,34], 'Long Lasting', 'Moderate', [3,2], [5,7], [4,9]],

  // --- YSL (6) ---
  ['La Nuit de L\'Homme', 6, 'Male', 2009, 95, [10,16,34,31], 'Moderate', 'Moderate', [3,4], [4,7], [9,3]],
  ['Y EDP', 6, 'Male', 2018, 110, [7,22,36,29], 'Long Lasting', 'Heavy', [1,4], [1,3], [1,4]],
  ['L\'Homme', 6, 'Male', 2006, 85, [9,1,29,34], 'Moderate', 'Moderate', [1,4], [1,3], [1,4]],
  ['Black Opium', 6, 'Female', 2014, 105, [5,14,25,34], 'Long Lasting', 'Heavy', [2,3], [2,4], [3,10]],
  ['Libre', 6, 'Female', 2019, 110, [2,16,3,25], 'Long Lasting', 'Heavy', [4], [1,4], [5,6]],
  ['Mon Paris', 6, 'Female', 2016, 100, [13,30,25], 'Long Lasting', 'Heavy', [4], [4,2], [5,3]],

  // --- Armani (7) ---
  ['Acqua di Gio Profumo', 7, 'Male', 2015, 95, [1,17,30,26], 'Long Lasting', 'Moderate', [1,4], [1,3], [8,1]],
  ['Acqua di Gio EDT', 7, 'Male', 1996, 80, [2,14,34,27], 'Moderate', 'Soft', [1], [1,6,3], [8,1]],
  ['Armani Code', 7, 'Male', 2004, 90, [2,23,31,16], 'Long Lasting', 'Heavy', [3,2], [4,7], [6,3]],
  ['Armani Code Absolu', 7, 'Male', 2019, 110, [7,19,25,31], 'Long Lasting', 'Heavy', [2,3], [4,7], [6,3,10]],
  ['Si', 7, 'Female', 2013, 95, [1,14,25,30], 'Long Lasting', 'Moderate', [4], [1,4], [5,7]],
  ['My Way', 7, 'Female', 2020, 100, [1,14,34,27], 'Moderate', 'Moderate', [1,4], [1,3], [5,1]],

  // --- Prada (8) ---
  ['Luna Rossa Carbon', 8, 'Male', 2017, 95, [1,16,36,30], 'Long Lasting', 'Heavy', [1,4], [1,3], [1,4]],
  ['L\'Homme Prada', 8, 'Male', 2016, 90, [15,26,29,30], 'Moderate', 'Moderate', [4], [1,5], [1,4]],
  ['Luna Rossa', 8, 'Male', 2012, 85, [16,11,36], 'Moderate', 'Moderate', [1], [6,3], [1,8]],
  ['Candy', 8, 'Female', 2011, 90, [25,20,27], 'Long Lasting', 'Heavy', [3,2], [4,3], [3,10]],
  ['La Femme Prada', 8, 'Female', 2016, 100, [14,25,29], 'Long Lasting', 'Moderate', [4,3], [5,4], [5,6]],

  // --- MFK (9) ---
  ['Baccarat Rouge 540', 9, 'Unisex', 2015, 325, [6,14,26,34], 'Beast', 'Enormous', [3,2,4], [4,5,7], [6,3]],
  ['Grand Soir', 9, 'Unisex', 2016, 245, [26,25,20,34], 'Beast', 'Heavy', [2,3], [7,4], [6,3]],
  ['Gentle Fluidity Gold', 9, 'Unisex', 2019, 245, [19,25,27], 'Long Lasting', 'Moderate', [4], [1,4], [3,4]],
  ['Oud Satin Mood', 9, 'Unisex', 2015, 305, [21,13,25,23], 'Beast', 'Heavy', [2,3], [7,4], [6,5]],
  ['Petit Matin', 9, 'Unisex', 2019, 215, [2,16,27], 'Moderate', 'Moderate', [1,4], [1,3], [1,12]],

  // --- PDM (10) ---
  ['Layton', 10, 'Male', 2016, 295, [7,10,25,34], 'Beast', 'Heavy', [3,2], [4,5], [3,9]],
  ['Pegasus', 10, 'Male', 2011, 295, [1,12,25,28], 'Beast', 'Heavy', [4,2], [4,5], [3,4]],
  ['Herod', 10, 'Male', 2012, 295, [20,33,25,35], 'Beast', 'Heavy', [2,3], [7,4], [9,3,10]],
  ['Sedley', 10, 'Male', 2019, 250, [11,17,28], 'Moderate', 'Moderate', [1,4], [1,3], [1,12]],
  ['Delina', 10, 'Female', 2017, 295, [2,13,30,25], 'Long Lasting', 'Heavy', [4], [4,5], [5,3]],

  // --- Lattafa (11) ---
  ['Raghba', 11, 'Unisex', 2014, 25, [25,26], 'Moderate', 'Soft', [3], [3], [3,6]],
  ['Khamrah', 11, 'Unisex', 2022, 35, [20,25,33,30], 'Beast', 'Heavy', [2,3], [4,7], [3,9,10]],
  ['Asad', 11, 'Male', 2022, 30, [33,25,36,30], 'Beast', 'Heavy', [2,3], [7,4], [3,4,11]],
  ['Yara', 11, 'Female', 2021, 28, [3,25,27,31], 'Moderate', 'Moderate', [4], [3,4], [3,10]],
  ['Fakhar', 11, 'Male', 2020, 22, [1,5,16,36], 'Long Lasting', 'Heavy', [1,4], [1,3], [1,7]],
  ['Bade\'e Al Oud Amethyst', 11, 'Unisex', 2020, 30, [21,13,25,27], 'Long Lasting', 'Heavy', [2,3], [7], [6,5]],

  // --- Al Haramain (12) ---
  ['Amber Oud Gold Edition', 12, 'Unisex', 2019, 50, [26,21,25,6], 'Beast', 'Heavy', [2,3], [7,4], [6,3]],
  ['L\'Aventure', 12, 'Male', 2016, 35, [8,1,21,30], 'Long Lasting', 'Heavy', [1,4], [1,3], [1,4]],
  ['Junoon', 12, 'Female', 2015, 40, [13,21,25,30], 'Long Lasting', 'Heavy', [3], [4,7], [6,5]],
  ['Detour Noir', 12, 'Male', 2018, 30, [10,18,29,34], 'Long Lasting', 'Heavy', [2,3], [7], [2,9]],
  ['Amber Oud Rouge', 12, 'Unisex', 2020, 55, [6,13,21,26], 'Beast', 'Enormous', [2,3], [7,4], [6,3]],

  // --- D&G (13) ---
  ['The One EDP', 13, 'Male', 2008, 85, [1,10,26,34], 'Long Lasting', 'Moderate', [3,4], [4,7], [9,6]],
  ['Light Blue Pour Homme', 13, 'Male', 2007, 75, [4,11,27,35], 'Moderate', 'Moderate', [1], [3,6], [7,8]],
  ['Light Blue', 13, 'Female', 2001, 70, [7,2,14,34], 'Moderate', 'Soft', [1], [3,6], [7,1]],
  ['K by Dolce & Gabbana', 13, 'Male', 2019, 90, [1,16,29,34], 'Long Lasting', 'Heavy', [1,4], [1,3], [1,4]],
  ['The Only One', 13, 'Female', 2018, 85, [23,13,25,30], 'Long Lasting', 'Moderate', [3,4], [4,7], [5,3]],

  // --- JPG (14) ---
  ['Le Male', 14, 'Male', 1995, 75, [11,16,25,31], 'Long Lasting', 'Heavy', [4,2], [3,2], [3,1]],
  ['Ultra Male', 14, 'Male', 2015, 85, [7,16,25,23], 'Beast', 'Heavy', [4,2], [2,4], [3,1]],
  ['Le Male Le Parfum', 14, 'Male', 2020, 95, [10,16,25,29], 'Beast', 'Enormous', [2,3], [4,7], [6,9]],
  ['Scandal Pour Homme', 14, 'Male', 2021, 90, [1,20,25,34], 'Long Lasting', 'Heavy', [3,4], [4,7], [3,9]],
  ['Classique', 14, 'Female', 1993, 80, [13,3,25,9], 'Moderate', 'Moderate', [4], [3,4], [5,6]],

  // --- Gucci (15) ---
  ['Guilty Pour Homme', 15, 'Male', 2011, 85, [16,3,34,30], 'Moderate', 'Moderate', [4], [3,4], [1,4]],
  ['Gucci Bloom', 15, 'Female', 2017, 95, [14,13,27], 'Long Lasting', 'Heavy', [1,4], [3,4], [5]],
  ['Guilty Absolute', 15, 'Male', 2017, 90, [29,32,35], 'Long Lasting', 'Heavy', [2,3], [7], [4,11]],
  ['Flora Gorgeous Gardenia', 15, 'Female', 2021, 100, [13,14,4,27], 'Moderate', 'Moderate', [1,4], [3,4], [5,1]],
  ['The Alchemist\'s Garden', 15, 'Unisex', 2019, 330, [13,21,25,27], 'Beast', 'Heavy', [3], [7,5], [6,5]],

  // --- Paco Rabanne (16) ---
  ['1 Million', 16, 'Male', 2008, 80, [4,20,32,26], 'Long Lasting', 'Heavy', [4,3], [2,4], [9,3]],
  ['Invictus', 16, 'Male', 2013, 80, [4,16,27,36], 'Long Lasting', 'Heavy', [1], [6,2], [8,1]],
  ['1 Million Parfum', 16, 'Male', 2020, 95, [33,31,26], 'Beast', 'Enormous', [2,3], [7,4], [6,9]],
  ['Phantom', 16, 'Male', 2021, 90, [2,16,25,29], 'Long Lasting', 'Heavy', [1,4], [3,2], [1,4]],
  ['Olympea', 16, 'Female', 2015, 80, [5,14,25,28], 'Long Lasting', 'Moderate', [4], [4,5], [6,3]],

  // --- Xerjoff (17) ---
  ['Naxos', 17, 'Unisex', 2015, 200, [16,25,33,20], 'Beast', 'Enormous', [2,3], [7,4], [3,9,10]],
  ['Erba Pura', 17, 'Unisex', 2019, 220, [3,7,25,27], 'Beast', 'Heavy', [1,4], [3,4], [3,1]],
  ['Alexandria II', 17, 'Unisex', 2009, 350, [6,21,28,25], 'Beast', 'Enormous', [2,3], [7,5], [6,4]],
  ['Mefisto', 17, 'Male', 2014, 190, [1,4,28,34], 'Long Lasting', 'Moderate', [1,4], [1,3], [7,1]],
  ['Soprano', 17, 'Unisex', 2020, 250, [1,13,25,30], 'Beast', 'Heavy', [4,3], [4,5], [5,3]],

  // --- Byredo (18) ---
  ['Gypsy Water', 18, 'Unisex', 2008, 190, [1,5,28,25], 'Moderate', 'Moderate', [4], [3,4], [4,12]],
  ['Bal d\'Afrique', 18, 'Unisex', 2009, 190, [1,23,29,34], 'Moderate', 'Moderate', [1,4], [3,4], [4,1]],
  ['Mojave Ghost', 18, 'Unisex', 2014, 190, [7,23,28,27], 'Moderate', 'Moderate', [1,4], [3], [5,4]],

  // --- Azzaro (19) ---
  ['Wanted by Night', 19, 'Male', 2018, 70, [20,33,26,34], 'Long Lasting', 'Heavy', [2,3], [4,7], [9,4]],
  ['The Most Wanted', 19, 'Male', 2021, 85, [10,20,25,33], 'Beast', 'Heavy', [2,3], [4,2], [9,3,10]],
  ['Chrome', 19, 'Male', 1996, 55, [2,13,27,34], 'Moderate', 'Moderate', [1], [1,3], [7,1]],

  // --- Hugo Boss (20) ---
  ['Boss Bottled', 20, 'Male', 1998, 65, [7,17,28,34], 'Moderate', 'Moderate', [4], [1,5], [4,1]],
  ['Boss Bottled Intense', 20, 'Male', 2015, 75, [7,20,28,25], 'Long Lasting', 'Heavy', [3,4], [5,7], [4,9]],
  ['Hugo Man', 20, 'Male', 1995, 50, [7,11,16,34], 'Moderate', 'Soft', [1], [3,6], [12,1]],
  ['Boss The Scent', 20, 'Male', 2015, 70, [9,16,32,25], 'Long Lasting', 'Heavy', [3,4], [4,7], [9,3]],
];

// Demo users
const USERS = [
  ['john_doe', 'john@example.com', 'demo1234', 25, 'Male'],
  ['perfumeQueen', 'queen@example.com', 'demo1234', 30, 'Female'],
  ['unisexFan', 'unisex@example.com', 'demo1234', 22, 'Other'],
  ['scentExplorer', 'explorer@example.com', 'demo1234', 28, 'Male'],
  ['floralLover', 'floral@example.com', 'demo1234', 35, 'Female'],
  ['oudKing', 'oud@example.com', 'demo1234', 40, 'Male'],
  ['freshFanatic', 'fresh@example.com', 'demo1234', 26, 'Female'],
  ['nicheLover', 'niche@example.com', 'demo1234', 33, 'Male'],
  ['vintageNose', 'vintage@example.com', 'demo1234', 45, 'Female'],
  ['budgetHunter', 'budget@example.com', 'demo1234', 21, 'Male'],
];

// Reviews: [perfumeIdx(0-based), userIdx(0-based), rating, comment]
const REVIEWS = [
  [0, 0, 5, 'The king of versatility. Works everywhere, anytime.'],
  [0, 3, 4, 'Great scent but a bit overplayed in my city.'],
  [8, 0, 5, 'Bleu de Chanel is pure sophistication in a bottle.'],
  [8, 7, 5, 'My signature scent. Gets compliments every single time.'],
  [15, 5, 5, 'Tobacco Vanille is a cozy masterpiece for cold nights.'],
  [15, 7, 4, 'Beautiful but projection can be too much sometimes.'],
  [28, 3, 5, 'Aventus lives up to the hype. Smoky pineapple magic.'],
  [28, 7, 4, 'Batch variation is real, but still outstanding.'],
  [51, 5, 5, 'Baccarat Rouge 540 is other-worldly. Nothing smells like this.'],
  [51, 4, 5, 'I get stopped on the street when I wear this.'],
  [51, 8, 4, 'Gorgeous but incredibly expensive.'],
  [22, 0, 4, 'Versace Eros is a club banger. Mint and vanilla work perfectly.'],
  [34, 3, 4, 'La Nuit is a date night classic. Understated elegance.'],
  [37, 4, 5, 'Black Opium is addictive. My absolute favorite coffee scent.'],
  [40, 0, 4, 'Acqua di Gio Profumo is the best from the line.'],
  [41, 3, 3, 'Classic but longevity is poor. Need to reapply.'],
  [46, 0, 4, 'Luna Rossa Carbon is great for office. Very professional.'],
  [56, 7, 5, 'Layton is a gourmand masterpiece. Apple pie vibes.'],
  [57, 7, 5, 'Pegasus is sweet and woody. Unique combination.'],
  [61, 9, 5, 'Raghba for $25? Insane value. Smells way more expensive.'],
  [62, 9, 5, 'Khamrah is a cinnamon bomb. Incredible for the price.'],
  [63, 9, 4, 'Asad is basically Sauvage Elixir for 1/10th the price.'],
  [18, 4, 5, 'Lost Cherry is dangerously addictive.'],
  [19, 5, 5, 'Black Orchid is dark, mysterious, and unforgettable.'],
  [20, 5, 5, 'Tuscan Leather is raw power. Not for the faint of heart.'],
  [10, 8, 5, 'Chanel No. 5 is timeless. Wearing what Marilyn Monroe wore.'],
  [11, 4, 5, 'Coco Mademoiselle is elegant and feminine. Office perfect.'],
  [29, 3, 4, 'Green Irish Tweed is the gentleman\'s fragrance.'],
  [72, 0, 4, 'The One is warm and inviting. Perfect for dinner dates.'],
  [75, 0, 4, 'Le Male is a classic for a reason. Still holds up.'],
  [83, 0, 4, '1 Million is flashy and fun. Great for nights out.'],
  [84, 3, 4, 'Invictus is sporty and fresh. Good gym-to-bar scent.'],
  [16, 5, 5, 'Tom Ford never misses. Oud Wood is liquid luxury.'],
  [60, 4, 5, 'Delina is a rose masterpiece. Feminine and powerful.'],
  [86, 7, 5, 'Naxos is honey, tobacco, lavender heaven.'],
  [87, 9, 5, 'Erba Pura is an absolute fruity beast. Amazing projection.'],
  [36, 3, 4, 'Y EDP is a safe blind buy. Fresh and versatile.'],
  [43, 0, 4, 'Armani Code Absolu is a sweet sophistication bomb.'],
  [52, 7, 5, 'Grand Soir is liquid amber perfection.'],
  [66, 9, 4, 'L\'Aventure smells like Aventus at a fraction of the cost.'],
  [55, 5, 5, 'Baccarat Rouge 540 is a once in a generation perfume.'],
  [13, 4, 4, 'Bleu de Chanel Parfum is the best version. Rich and deep.'],
  [35, 0, 3, 'La Nuit has weak longevity now. Reformulated sadly.'],
  [93, 3, 3, 'Gypsy Water is beautiful but fades fast for the price.'],
  [70, 4, 5, 'The Only One is my wedding scent. So special.'],
  [96, 0, 4, 'Wanted by Night is cinema in a bottle. Dramatic.'],
  [97, 9, 5, 'The Most Wanted is a banger. Cinnamon overload in the best way.'],
  [98, 3, 3, 'Chrome is nice but very dated now.'],
  [89, 7, 4, 'Alexandria II is pure Middle Eastern luxury.'],
  [53, 4, 5, 'Oud Satin Mood is the most beautiful oud fragrance I own.'],
];

// ═══════════════════════════════════════════════
// SEED EXECUTION
// ═══════════════════════════════════════════════

async function seed() {
  console.log('🌱 Starting seed...\n');
  const conn = await mysql.createConnection(DB_CONFIG);

  try {
    // Disable FK checks for clean truncation
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');

    // Clear all tables
    const tables = [
      'PerfumeCategory', 'PerfumeOccasion', 'PerfumeSeason', 'PerfumeNote',
      'Review', 'Performance', 'Perfume', 'Note', 'Category', 'Occasion',
      'Season', 'Brand', 'BrandType', '`User`'
    ];
    for (const t of tables) {
      await conn.execute(`TRUNCATE TABLE ${t}`);
    }
    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('  ✓ Cleared existing data');

    // --- Brand Types ---
    for (const bt of BRAND_TYPES) {
      await conn.execute('INSERT INTO BrandType (type_name) VALUES (?)', [bt]);
    }
    console.log(`  ✓ Inserted ${BRAND_TYPES.length} brand types`);

    // --- Brands ---
    for (const [name, country, btId] of BRANDS) {
      await conn.execute('INSERT INTO Brand (brand_name, origin_country, brand_type_id) VALUES (?, ?, ?)', [name, country, btId]);
    }
    console.log(`  ✓ Inserted ${BRANDS.length} brands`);

    // --- Notes ---
    for (const [name, type] of NOTES) {
      await conn.execute('INSERT INTO Note (note_name, note_type) VALUES (?, ?)', [name, type]);
    }
    console.log(`  ✓ Inserted ${NOTES.length} notes`);

    // --- Seasons ---
    for (const s of SEASONS) {
      await conn.execute('INSERT INTO Season (name) VALUES (?)', [s]);
    }
    console.log(`  ✓ Inserted ${SEASONS.length} seasons`);

    // --- Occasions ---
    for (const o of OCCASIONS) {
      await conn.execute('INSERT INTO Occasion (name) VALUES (?)', [o]);
    }
    console.log(`  ✓ Inserted ${OCCASIONS.length} occasions`);

    // --- Categories ---
    for (const c of CATEGORIES) {
      await conn.execute('INSERT INTO Category (name) VALUES (?)', [c]);
    }
    console.log(`  ✓ Inserted ${CATEGORIES.length} categories`);

    // --- Perfumes + Performance + Junction tables ---
    let noteCount = 0, seasonCount = 0, occasionCount = 0, categoryCount = 0;
    for (let i = 0; i < PERFUMES.length; i++) {
      const [name, brandIdx, gender, year, price, noteIds, longevity, sillage, seasonIds, occasionIds, categoryIds] = PERFUMES[i];
      const perfumeId = i + 1;

      await conn.execute(
        'INSERT INTO Perfume (name, brand_id, gender, release_year, price, image_url) VALUES (?, ?, ?, ?, ?, ?)',
        [name, brandIdx, gender, year, price, IMG]
      );

      // Performance
      await conn.execute(
        'INSERT INTO Performance (perfume_id, longevity, sillage) VALUES (?, ?, ?)',
        [perfumeId, longevity, sillage]
      );

      // Notes
      for (const nid of noteIds) {
        await conn.execute('INSERT INTO PerfumeNote (perfume_id, note_id) VALUES (?, ?)', [perfumeId, nid]);
        noteCount++;
      }

      // Seasons
      for (const sid of seasonIds) {
        await conn.execute('INSERT INTO PerfumeSeason (perfume_id, season_id) VALUES (?, ?)', [perfumeId, sid]);
        seasonCount++;
      }

      // Occasions
      for (const oid of occasionIds) {
        await conn.execute('INSERT INTO PerfumeOccasion (perfume_id, occasion_id) VALUES (?, ?)', [perfumeId, oid]);
        occasionCount++;
      }

      // Categories
      for (const cid of categoryIds) {
        await conn.execute('INSERT INTO PerfumeCategory (perfume_id, category_id) VALUES (?, ?)', [perfumeId, cid]);
        categoryCount++;
      }
    }
    console.log(`  ✓ Inserted ${PERFUMES.length} perfumes`);
    console.log(`    → ${noteCount} perfume-note links`);
    console.log(`    → ${seasonCount} perfume-season links`);
    console.log(`    → ${occasionCount} perfume-occasion links`);
    console.log(`    → ${categoryCount} perfume-category links`);
    console.log(`    → ${PERFUMES.length} performance records`);

    // --- Users ---
    for (const [username, email, password, age, gender] of USERS) {
      const hash = await bcrypt.hash(password, 10);
      await conn.execute(
        'INSERT INTO `User` (username, email, password_hash, age, gender) VALUES (?, ?, ?, ?, ?)',
        [username, email, hash, age, gender]
      );
    }
    console.log(`  ✓ Inserted ${USERS.length} users (password: demo1234)`);

    // --- Reviews ---
    const reviewDates = [];
    for (let i = 0; i < REVIEWS.length; i++) {
      const d = new Date(2025, 0, 1 + i * 3); // spread over time
      reviewDates.push(d.toISOString().split('T')[0]);
    }
    for (let i = 0; i < REVIEWS.length; i++) {
      const [perfIdx, userIdx, rating, comment] = REVIEWS[i];
      await conn.execute(
        'INSERT INTO Review (perfume_id, user_id, rating, comment, review_date) VALUES (?, ?, ?, ?, ?)',
        [perfIdx + 1, userIdx + 1, rating, comment, reviewDates[i]]
      );
    }
    console.log(`  ✓ Inserted ${REVIEWS.length} reviews`);

    console.log('\n✅ Seed complete!\n');
    console.log('  Demo login credentials:');
    console.log('  Email: john@example.com');
    console.log('  Password: demo1234\n');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    await conn.end();
  }
}

seed().catch(() => process.exit(1));
