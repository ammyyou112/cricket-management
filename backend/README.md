# Cricket 360 - Backend API

Node.js + Express + TypeScript + Prisma + PostgreSQL (Supabase)

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.io
- **Validation**: Zod
- **File Upload**: Multer + Supabase Storage

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for PostgreSQL)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials.

### 3. Set Up Database

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Start Development Server

```bash
npm run dev
```

Server will run on http://localhost:3000

## API Endpoints

### Authentication
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/logout
- POST /api/v1/auth/refresh

### Users
- GET /api/v1/users
- GET /api/v1/users/:id
- PATCH /api/v1/users/:id
- DELETE /api/v1/users/:id

### Teams
- GET /api/v1/teams
- POST /api/v1/teams
- GET /api/v1/teams/:id
- PATCH /api/v1/teams/:id
- DELETE /api/v1/teams/:id

(More routes will be added as we build)

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Express middleware
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   ├── validators/     # Zod schemas
│   └── server.ts       # Entry point
├── prisma/
│   └── schema.prisma   # Database schema
└── tests/              # Test files
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run prisma:studio` - Open Prisma Studio

## Environment Variables

See `.env.example` for required environment variables.

## License

MIT

