-- 1. BrandType
INSERT INTO BrandType (type_name) VALUES 
('Designer'), 
('Niche'), 
('Middle Eastern');

-- 2. Brand
INSERT INTO Brand (brand_name, origin_country, brand_type_id) VALUES 
('Dior', 'France', 1), 
('Amouage', 'Oman', 2), 
('Lattafa', 'UAE', 3);

-- 3. Perfume
INSERT INTO Perfume (name, brand_id, gender, release_year, price) VALUES 
('Dior Sauvage', 1, 'Male', 2015, 95.00),
('Amouage Interlude Man', 2, 'Male', 2012, 310.00),
('Lattafa Raghba', 3, 'Unisex', 2014, 25.00);

-- 4. Note
INSERT INTO Note (note_name, note_type) VALUES 
('Bergamot', 'Top'),
('Oregano', 'Top'),
('Vanilla', 'Base'),
('Amber', 'Base'),
('Incense', 'Middle'),
('Lavender', 'Middle');

-- 5. PerfumeNote
-- Dior Sauvage (id = 1)
INSERT INTO PerfumeNote (perfume_id, note_id) VALUES 
(1, 1),  -- Bergamot
(1, 6);  -- Lavender

-- Amouage Interlude Man (id = 2)
INSERT INTO PerfumeNote (perfume_id, note_id) VALUES 
(2, 2),  -- Oregano
(2, 5),  -- Incense
(2, 4);  -- Amber

-- Lattafa Raghba (id = 3)
INSERT INTO PerfumeNote (perfume_id, note_id) VALUES 
(3, 3),  -- Vanilla
(3, 4);  -- Amber

-- 6. Performance
INSERT INTO Performance (perfume_id, longevity, sillage) VALUES 
(1, 'Long Lasting', 'Heavy'),
(2, 'Beast', 'Enormous'),
(3, 'Moderate', 'Soft');

-- 7. User
INSERT INTO User (username, age, gender) VALUES 
('john_doe', 25, 'Male'),
('perfumeQueen', 30, 'Female'),
('unisexFan', 22, 'Other');

-- 8. Review
INSERT INTO Review (perfume_id, user_id, rating, comment, review_date) VALUES 
(1, 1, 5, 'Very fresh and crowd-pleasing.', '2025-07-01'),
(2, 2, 4, 'Strong and bold, not for everyone.', '2025-07-02'),
(3, 3, 4, 'Great value for money.', '2025-07-03');

-- 9. Season
INSERT INTO Season (name) VALUES 
('Summer'), 
('Winter'), 
('Fall');

-- 10. Occasion
INSERT INTO Occasion (name) VALUES 
('Office'), 
('Party'), 
('Casual');

-- 11. Category
INSERT INTO Category (name) VALUES 
('Fresh'), 
('Smoky'), 
('Sweet');

-- 12. PerfumeSeason
INSERT INTO PerfumeSeason (perfume_id, season_id) VALUES 
(1, 1),  -- Sauvage - Summer
(2, 2),  -- Interlude - Winter
(3, 3);  -- Raghba - Fall

-- 13. PerfumeOccasion
INSERT INTO PerfumeOccasion (perfume_id, occasion_id) VALUES 
(1, 1),  -- Office
(2, 2),  -- Party
(3, 3);  -- Casual

-- 14. PerfumeCategory
INSERT INTO PerfumeCategory (perfume_id, category_id) VALUES 
(1, 1),  -- Fresh
(2, 2),  -- Smoky
(3, 3);  -- Sweet