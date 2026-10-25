
# StoreRate - Full Stack Store Rating Platform

StoreRate is a full-stack web application that allows users to rate stores, store owners to monitor ratings, and system administrators to manage users and stores through role-based access control.

## Features

### System Administrator
- View dashboard statistics for users, stores, and ratings.
- Add new users, administrators, store owners, and stores.
- View and manage user and store records.
- Search and sort records by supported fields.
- View detailed user information, including store ratings where applicable.

### Normal User
- Sign up and log in securely.
- Browse and search stores by name and address.
- View store average ratings and total ratings.
- Submit a rating from 1 to 5.
- Update a previously submitted rating.
- Change account password.

### Store Owner
- View store average rating and total ratings.
- View customers who have rated the store.
- View customer details, ratings, and rating submission dates.
- Change account password.

## Tech Stack

**Frontend**
- React.js
- Vite
- JavaScript
- CSS

**Backend**
- Node.js
- Express.js
- MySQL
- JWT Authentication
- bcrypt Password Hashing

**Tools**
- Git and GitHub
- npm
- REST APIs

## Project Structure

```text
roxilar_store_ratings/
├── backend/
│   ├── middleware/
│   ├── db.js
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── package-lock.json
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before running the application:

- Node.js and npm
- MySQL Server
- Git

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/shripawar334/StoreRate-FullStack.git
cd StoreRate-FullStack
```

### 2. Set Up the Database

Start MySQL and create the database:

```sql
CREATE DATABASE roxiler;
```

Create the required tables for users, stores, and ratings using the database schema configured for the application.

Ensure that foreign keys, unique constraints, and rating validation are configured correctly.

### 3. Configure the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory and configure your local database credentials and JWT secret according to the variables used in `db.js` and `server.js`.

Do not commit `.env` or expose database credentials or secrets.

Start the backend:

```bash
npm start
```

If a start script is not configured in `backend/package.json`, use the appropriate command for your setup, such as:

```bash
node server.js
```

The backend runs at `http://localhost:5000` when configured with the default port.

### 4. Configure the Frontend

Open a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` with the default Vite configuration.

Ensure that the API base URL in `frontend/src/services/api.js` points to your running backend.

## API Overview

The backend exposes REST API endpoints for authentication, user management, store management, ratings, and dashboards.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Register a normal user |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/auth/me` | Retrieve authenticated user information |
| PUT | `/api/auth/update-password` | Update account password |
| GET | `/api/admin/dashboard` | Retrieve admin dashboard statistics |
| GET | `/api/users` | List and filter users |
| POST | `/api/admin/users` | Create a user or administrator |
| GET | `/api/users/:id` | Retrieve user details |
| GET | `/api/stores` | List and filter stores |
| POST | `/api/stores` | Create a store |
| GET | `/api/user/stores` | Browse stores as a normal user |
| POST | `/api/stores/:storeId/rating` | Submit or update a store rating |
| GET | `/api/owner/dashboard` | Retrieve store owner dashboard data |

Protected endpoints require authentication and the appropriate user role.

## Validation and Security

- Passwords are hashed using bcrypt before storage.
- JWT authentication protects restricted endpoints.
- Role-based authorization limits access to permitted features.
- Email addresses must be valid and unique where required.
- Names must contain 20–60 characters.
- Addresses cannot exceed 400 characters.
- Passwords must contain 8–16 characters, including an uppercase letter and a special character.
- Ratings must be integers from 1 to 5.
- A user can submit one rating per store and update it later.

## Future Improvements

- Add automated unit and integration tests.
- Deploy the backend and database to a production environment.
- Add pagination for large datasets.
- Improve automated API documentation.

## Author

**Shripad Pawar**

GitHub: https://github.com/shripawar334
