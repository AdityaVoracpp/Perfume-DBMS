Perfume Recommendation System - MySQL Database

This project is a MySQL database designed to store and query data for a Perfume Recommendation System. It captures key attributes of perfumes such as brand, notes, performance, user reviews,
and suitability for seasons, occasions, and categories.

---

Database Schema

Core Tables
- BrandType: Types of brands (Designer, Niche, Middle Eastern, etc.)
- Brand: Stores brand info and links to BrandType
- Perfume: Main perfume data, linked to Brand
- Note: List of fragrance notes, categorized as Top, Middle, or Base
- Performance: Longevity and sillage info for each perfume
- User: Basic user profile for reviews
- Review: User reviews and ratings of perfumes

Categorization Tables
- Season: Perfumes suitable for Summer, Winter, etc.
- Occasion: Perfumes suited for Office, Party, Casual, etc.
- Category: Scent style categories like Fresh, Smoky, Sweet, etc.

Relationship Tables (Many-to-Many)
- PerfumeNote: Connects perfumes with multiple notes
- PerfumeSeason
- PerfumeOccasion
- PerfumeCategory

