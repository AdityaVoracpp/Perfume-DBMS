-- ============================================================
-- Perfume Recommendation System — Database Schema
-- ============================================================
-- Modified from original Schema.sql:
--   • Added image_url, description to Perfume
--   • Added email, password_hash, created_at to User
--   • Added ON DELETE CASCADE to all foreign keys
--   • Backtick-quoted `User` (MySQL reserved word)
-- ============================================================

CREATE DATABASE IF NOT EXISTS PerfumeRecommendation;
USE PerfumeRecommendation;

-- -----------------------------------------------------------
-- Brand Classification
-- -----------------------------------------------------------
CREATE TABLE BrandType (
  brand_type_id INT PRIMARY KEY AUTO_INCREMENT,
  type_name VARCHAR(50) NOT NULL
);

CREATE TABLE Brand (
  brand_id INT PRIMARY KEY AUTO_INCREMENT,
  brand_name VARCHAR(100) NOT NULL,
  origin_country VARCHAR(50),
  brand_type_id INT,
  FOREIGN KEY (brand_type_id) REFERENCES BrandType(brand_type_id) ON DELETE SET NULL
);

-- -----------------------------------------------------------
-- Core Perfume Entity
-- -----------------------------------------------------------
CREATE TABLE Perfume (
  perfume_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  brand_id INT,
  gender ENUM('Male', 'Female', 'Unisex'),
  release_year INT,
  price DECIMAL(10,2),
  image_url VARCHAR(500),
  description TEXT,
  FOREIGN KEY (brand_id) REFERENCES Brand(brand_id) ON DELETE SET NULL
);

-- -----------------------------------------------------------
-- Fragrance Notes (Top / Middle / Base pyramid)
-- -----------------------------------------------------------
CREATE TABLE Note (
  note_id INT PRIMARY KEY AUTO_INCREMENT,
  note_name VARCHAR(100) NOT NULL,
  note_type ENUM('Top', 'Middle', 'Base') NOT NULL
);

CREATE TABLE PerfumeNote (
  perfume_id INT,
  note_id INT,
  PRIMARY KEY (perfume_id, note_id),
  FOREIGN KEY (perfume_id) REFERENCES Perfume(perfume_id) ON DELETE CASCADE,
  FOREIGN KEY (note_id) REFERENCES Note(note_id) ON DELETE CASCADE
);

-- -----------------------------------------------------------
-- Performance Metrics (1:1 with Perfume)
-- -----------------------------------------------------------
CREATE TABLE Performance (
  perfume_id INT PRIMARY KEY,
  longevity ENUM('Poor', 'Moderate', 'Long Lasting', 'Beast'),
  sillage ENUM('Soft', 'Moderate', 'Heavy', 'Enormous'),
  FOREIGN KEY (perfume_id) REFERENCES Perfume(perfume_id) ON DELETE CASCADE
);

-- -----------------------------------------------------------
-- Users & Authentication
-- -----------------------------------------------------------
CREATE TABLE `User` (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  age INT,
  gender ENUM('Male', 'Female', 'Other'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------
-- Reviews
-- -----------------------------------------------------------
CREATE TABLE Review (
  review_id INT PRIMARY KEY AUTO_INCREMENT,
  perfume_id INT,
  user_id INT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  review_date DATE,
  FOREIGN KEY (perfume_id) REFERENCES Perfume(perfume_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES `User`(user_id) ON DELETE CASCADE
);

-- -----------------------------------------------------------
-- Tagging Dimensions (lookup tables)
-- -----------------------------------------------------------
CREATE TABLE Season (
  season_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL
);

CREATE TABLE Occasion (
  occasion_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL
);

CREATE TABLE Category (
  category_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL
);

-- -----------------------------------------------------------
-- Many-to-Many Junction Tables
-- -----------------------------------------------------------
CREATE TABLE PerfumeSeason (
  perfume_id INT,
  season_id INT,
  PRIMARY KEY (perfume_id, season_id),
  FOREIGN KEY (perfume_id) REFERENCES Perfume(perfume_id) ON DELETE CASCADE,
  FOREIGN KEY (season_id) REFERENCES Season(season_id) ON DELETE CASCADE
);

CREATE TABLE PerfumeOccasion (
  perfume_id INT,
  occasion_id INT,
  PRIMARY KEY (perfume_id, occasion_id),
  FOREIGN KEY (perfume_id) REFERENCES Perfume(perfume_id) ON DELETE CASCADE,
  FOREIGN KEY (occasion_id) REFERENCES Occasion(occasion_id) ON DELETE CASCADE
);

CREATE TABLE PerfumeCategory (
  perfume_id INT,
  category_id INT,
  PRIMARY KEY (perfume_id, category_id),
  FOREIGN KEY (perfume_id) REFERENCES Perfume(perfume_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES Category(category_id) ON DELETE CASCADE
);
