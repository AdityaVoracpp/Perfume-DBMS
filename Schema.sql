CREATE DATABASE PerfumeRecommendation;
USE PerfumeRecommendation;

CREATE TABLE BrandType (
  brand_type_id INT PRIMARY KEY AUTO_INCREMENT,
  type_name VARCHAR(50) NOT NULL
);

CREATE TABLE Brand (
  brand_id INT PRIMARY KEY AUTO_INCREMENT,
  brand_name VARCHAR(100) NOT NULL,
  origin_country VARCHAR(50),
  brand_type_id INT,
  FOREIGN KEY (brand_type_id) REFERENCES BrandType(brand_type_id)
);

CREATE TABLE Perfume (
  perfume_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  brand_id INT,
  gender ENUM('Male', 'Female', 'Unisex'),
  release_year INT,
  price DECIMAL(10,2),
  FOREIGN KEY (brand_id) REFERENCES Brand(brand_id)
);

CREATE TABLE Note (
  note_id INT PRIMARY KEY AUTO_INCREMENT,
  note_name VARCHAR(100) NOT NULL,
  note_type ENUM('Top', 'Middle', 'Base') NOT NULL
);

CREATE TABLE PerfumeNote (
  perfume_id INT,
  note_id INT,
  PRIMARY KEY (perfume_id, note_id),
  FOREIGN KEY (perfume_id) REFERENCES Perfume(perfume_id),
  FOREIGN KEY (note_id) REFERENCES Note(note_id)
);

CREATE TABLE Performance (
  perfume_id INT PRIMARY KEY,
  longevity ENUM('Poor', 'Moderate', 'Long Lasting', 'Beast'),
  sillage ENUM('Soft', 'Moderate', 'Heavy', 'Enormous'),
  FOREIGN KEY (perfume_id) REFERENCES Perfume(perfume_id)
);

CREATE TABLE User (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  age INT,
  gender ENUM('Male', 'Female', 'Other')
);

CREATE TABLE Review (
  review_id INT PRIMARY KEY AUTO_INCREMENT,
  perfume_id INT,
  user_id INT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  review_date DATE,
  FOREIGN KEY (perfume_id) REFERENCES Perfume(perfume_id),
  FOREIGN KEY (user_id) REFERENCES User(user_id)
);

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

CREATE TABLE PerfumeSeason (
  perfume_id INT,
  season_id INT,
  PRIMARY KEY (perfume_id, season_id),
  FOREIGN KEY (perfume_id) REFERENCES Perfume(perfume_id),
  FOREIGN KEY (season_id) REFERENCES Season(season_id)
);

CREATE TABLE PerfumeOccasion (
  perfume_id INT,
  occasion_id INT,
  PRIMARY KEY (perfume_id, occasion_id),
  FOREIGN KEY (perfume_id) REFERENCES Perfume(perfume_id),
  FOREIGN KEY (occasion_id) REFERENCES Occasion(occasion_id)
);

CREATE TABLE PerfumeCategory (
  perfume_id INT,
  category_id INT,
  PRIMARY KEY (perfume_id, category_id),
  FOREIGN KEY (perfume_id) REFERENCES Perfume(perfume_id),
  FOREIGN KEY (category_id) REFERENCES Category(category_id)
);
