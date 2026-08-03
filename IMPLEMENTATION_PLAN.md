# Implementation Plan: Minimal Database Showcase Application

## 1. Schema Overview

The database is designed for a **Perfume Recommendation System**. It models a complex, multi-dimensional catalog of fragrances, categorizing them by brands, notes, seasonal suitability, occasions, and performance metrics, while also capturing user reviews.

### Main Entities & Relationships
* **Core Entities:** 
  * `Perfume` is the central entity. 
  * `Brand` and `BrandType` classify the perfume house.
  * `User` and `Review` capture user feedback.
* **1:N Relationships:** 
  * `BrandType` -> `Brand` (A brand type has many brands)
  * `Brand` -> `Perfume` (A brand has many perfumes)
  * `Perfume` -> `Review` & `User` -> `Review` (Reviews belong to a perfume and a user)
* **1:1 Relationships:** 
  * `Perfume` -> `Performance` (Longevity and sillage)
* **M:N (Junction) Relationships:** 
  * `PerfumeNote`, `PerfumeSeason`, `PerfumeOccasion`, `PerfumeCategory`. These tables link a perfume to multiple notes, seasons, occasions, and categories respectively.

### Key Constraints & Rules
* `rating` in the `Review` table has a `CHECK` constraint ensuring values are between 1 and 5.
* Enums are heavily utilized to enforce valid data sets for `gender`, `note_type`, `longevity`, and `sillage`.
* Referential integrity is enforced via standard Foreign Keys.

---

## 2. Recommended Schema Improvements

To make the application more robust and better suited for demonstration (specifically with JWT auth), the following minor schema tweaks are recommended. *The core business logic remains untouched.*

1. **User Authentication Fields (Required for JWT)**
   * **Change:** Add `email VARCHAR(255) UNIQUE NOT NULL` and `password_hash VARCHAR(255) NOT NULL` to the `User` table.
   * **Why:** Necessary to demonstrate standard secure authentication (JWT) and user identity.
