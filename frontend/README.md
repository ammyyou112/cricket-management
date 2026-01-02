# Cricket 360 - Frontend

This is the frontend application for Cricket 360, built with React, TypeScript, Vite, and Tailwind CSS.

## Project Structure

```
frontend/
├── src/              # Source code
│   ├── components/   # React components
│   ├── pages/        # Page components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility libraries and API clients
│   ├── store/        # State management (Zustand)
│   ├── types/        # TypeScript type definitions
│   └── routes/       # Route definitions
├── public/           # Static assets
├── index.html        # HTML entry point
└── [config files]    # Configuration files
```

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm, yarn, or bun package manager

### Installation

```bash
npm install
# or
bun install
```

### Development

```bash
npm run dev
# or
bun run dev
```

The app will be available at `http://localhost:8080`

### Build

```bash
npm run build
# or
bun run build
```

### Preview Production Build

```bash
npm run preview
# or
bun run preview
```

## Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Zustand** - State management
- **React Query** - Data fetching
- **Shadcn UI** - UI components
- **Socket.io Client** - Real-time updates

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Notes

- All API calls are made to the backend server (configured via `VITE_API_BASE_URL`)
- Real-time updates use Socket.io for live match scoring
- Offline support is available via IndexedDB (Dexie)

