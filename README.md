# Project 6 - Full Stack App

* FavLinks V3, adding seperate users and a recent activity feed
* All entries persist and can be modified through the website or REST API

# Instructions

### 1. Create the PostgreSQL Database

Open a terminal and run:

```bash
psql -U username postgres
```

In psql run:

```sql
CREATE DATABASE favlinks_db;

\c favlinks_db

CREATE TABLE links (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Make .env file

Make an .env file in root folder with PostgreSQL credentials:

```
DB_NAME=favlinks_db
DB_HOST=localhost
DB_USER=your_username
DB_PASS=your_password
DB_PORT=5000
SITE_PORT=5173
POSTGRES_PORT=5432
```

### 3. Install Dependencies

```bash
npm run install-all
```

### 4. Start the App

```bash
npm run dev
```
