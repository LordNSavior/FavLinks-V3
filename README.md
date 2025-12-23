# Project 6 - Full Stack App

* A full-stack link organizer app built with React, Vite, Tailwind CSS, Node.js/Express, and PostgreSQL.
* All entries persist and can be modified through the website or REST API
* FavLinks V3 changes:
  * Added login page, letting users make accounts
  * Admin accounts can be designated, with a dedicated admin page
  * "Make public" toggle to add your link to a public, shared list

# Instructions

### 1. Create the PostgreSQL Database

Open a terminal and run:

```bash
psql -U username postgres
```

In psql run:

```sql
CREATE DATABASE favlinks_db;
```

The app will automatically create the required tables (`users`, `links`, `activities`) on first run.

### 2. Make .env file in root folder

Make an .env file in root folder with PostgreSQL credentials:

```env
DB_NAME=favlinks_db
DB_HOST=localhost
DB_USER=your_postgres_username
DB_PASS=your_postgres_password
POSTGRES_PORT=5432

# Backend server port
DB_PORT=5000

# JWT secret for post requests
JWT_SECRET=your_jwt_secret_here
```

### 3. Install Dependencies

```bash
npm run install-all
```

### 4. Start the App

```bash
npm run dev
```

### 5. Setting Admin User (after account creation)

```sql
UPDATE users SET is_admin = true WHERE username = 'your_username';
```

### Post Requests

## User/Public Endpoints

# Register
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "secret123"}'

# Login (returns JWT token)
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "secret123"}'

# Get current user
curl http://localhost:5000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get all links for logged-in user
curl http://localhost:5000/links \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create a link
curl -X POST http://localhost:5000/links \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Google", "url": "https://google.com", "isPublic": false}'

# Delete a link
curl -X DELETE http://localhost:5000/links/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get activities
curl http://localhost:5000/activities \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get public/shared links (no auth needed)
curl http://localhost:5000/links/public

## Admin Endpoints

# List all users
curl http://localhost:5000/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Update user admin status
curl -X PUT http://localhost:5000/admin/users/2 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isAdmin": true}'

# Delete a user
curl -X DELETE http://localhost:5000/admin/users/2 \
  -H "Authorization: Bearer ADMIN_TOKEN"