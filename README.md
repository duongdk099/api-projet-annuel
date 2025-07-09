# Auth API Service

A Node.js/Express authentication microservice using Prisma ORM, JWT access & refresh tokens, and optional 2FA (TOTP).

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [How It Works](#how-it-works)
- [Routes & Endpoints](#routes--endpoints)
- [Controllers & Middleware](#controllers--middleware)
- [Prisma Schema & Migrations](#prisma-schema--migrations)
- [Error Handling](#error-handling)
- [License](#license)

---

## Features

- User registration and login
- Admin registration
- JWT-based access & refresh tokens
- Token refresh & logout flow
- Optional Two-Factor Authentication (2FA) via TOTP
- Protected routes with Express middleware
- Database access via Prisma

---

## Project Structure

```
api-nodejs/
├── config/
│   └── db.js                # Prisma client setup
├── controllers/
│   └── authController.js    # Auth logic (register, login, 2FA, tokens)
├── middleware/
│   └── authMiddleware.js    # JWT verification middleware
├── routes/
│   └── authRoutes.js        # Route definitions for /api/auth
├── prisma/
│   ├── schema.prisma        # Data model definitions
│   └── migrations/          # Migration files
├── generated/               # Auto-generated Prisma client code
├── server.js                # Express app initialization
├── package.json             # Dependencies & scripts
└── README.md                # This file
```

---

## Prerequisites

- Node.js v14+ or higher
- npm (or yarn)
- PostgreSQL, MySQL, SQLite, or compatible database

---

## Installation & Setup

1. Clone the repository:
   ```powershell
   git clone <repo-url>
   cd api-nodejs
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Create a `.env` file in the project root (see [Environment Variables](#environment-variables)).

4. Run Prisma migrations and generate client:
   ```powershell
   npx prisma migrate dev --name init_users_table
   npx prisma generate
   ```

5. Start the server:
   ```powershell
   npm start
   ```

The service will listen on the port defined in `.env` (default `3000`).

---

## Environment Variables

Create a `.env` file in the project root with the following keys:

```dotenv
# Database URL (Postgres/MySQL/SQLite)
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname?schema=public"

# JWT secrets
ACCESS_TOKEN_SECRET="your_jwt_access_secret"
REFRESH_TOKEN_SECRET="your_jwt_refresh_secret"

# Server port
PORT=3000
```

---

## How It Works

1. **Database Connection**: `config/db.js` initializes and exports a Prisma client using `DATABASE_URL`.
2. **Express App**: `server.js` sets up Express, parses JSON, mounts auth routes under `/api/auth`, and starts listening.
3. **Routes**: Defined in `routes/authRoutes.js`. All endpoints are prefixed with `/api/auth`.
4. **Controllers**: Business logic in `controllers/authController.js`:
   - `register()` & `registerAdmin()`: Create user records with hashed passwords.
   - `login()`: Authenticate credentials, issue access & refresh tokens.
   - `refreshToken()`: Validate and rotate refresh tokens.
   - `logout()`: Invalidate a refresh token.
   - `enable2FA()`: Generate TOTP secret and QR code URL.
   - `verify2FA()`: Validate TOTP codes.
   - `checkToken()`: Verify access token validity.
5. **Middleware**: `middleware/authMiddleware.js` exposes `authenticateToken()` to protect routes by verifying JWT access tokens.
6. **2FA Flow (optional)**:
   - User calls `/enable-2fa` to receive a TOTP secret and QR code URL.
   - User scans QR code with authenticator app.
   - On login or protected action, user provides TOTP code to `/verify-2fa`.

---

## Routes & Endpoints

Base URL: `http://localhost:{PORT}/api/auth`

### Public Endpoints

| Method | Endpoint           | Description                   |
| ------ | ------------------ | ----------------------------- |
| POST   | `/register`        | Create a new user account.    |
| POST   | `/register-admin`  | Create a new admin account.   |
| POST   | `/login`           | Authenticate & receive tokens |
| POST   | `/refresh-token`   | Refresh access token         |
| POST   | `/logout`          | Logout & invalidate token     |

### Protected Endpoints (require JWT access token)

| Method | Endpoint          | Description                         |
| ------ | ----------------- | ----------------------------------- |
| POST   | `/enable-2fa`     | Generate 2FA secret & QR code URL   |
| POST   | `/verify-2fa`     | Verify provided TOTP code           |
| GET    | `/check-token`    | Validate an access token            |
| GET    | `/profile`        | Get current authenticated user info |

---

## Controllers & Middleware

- **`authController.js`**: Implements logic for all auth flows.
- **`authMiddleware.js`**: Exports `authenticateToken(req, res, next)` to guard protected routes.

---

## Prisma Schema & Migrations

- **`prisma/schema.prisma`**: Defines `User` model with fields for email, password, role, 2FA secret, and refresh tokens.
- **`prisma/migrations/`**: SQL migration scripts generated by `prisma migrate dev`.

---

## Error Handling

- Express default error handler returns status `500` with error message for uncaught exceptions.
- Controllers return appropriate `4xx` codes (e.g., `400` for bad requests, `401` for unauthorized).

---

## License

MIT © 2025