2. **Handle Reserved Keywords**
   * **Change:** Rename the `User` table to `Users` or strictly enclose it in backticks (\`User\`) in all queries.
   * **Why:** `USER` is a reserved keyword in most SQL dialects, which can cause query syntax errors.
3. **Audit Timestamps (Recommended)**
   * **Change:** Add `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` to `Perfume` and `Review`.
   * **Why:** Enables demonstration of sorting records chronologically (e.g., "Latest Additions" or "Recent Reviews").
4. **Cascading Deletes (Recommended)**
   * **Change:** Update foreign keys in junction tables (e.g., `PerfumeNote`) and `Review` to use `ON DELETE CASCADE`.
   * **Why:** Demonstrates how deleting a parent record (Perfume) automatically cleans up orphaned M:N mapping records and reviews, highlighting relational database integrity features.
5. **Display Enhancements (Optional)**
   * **Change:** Add `image_url VARCHAR(255)` and `description TEXT` to `Perfume`.
   * **Why:** Greatly improves the visual fidelity of the showcase frontend without changing relational complexity.

---

## 3. Demonstration Goals

The primary goal is to prove the database's power and correctness. The app must demonstrate:

* **Complex JOINs:** Retrieving a single perfume alongside its brand, performance metrics, and all associated notes/seasons/categories (requiring joins across up to 7 tables simultaneously).
* **Aggregate Functions:** Calculating the average rating and total review count for a perfume (`AVG(rating)`, `COUNT(review_id)`).
* **M:N Filtering:** Finding perfumes that match *both* "Summer" (Season) and "Citrus" (Category) using `HAVING` and `GROUP BY` on junction tables.
* **Integrity & Constraints:** 
  * Demonstrating that the database rejects a review rating of "6" (CHECK constraint).
  * Demonstrating that deleting a Brand is blocked if Perfumes depend on it (Foreign Key restriction).
* **Authentication Security:** Creating reviews mapped to the uniquely authenticated user via JWT.

---

## 4. Minimal Application Features

Every UI feature is a direct window into a database capability. 

### A. Dashboard / Home Page
* **Demonstrates:** Aggregate queries and basic data fetching.
* **SQL Operations:** `COUNT` of total perfumes/brands, `ORDER BY created_at DESC` for latest additions.

### B. Catalog / Advanced Search Explorer
* **Demonstrates:** Complex filtering across junction tables.
* **SQL Operations:** Dynamic `WHERE` clauses (for Enums like Gender/Longevity) and `HAVING COUNT(...)` queries to filter by multiple M:N tags (e.g., must have Note A AND Note B).

### C. Perfume Detail View
* **Demonstrates:** 1:1, 1:N, and M:N relationships coalesced into a single view.
* **SQL Operations:** Massive `SELECT` using `LEFT JOIN` on `Performance`, `Brand`, `PerfumeNote`, `Note`, and `Review`.

### D. Review Submission Form (Authenticated)
* **Demonstrates:** JWT authorization, INSERT operations, and constraint validation.
* **SQL Operations:** `INSERT INTO Review`, with the database rejecting invalid ratings (CHECK constraint test).

### E. CRUD Management (Admin/Hidden)
* **Demonstrates:** Foreign key constraints, Cascading Deletes, and Transactions.
* **SQL Operations:** `INSERT` into `Perfume` wrapped in a SQL transaction alongside `INSERT`s into `PerfumeNote` and `PerfumeSeason` to guarantee atomic writes.

---

## 5. Backend Plan

**Tech Stack:** Node.js, Express, `mysql2` driver. Docker for MySQL hosting.

* **Raw SQL over ORMs:** To explicitly showcase the database schema, the backend will use raw parameter-bound SQL queries rather than an ORM like Prisma or Sequelize. 
* **Dockerized Database:** A `docker-compose.yml` file will provision a MySQL 8 container with the schema initialized automatically.
* **JWT Middleware:** A lightweight Express middleware will verify standard Bearer tokens before allowing `INSERT`/`DELETE` on reviews or perfumes.
* **Error Passthrough:** Database errors (like constraint violations or foreign key failures) will be caught and directly passed to the frontend to visually prove the database is doing its job.

---

## 6. Frontend Plan

**Tech Stack:** Vanilla JavaScript + HTML/CSS (or a minimal React/Vite shell). 

* **Focus:** Data presentation. The UI will be thin, relying heavily on data tables, grids, and simple forms.
* **State Management:** Minimal. Fetch data -> Render to DOM.
* **Auth Flow:** A simple Login/Register screen that saves a JWT to `localStorage` and appends it to subsequent API requests.
* **Visualizing the Schema:** The detail page will explicitly group data (e.g., a "Notes" section, a "Performance" badge) to make it clear how the normalized tables are being reconstructed for the user.

---

## 7. Development Roadmap

* **Phase 1: Database Provisioning:** Create `docker-compose.yml`, apply the schema (with the recommended JWT/Timestamp improvements), and write a robust seed script to populate ~50 realistic perfumes to make queries meaningful.
* **Phase 2: Backend Core & Auth:** Setup Node/Express, configure the database connection pool, and implement the register/login endpoints with JWT issuance.
* **Phase 3: Read-Only Endpoints (The JOINs):** Implement the complex `GET` endpoints for the catalog, multi-filter search, and perfume detail views.
* **Phase 4: Write Endpoints (The Constraints):** Implement authenticated `POST`/`DELETE` routes for reviews and perfumes, ensuring transactions are used for M:N relationships.
* **Phase 5: Frontend Shell:** Build the HTML/CSS layout, navigation, and API client wrapper for JWT injection.
* **Phase 6: Frontend Pages:** Connect the frontend to the backend endpoints (Dashboard, Catalog, Detail View, Login).
* **Phase 7: End-to-End Testing:** Verify that database constraints (like invalid ratings) properly bubble up to the frontend UI as error messages.
