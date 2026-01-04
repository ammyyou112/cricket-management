# Cricket Management System

A comprehensive web application for managing cricket tournaments, teams, matches, and player statistics. Built with modern web technologies and featuring role-based access control for Players, Captains, and Administrators.

## 🎯 Project Overview

This Cricket Management System provides a complete solution for organizing and managing cricket tournaments. It includes features for team management, match scheduling, live scoring, player statistics, and tournament administration. The system supports real-time updates and provides different interfaces based on user roles.

**Project URL**: [Lovable Project](https://lovable.dev/projects/5e6a541b-5c18-4a4a-b6e5-e4e589167b9b)

## 🛠️ Tech Stack

### Frontend
- **Vite** - Fast build tool and development server
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn-ui** - High-quality React components
- **Zustand** - Lightweight state management
- **React Query (TanStack Query)** - Server state management and data fetching
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Recharts** - Data visualization
- **Lucide React** - Icon library

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe JavaScript
- **Prisma** - Next-generation ORM for database access
- **PostgreSQL** - Relational database (hosted on Supabase)
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcryptjs** - Password hashing
- **Socket.io** - Real-time WebSocket communication
- **Zod** - Schema validation
- **Multer** - File upload handling
- **Winston** - Logging
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting
- **Google Gemini AI** - AI-powered performance analytics

### Database
- **PostgreSQL** - Primary database (via Supabase)
- **Supabase Storage** - File storage for profile pictures and team logos

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 🆕 Latest Developments

### AI Performance Analytics (January 2025)
- **Google Gemini Integration** - AI-powered player performance analysis
- **Auto-Detection** - Automatically detects available Gemini models
- **Intelligent Fallback** - Provides data-driven analysis when AI is unavailable
- **Randomized Insights** - Unique, varied suggestions on each refresh
- **Trend Analysis** - Automatic detection of performance trends (Improving/Declining/Stable)
- **Personalized Recommendations** - Context-aware suggestions based on player type and match history

### Enhanced Registration System
- **Test Email Validation** - Blocks test/fake email patterns during new registrations
- **Backward Compatibility** - Existing test users can continue logging in
- **Improved Error Display** - Clear, visible error messages on registration form
- **Better UX** - Auto-scroll to errors and enhanced error styling

### Configuration Improvements
- **Port Standardization** - Unified port configuration (3000) across frontend and backend
- **CORS Updates** - Improved cross-origin resource sharing configuration
- **Error Handling** - Enhanced error extraction and display throughout the application

## ✨ Features

### 🔐 Authentication & User Management

#### User Registration & Login
- **Email/Password Authentication** - Secure user authentication via JWT tokens
- **Role Selection** - Users can register as Player or Team Admin (Captain)
- **Test Email Validation** - Blocks test/fake email addresses during registration
- **Existing User Support** - Existing test users can continue logging in
- **Clear Error Messages** - User-friendly error display on registration form
- **Profile Creation** - Automatic profile creation upon registration
- **Profile Picture Upload** - Upload and manage profile pictures via backend API (Supabase Storage)
- **Session Management** - JWT-based authentication with refresh tokens
- **Protected Routes** - Role-based route protection with middleware

#### User Roles
- **Player** - Can join teams, view matches, track personal statistics
- **Captain** - Can manage teams, invite players, control match scoring
- **Admin** - Full system access including tournament and user management

### 👤 Player Features

#### Player Dashboard
- Overview of upcoming matches
- Recent match history
- Performance statistics summary
- Quick access to teams and tournaments

#### Player Profile Management
- **Profile View** - View and edit personal information
- **Profile Picture** - Upload and update profile picture
- **Player Type** - Set specialization (Batsman, Bowler, All-rounder, Wicket-keeper)
- **Contact Information** - Manage phone number and other details

#### Team Management (Player)
- **Available Teams** - Browse and search teams looking for players
- **Join Requests** - Send requests to join teams
- **My Teams** - View all teams the player is a member of
- **Team Details** - View team information, members, and statistics

#### Match & Statistics
- **Match History** - View all matches the player has participated in
- **Performance Stats** - Detailed statistics including:
  - Runs scored
  - Wickets taken
  - Catches
  - Match-by-match performance
  - Aggregated statistics
- **Recent Form** - Last N matches performance analysis

#### AI Performance Analytics 🤖
- **AI-Powered Insights** - Get personalized performance analysis using Google Gemini AI
- **Performance Trends** - Automatic trend detection (Improving, Declining, Stable)
- **Personalized Recommendations** - AI-generated suggestions based on match history
- **Smart Fallback** - Intelligent analysis even when AI is unavailable
- **Varied Insights** - Unique, randomized suggestions on each refresh
- **Minimum Match Requirement** - Analysis available after 3+ matches played
- **Motivational Messages** - Encouraging messages for players with fewer matches

### 👨‍✈️ Captain Features

#### Captain Dashboard
- Team overview and quick stats
- Pending player requests
- Upcoming matches
- Team performance metrics

#### Team Management
- **Create Team** - Create new cricket teams
- **Team Details** - Manage team information, logo, and description
- **Squad Management** - View and manage team members
- **Update Team Info** - Edit team details and settings
- **Delete Team** - Remove teams (with proper authorization)

#### Player Management
- **Player Requests** - View and manage join requests from players
- **Approve/Reject Requests** - Accept or decline player join requests
- **Invite Players** - Actively invite players to join the team
- **Remove Players** - Remove players from the team
- **Temporary Hires** - Hire temporary players for specific matches

#### Match Control
- **Match Control Dashboard** - Day-of-match management interface
- **Request Scoring Permission** - Request permission to score a match
- **Approve Scoring** - Approve scoring requests from opposing captain
- **Live Scoring** - Real-time match scoring interface
- **Match Status Updates** - Update match status (scheduled → live → completed)

#### Team Statistics
- Team performance analytics
- Win/loss records
- Team batting and bowling statistics
- Tournament standings

### 👨‍💼 Admin Features

#### Admin Dashboard
- System overview and statistics
- Active tournaments count
- Live matches monitoring
- User management overview
- Recent activity feed

#### Tournament Management
- **Create Tournament** - Set up new tournaments with:
  - Tournament name
  - Start and end dates
  - Status management (upcoming, ongoing, completed)
- **Manage Tournaments** - View, edit, and delete tournaments
- **Tournament Details** - View complete tournament information
- **Tournament Matches** - View all matches in a tournament
- **Tournament Standings** - Calculate and display team standings

#### Match Management
- **Schedule Matches** - Create and schedule matches:
  - Select tournament
  - Choose teams (Team A and Team B)
  - Set venue and match date/time
  - Configure match settings
- **Match Monitoring** - Monitor all active and scheduled matches
- **Match Status Management** - Update match statuses
- **Match Details** - View comprehensive match information

#### User Management
- **View All Users** - Browse all registered users
- **User Roles** - View and manage user roles
- **User Profiles** - Access user profile information
- **User Statistics** - View user activity and statistics

### 🏆 Tournament & Match Features

#### Tournament View
- **Public Tournament Pages** - View tournament details (accessible to all)
- **Tournament Schedule** - Complete match schedule
- **Standings Table** - Team rankings and points
- **Tournament Statistics** - Overall tournament stats

#### Match Features
- **Match Details** - Comprehensive match information
- **Team Information** - View both teams' details
- **Live Scoring** - Real-time score updates
- **Match Status** - Track match progress (scheduled, live, completed)
- **Score History** - View complete scoring history
- **Winner Declaration** - Mark match winner upon completion

#### Live Scoring System
- **Real-time Updates** - Live score updates via Supabase real-time subscriptions
- **Batting Team Scores** - Track runs, wickets, overs
- **Extras Tracking** - Record extras (wides, no-balls, byes, leg-byes)
- **Score Approval** - Dual-captain approval system for score accuracy
- **Score History** - Complete scoring timeline

### 📊 Statistics & Analytics

#### Player Statistics
- **Individual Stats** - Runs, wickets, catches per match
- **Aggregated Stats** - Career totals and averages
- **Match History** - Complete match participation history
- **Performance Trends** - Visual charts and graphs
- **Recent Form** - Last N matches analysis

#### Team Statistics
- **Team Performance** - Win/loss records
- **Batting Stats** - Total runs, average scores
- **Bowling Stats** - Wickets taken, economy rates
- **Tournament Performance** - Performance in specific tournaments

#### Leaderboards
- **Top Run Scorers** - Leaderboard by runs scored
- **Top Wicket Takers** - Leaderboard by wickets
- **Most Matches** - Players with most appearances
- **Tournament Leaders** - Tournament-specific leaderboards

### 🔄 Real-time Features

#### Real-time Features
- **Live Score Updates** - Real-time match score updates via Socket.io WebSocket
- **Match Status Changes** - Instant notifications on match status updates
- **Join Request Notifications** - Real-time notifications for new join requests
- **Team Updates** - Live updates on team member changes
- **WebSocket Server** - Persistent connections for real-time communication

### 🎨 UI/UX Features

#### Shared Components
- **Dashboard Layout** - Consistent layout with sidebar navigation
- **Protected Routes** - Role-based route protection
- **Loading States** - Skeleton loaders and loading spinners
- **Error Boundaries** - Graceful error handling
- **Empty States** - User-friendly empty state messages
- **Search Functionality** - Search bars for teams, players, tournaments
- **Image Upload** - Profile picture and team logo uploads
- **Responsive Design** - Mobile-friendly interface

#### Navigation
- **Role-based Navigation** - Different navigation menus per role
- **Sidebar Navigation** - Collapsible sidebar with role-specific menu items
- **Breadcrumbs** - Navigation breadcrumbs for better UX
- **Quick Actions** - Quick access buttons for common actions

## 📁 Project Structure

```
cricket-management/
├── backend/              # Backend API server
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   │   ├── app.ts          # Express app setup
│   │   │   ├── constants.ts   # App constants
│   │   │   ├── cors.ts         # CORS configuration
│   │   │   └── database.ts     # Prisma client
│   │   ├── controllers/ # Route controllers
│   │   │   ├── auth.controller.ts
│   │   │   ├── matches.controller.ts
│   │   │   ├── stats.controller.ts
│   │   │   ├── teams.controller.ts
│   │   │   ├── tournaments.controller.ts
│   │   │   ├── upload.controller.ts
│   │   │   └── users.controller.ts
│   │   ├── middleware/  # Express middleware
│   │   │   ├── auth.middleware.ts      # JWT authentication
│   │   │   ├── error.middleware.ts     # Error handling
│   │   │   ├── rateLimit.middleware.ts # Rate limiting
│   │   │   ├── upload.middleware.ts    # File upload
│   │   │   └── validation.middleware.ts # Request validation
│   │   ├── routes/      # API routes
│   │   │   ├── index.ts              # Main router
│   │   │   ├── ai.routes.ts          # AI analytics routes
│   │   │   ├── auth.routes.ts
│   │   │   ├── matches.routes.ts
│   │   │   ├── stats.routes.ts
│   │   │   ├── teams.routes.ts
│   │   │   ├── tournaments.routes.ts
│   │   │   ├── upload.routes.ts
│   │   │   └── users.routes.ts
│   │   ├── services/    # Business logic
│   │   │   ├── ai.service.ts          # AI performance analytics service
│   │   │   ├── auth.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── matches.service.ts
│   │   │   ├── stats.service.ts
│   │   │   ├── storage.service.ts
│   │   │   ├── teams.service.ts
│   │   │   ├── tournaments.service.ts
│   │   │   └── users.service.ts
│   │   ├── types/       # TypeScript types
│   │   │   ├── api.types.ts
│   │   │   ├── auth.types.ts
│   │   │   ├── express.d.ts
│   │   │   ├── index.ts
│   │   │   └── user.types.ts
│   │   ├── utils/       # Utility functions
│   │   │   ├── errors.ts
│   │   │   ├── helpers.ts
│   │   │   ├── jwt.ts
│   │   │   ├── logger.ts
│   │   │   ├── password.ts
│   │   │   └── response.ts
│   │   ├── validators/  # Zod validation schemas
│   │   │   ├── auth.validator.ts
│   │   │   ├── match.validator.ts
│   │   │   ├── team.validator.ts
│   │   │   ├── tournament.validator.ts
│   │   │   └── user.validator.ts
│   │   ├── websocket/   # WebSocket/Socket.io
│   │   │   ├── handlers/
│   │   │   ├── middleware/
│   │   │   └── index.ts
│   │   └── server.ts    # Server entry point
│   ├── prisma/
│   │   ├── migrations/  # Database migrations
│   │   ├── schema.prisma # Prisma schema
│   │   └── seed.ts      # Database seed script
│   ├── tests/           # Test files
│   │   ├── e2e/
│   │   ├── integration/
│   │   └── unit/
│   ├── uploads/          # Local file uploads (dev)
│   ├── logs/             # Application logs
│   ├── package.json
│   ├── tsconfig.json
│   └── nodemon.json
├── docs/                 # Documentation
│   └── backend/
│       ├── API.md
│       ├── DATABASE.md
│       └── SETUP.md
├── public/               # Static assets
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/                  # Frontend source code
│   ├── components/       # React components
│   │   ├── admin/       # Admin-specific components
│   │   ├── auth/        # Authentication components
│   │   ├── captain/     # Captain-specific components
│   │   ├── layout/      # Layout components (Navbar, Sidebar, Footer)
│   │   ├── match/       # Match-related components
│   │   ├── player/      # Player-specific components
│   │   ├── shared/      # Shared/reusable components
│   │   ├── tournament/  # Tournament components
│   │   └── ui/          # shadcn-ui components
│   ├── contexts/        # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useMatch.ts
│   │   ├── usePlayer.ts
│   │   ├── useRealtime.ts
│   │   └── useTeam.ts
│   ├── lib/             # Utility libraries
│   │   ├── api/         # API functions
│   │   │   ├── auth.ts
│   │   │   ├── matches.ts
│   │   │   ├── players.ts
│   │   │   ├── stats.ts
│   │   │   ├── teams.ts
│   │   │   └── tournaments.ts
│   │   ├── apiClient.ts # Backend API client
│   │   └── utils.ts     # Utility functions
│   ├── pages/           # Page components
│   │   ├── admin/       # Admin pages
│   │   ├── captain/     # Captain pages
│   │   ├── player/      # Player pages
│   │   ├── public/      # Public pages (Home, Login, Register)
│   │   └── shared/      # Shared pages (TournamentView, PlayerProfileView)
│   ├── routes/           # Route configuration
│   │   └── index.tsx
│   ├── store/            # Zustand stores
│   │   ├── authStore.ts
│   │   ├── matchStore.ts
│   │   ├── playerStore.ts
│   │   └── teamStore.ts
│   ├── types/            # TypeScript type definitions
│   │   ├── auth.types.ts
│   │   ├── database.types.ts
│   │   └── forms.types.ts
│   ├── App.tsx           # Main App component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── supabase/             # Supabase configuration
│   ├── migrations/       # Supabase migrations
│   ├── functions/        # Supabase Edge Functions
│   └── config.toml       # Supabase config
├── .gitignore
├── components.json       # shadcn-ui configuration
├── eslint.config.js     # ESLint configuration
├── index.html           # HTML template
├── package.json        # Frontend dependencies and scripts
├── postcss.config.js   # PostCSS configuration
├── tailwind.config.ts  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite configuration
```

## 🔧 Backend API

The backend API is built with Express.js and follows RESTful conventions. All endpoints are prefixed with `/api/v1`.

> **Note**: The project is migrating from direct Supabase client usage to a dedicated backend API. The frontend now uses the backend API client (`lib/apiClient.ts`) for all database operations. Legacy Supabase functions are deprecated.

### Base URL
- **Development**: `http://localhost:3000/api/v1`
- **Production**: Configure via `VITE_API_BASE_URL` environment variable

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### API Endpoints

#### Authentication Routes (`/api/v1/auth`)
- `POST /register` - User registration
- `POST /login` - User login (returns JWT token)
- `POST /logout` - User logout
- `POST /refresh` - Refresh access token

#### Users Routes (`/api/v1/users`)
- `GET /users` - Get all users (admin only)
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user profile
- `DELETE /users/:id` - Delete user (admin only)

#### Teams Routes (`/api/v1/teams`)
- `GET /teams` - Get all teams
- `POST /teams` - Create new team
- `GET /teams/:id` - Get team details
- `PATCH /teams/:id` - Update team
- `DELETE /teams/:id` - Delete team

#### Matches Routes (`/api/v1/matches`)
- `GET /matches` - Get all matches
- `POST /matches` - Create new match (admin only)
- `GET /matches/:id` - Get match details
- `PATCH /matches/:id` - Update match
- `DELETE /matches/:id` - Delete match (admin only)

#### Tournaments Routes (`/api/v1/tournaments`)
- `GET /tournaments` - Get all tournaments
- `POST /tournaments` - Create tournament (admin only)
- `GET /tournaments/:id` - Get tournament details
- `PATCH /tournaments/:id` - Update tournament
- `DELETE /tournaments/:id` - Delete tournament (admin only)

#### Statistics Routes (`/api/v1/stats`)
- `GET /stats/players/:id` - Get player statistics
- `GET /stats/teams/:id` - Get team statistics
- `GET /stats/tournaments/:id` - Get tournament statistics
- `GET /stats/leaderboard` - Get leaderboard data

#### AI Analytics Routes (`/api/v1/ai`)
- `GET /ai/player-analysis/:playerId` - Get AI-powered performance analysis
  - Requires minimum 3 matches played
  - Returns trend, summary, and personalized suggestions
  - Uses Google Gemini AI with intelligent fallback

#### Upload Routes (`/api/v1/upload`)
- `POST /upload/profile` - Upload profile picture
- `POST /upload/team-logo` - Upload team logo

### Frontend API Functions

The frontend uses an API client (`lib/apiClient.ts`) to communicate with the backend. Legacy Supabase functions are deprecated in favor of backend API calls.

#### Authentication API (`lib/api/auth.ts`)

#### `signUp(data)`
- Creates a new user account in Supabase Auth
- Creates user profile in the database
- Supports role selection (player, captain)
- Returns created user profile

#### `signIn(credentials)`
- Authenticates user with email and password
- Fetches complete user profile from database
- Returns user profile with role information

#### `signOut()`
- Signs out the current user
- Clears authentication session

#### `getCurrentUser()`
- Retrieves currently authenticated user
- Fetches full profile from database
- Returns user profile or null if not authenticated

#### `uploadProfilePicture(userId, file)`
- Uploads profile picture to Supabase Storage
- Stores in 'avatars' bucket
- Returns public URL of uploaded image

#### `updateProfile(userId, data)`
- Updates user profile information
- Supports partial updates
- Returns updated user profile

### Teams API (`lib/api/teams.ts`)

#### `createTeam(teamData, captainId)`
- Creates a new cricket team
- Sets the creator as team captain
- Returns created team object

#### `getTeamDetails(teamId)`
- Fetches complete team information
- Includes captain details via join
- Returns team with captain information

#### `getTeamMembers(teamId)`
- Retrieves all active team members
- Includes player profile information
- Returns array of team members with player data

#### `updateTeam(teamId, data)`
- Updates team information
- Supports partial updates
- Returns updated team object

#### `deleteTeam(teamId)`
- Deletes a team from the database
- Requires proper authorization

#### `getAvailableTeams()`
- Fetches all teams in the system
- Ordered by creation date
- Returns array of teams

#### `getMyTeams(playerId)`
- Gets all teams a player has joined
- Filters by active status
- Returns array of teams

#### `sendJoinRequest(playerId, teamId)`
- Sends a join request to a team
- Creates pending team member record
- Returns team member record

#### `approveJoinRequest(requestId, captainId)`
- Approves a player's join request
- Updates status from 'pending' to 'active'
- Returns updated team member record

#### `rejectJoinRequest(requestId, captainId)`
- Rejects a player's join request
- Deletes the pending request record

#### `invitePlayer(captainId, playerId, teamId)`
- Sends an invitation to a player
- Creates 'invited' status team member record
- Returns team member record

#### `removePlayerFromTeam(teamId, playerId)`
- Removes a player from a team
- Deletes team member record

#### `getTeamRequests(teamId)`
- Fetches all pending join requests for a team
- Includes player information
- Returns array of requests with player data

#### `hireTemporaryPlayer(teamId, playerId, matchId)`
- Hires a temporary player for a specific match
- Creates temporary team member record
- Returns team member record

### Matches API (`lib/api/matches.ts`)

#### `createMatch(matchData, adminId)`
- Creates a new match
- Links to tournament and teams
- Returns created match object

#### `getMatch(matchId)`
- Fetches complete match details
- Includes team A and team B information
- Includes tournament information
- Returns match with related data

#### `getMatchesByTournament(tournamentId)`
- Gets all matches in a tournament
- Ordered by match date
- Returns array of matches

#### `getUpcomingMatches()`
- Fetches scheduled matches
- Includes team information
- Limited to next 10 matches
- Returns array of upcoming matches

#### `getLiveMatches()`
- Gets all currently live matches
- Includes team logos and names
- Returns array of live matches

#### `updateMatchStatus(matchId, status)`
- Updates match status (scheduled/live/completed)
- Returns updated match object

#### `requestScoring(matchId, captainId)`
- Requests scoring permission for a match
- Sets scoring captain ID
- Returns updated match

#### `approveScoring(matchId, approvingCaptainId)`
- Approves scoring request
- Sets approved by captain ID
- Returns updated match

#### `submitMatchScore(matchId, scoreData)`
- Submits initial or final match score
- Creates match score record
- Returns match score object

#### `getMatchScore(matchId)`
- Retrieves match score information
- Returns array of match scores

#### `updateLiveScore(matchId, scoreData)`
- Updates live match score
- Updates existing score record
- Returns updated match score

#### `completeMatch(matchId, winnerTeamId)`
- Marks match as completed
- Sets winner team ID
- Returns updated match

### Players API (`lib/api/players.ts`)

#### `getPlayerProfile(userId)`
- Fetches player profile by user ID
- Returns complete user profile

#### `updatePlayerProfile(userId, data)`
- Updates player profile information
- Supports partial updates
- Returns updated profile

#### `getPlayerStats(userId)`
- Retrieves player statistics
- Includes match information
- Returns array of player stats records

#### `getPlayerMatchHistory(userId)`
- Gets match history for a player
- Includes match details and performance
- Ordered by match date (newest first)
- Returns match history with stats

#### `getAllPlayers()`
- Fetches all registered players
- Filtered by role 'player'
- Ordered alphabetically
- Returns array of players

#### `searchPlayers(query)`
- Searches players by name
- Case-insensitive search
- Limited to 10 results
- Returns matching players

### Tournaments API (`lib/api/tournaments.ts`)

#### `createTournament(tournamentData, adminId)`
- Creates a new tournament
- Sets creator as admin
- Returns created tournament

#### `getTournaments(status?)`
- Fetches all tournaments
- Optional status filter
- Ordered by start date
- Returns array of tournaments

#### `getTournamentDetails(tournamentId)`
- Gets specific tournament information
- Returns tournament object

#### `updateTournament(tournamentId, data)`
- Updates tournament information
- Supports partial updates
- Returns updated tournament

#### `deleteTournament(tournamentId)`
- Deletes a tournament
- Requires admin authorization

#### `getTournamentMatches(tournamentId)`
- Gets all matches in a tournament
- Includes team information
- Ordered by match date
- Returns array of matches

#### `getTournamentStandings(tournamentId)`
- Calculates tournament standings
- Based on completed matches
- Returns standings data

### Statistics API (`lib/api/stats.ts`)

#### `getPlayerStats(playerId)`
- Retrieves aggregated player statistics
- Returns array of player stats records

#### `getTeamStats(teamId)`
- Gets team performance statistics
- Based on match scores
- Returns team stats data

#### `getTournamentStats(tournamentId)`
- Fetches tournament-wide statistics
- Includes total runs, wickets, etc.
- Returns tournament stats

#### `getLeaderboard(type)`
- Gets leaderboard by type (runs/wickets/matches)
- Returns top performers
- Supports different leaderboard types

#### `getPlayerForm(playerId, lastNMatches)`
- Gets recent form for a player
- Last N matches performance
- Includes match details
- Returns form data

## 🎣 Custom Hooks

### Authentication Hooks

#### `useAuth()`
- Provides authentication state and methods
- Returns: `{ user, role, isAuthenticated, isLoading, error, login, register, logout, updateProfile }`
- Handles login, registration, logout, and profile updates
- Manages authentication state via Zustand store

### Player Hooks

#### `usePlayerProfile(userId)`
- Fetches player profile data
- Uses React Query for caching
- Returns profile data with loading/error states

#### `usePlayerStats(userId)`
- Retrieves player statistics
- Cached with React Query
- Returns stats array with loading state

#### `useMatchHistory(userId)`
- Gets player's match history
- Includes match details and performance
- Returns match history data

#### `useUpdateProfile()`
- Mutation hook for updating profile
- Invalidates related queries on success
- Returns mutation object with mutate function

### Team Hooks

#### `useMyTeams(playerId)`
- Fetches teams a player has joined
- Returns teams array with loading state

#### `useTeamDetails(teamId)`
- Gets complete team information
- Includes captain details
- Returns team object

#### `useAvailableTeams()`
- Fetches all available teams
- Returns teams array

#### `useTeamMembers(teamId)`
- Gets team members for a team
- Includes player information
- Returns members array

#### `useJoinRequests(teamId)`
- Fetches pending join requests
- Returns requests array with player data

#### `useCreateTeam()`
- Mutation hook for creating teams
- Invalidates teams queries on success
- Returns mutation object

#### `useSendJoinRequest()`
- Mutation hook for sending join requests
- Returns mutation object

#### `useApproveRequest()`
- Mutation hook for approving requests
- Invalidates requests and members queries
- Returns mutation object

### Match Hooks

#### `useUpcomingMatches()`
- Fetches scheduled matches
- Returns matches array

#### `useLiveMatches()`
- Gets live matches
- Auto-refetches every 30 seconds
- Returns live matches array

#### `useMatchDetails(matchId)`
- Fetches complete match information
- Returns match object with related data

#### `useMatchScore(matchId)`
- Gets match score
- Auto-refetches every 10 seconds for live updates
- Returns score data

#### `useCreateMatch()`
- Mutation hook for creating matches
- Invalidates upcoming matches query
- Returns mutation object

#### `useRequestScoring()`
- Mutation hook for requesting scoring permission
- Invalidates match query
- Returns mutation object

#### `useApproveScoring()`
- Mutation hook for approving scoring
- Invalidates match query
- Returns mutation object

#### `useUpdateScore()`
- Mutation hook for updating live score
- Invalidates match score query
- Returns mutation object

### Real-time Hooks

#### `useRealtimeMatchScore(matchId)`
- Subscribes to live score updates via Socket.io
- Auto-updates React Query cache
- WebSocket connection to backend server

#### `useRealtimeMatchStatus(matchId)`
- Subscribes to match status changes via Socket.io
- Invalidates match queries on status update
- Real-time status notifications

#### `useRealtimeJoinRequests(teamId)`
- Subscribes to new join requests via Socket.io
- Real-time notifications for captains
- Auto-updates requests list

## 🗄️ Database Schema Overview

The database uses PostgreSQL and is managed through Prisma ORM. The schema is defined in `backend/prisma/schema.prisma`.

### Core Tables

#### `users`
- User profiles and authentication
- **Fields**: 
  - `id` (UUID, Primary Key)
  - `email` (String, Unique)
  - `full_name` (String)
  - `role` (Enum: `player`, `captain`, `admin`)
  - `profile_picture` (String, Optional) - URL to Supabase Storage
  - `phone` (String, Optional)
  - `player_type` (Enum, Optional: `batsman`, `bowler`, `all-rounder`, `wicket-keeper`)
  - `password_hash` (String) - bcrypt hashed password
  - `created_at` (DateTime)
  - `updated_at` (DateTime)
- **Relations**: 
  - One-to-many with `teams` (as captain)
  - One-to-many with `team_members`
  - One-to-many with `player_stats`
  - One-to-many with `tournaments` (as creator)

#### `teams`
- Cricket teams
- **Fields**:
  - `id` (UUID, Primary Key)
  - `team_name` (String)
  - `captain_id` (UUID, Foreign Key → users.id)
  - `logo_url` (String, Optional) - URL to Supabase Storage
  - `description` (String, Optional)
  - `created_at` (DateTime)
  - `updated_at` (DateTime)
- **Relations**:
  - Many-to-one with `users` (captain)
  - One-to-many with `team_members`
  - One-to-many with `matches` (as team_a or team_b)

#### `team_members`
- Team membership and join requests
- **Fields**:
  - `id` (UUID, Primary Key)
  - `team_id` (UUID, Foreign Key → teams.id)
  - `player_id` (UUID, Foreign Key → users.id)
  - `status` (Enum: `active`, `pending`, `invited`)
  - `is_temporary` (Boolean, Default: false)
  - `joined_at` (DateTime)
  - `created_at` (DateTime)
- **Relations**:
  - Many-to-one with `teams`
  - Many-to-one with `users` (player)

#### `tournaments`
- Tournament information
- **Fields**:
  - `id` (UUID, Primary Key)
  - `tournament_name` (String)
  - `start_date` (DateTime)
  - `end_date` (DateTime)
  - `created_by` (UUID, Foreign Key → users.id)
  - `status` (Enum: `upcoming`, `ongoing`, `completed`)
  - `created_at` (DateTime)
  - `updated_at` (DateTime)
- **Relations**:
  - Many-to-one with `users` (creator/admin)
  - One-to-many with `matches`

#### `matches`
- Cricket match information
- **Fields**:
  - `id` (UUID, Primary Key)
  - `tournament_id` (UUID, Foreign Key → tournaments.id)
  - `team_a_id` (UUID, Foreign Key → teams.id)
  - `team_b_id` (UUID, Foreign Key → teams.id)
  - `venue` (String)
  - `match_date` (DateTime)
  - `scoring_captain_id` (UUID, Foreign Key → users.id, Optional)
  - `approved_by_captain_id` (UUID, Foreign Key → users.id, Optional)
  - `status` (Enum: `scheduled`, `live`, `completed`)
  - `winner_team_id` (UUID, Foreign Key → teams.id, Optional)
  - `created_at` (DateTime)
  - `updated_at` (DateTime)
- **Relations**:
  - Many-to-one with `tournaments`
  - Many-to-one with `teams` (team_a, team_b, winner)
  - Many-to-one with `users` (scoring_captain, approving_captain)
  - One-to-many with `match_scores`
  - One-to-many with `player_stats`

#### `match_scores`
- Match scoring data (real-time score tracking)
- **Fields**:
  - `id` (UUID, Primary Key)
  - `match_id` (UUID, Foreign Key → matches.id)
  - `batting_team_id` (UUID, Foreign Key → teams.id)
  - `total_runs` (Integer)
  - `total_wickets` (Integer)
  - `total_overs` (Decimal)
  - `extras` (Integer) - wides, no-balls, byes, leg-byes
  - `created_at` (DateTime)
  - `updated_at` (DateTime)
- **Relations**:
  - Many-to-one with `matches`
  - Many-to-one with `teams` (batting team)

#### `player_stats`
- Individual player match statistics
- **Fields**:
  - `id` (UUID, Primary Key)
  - `player_id` (UUID, Foreign Key → users.id)
  - `match_id` (UUID, Foreign Key → matches.id)
  - `runs_scored` (Integer, Default: 0)
  - `wickets_taken` (Integer, Default: 0)
  - `catches` (Integer, Default: 0)
  - `created_at` (DateTime)
  - `updated_at` (DateTime)
- **Relations**:
  - Many-to-one with `users` (player)
  - Many-to-one with `matches`

### Database Management

- **ORM**: Prisma
- **Migrations**: Managed via Prisma Migrate
- **Studio**: Access database GUI with `npm run prisma:studio` in backend directory
- **Connection**: PostgreSQL database hosted on Supabase

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** or **bun** package manager
- **Supabase Account** - For PostgreSQL database and file storage
- **PostgreSQL** - Database (provided by Supabase)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ammyyou112/cricket-management.git
   cd cricket-management
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Set up Supabase**
   
   - Create a new project at [Supabase](https://app.supabase.com)
   - Get your project URL and anon key from Settings → API
   - Get your database connection string from Settings → Database

5. **Set up environment variables**
   
   **Frontend** - Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   **Backend** - Create a `.env` file in the `backend` directory:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3000
   HOST=localhost
   API_PREFIX=/api/v1
   
   # Database
   DATABASE_URL=your_supabase_postgresql_connection_string
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=30d
   
   # Supabase Storage
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key
   
   # File Upload
   MAX_FILE_SIZE=5242880
   UPLOAD_DIR=./uploads
   ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

6. **Set up the database**
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev
   # Optional: Seed the database
   npm run prisma:seed
   ```

7. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   Backend will run on `http://localhost:3000`

8. **Start the frontend development server**
   ```bash
   # In the root directory
   npm run dev
   # or
   bun run dev
   ```

9. **Open your browser**
   
   Navigate to `http://localhost:5173` (or the port shown in terminal)

### Building for Production

```bash
npm run build
# or
bun run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
# or
bun run preview
```

## 🔒 Environment Variables

### Frontend Environment Variables

Required in root `.env` file:

- `VITE_API_BASE_URL` - Backend API base URL (default: `http://localhost:3000/api/v1`)
- `VITE_SUPABASE_URL` - Your Supabase project URL (for file storage)
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

### Backend Environment Variables

Required in `backend/.env` file:

**Server Configuration:**
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: localhost)
- `API_PREFIX` - API route prefix (default: /api/v1)

**Database:**
- `DATABASE_URL` - PostgreSQL connection string from Supabase

**AI Analytics:**
- `GEMINI_API_KEY` - Google Gemini API key for AI performance analytics (optional)
  - If not provided, system uses intelligent fallback analysis
  - Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

**Authentication:**
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens
- `JWT_EXPIRES_IN` - Access token expiration (default: 7d)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration (default: 30d)

**Supabase Storage:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Supabase service role key (for server-side operations)

**File Upload:**
- `MAX_FILE_SIZE` - Maximum file size in bytes (default: 5MB)
- `UPLOAD_DIR` - Local upload directory
- `ALLOWED_FILE_TYPES` - Comma-separated list of allowed MIME types

**Rate Limiting:**
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window

All Supabase credentials can be obtained from your Supabase project settings.

## 📝 Available Scripts

### Frontend Scripts (Root Directory)

- `npm run dev` - Start frontend development server with hot reload
- `npm run build` - Build frontend for production
- `npm run build:dev` - Build frontend in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint to check code quality

### Backend Scripts (Backend Directory)

- `npm run dev` - Start backend development server with nodemon
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:seed` - Seed the database with sample data

## 🎨 UI Components

This project uses **shadcn-ui** components, which are built on top of Radix UI and styled with Tailwind CSS. All components are located in `src/components/ui/` and can be customized as needed.

Key components include:
- Buttons, Cards, Dialogs
- Forms, Inputs, Selects
- Tables, Tabs, Accordions
- Charts, Progress bars
- Navigation menus, Sidebars
- Toast notifications
- And many more...

## 🔄 State Management

### Frontend State Management

**Zustand Stores:**
- **authStore** - Authentication state (persisted to localStorage)
- **matchStore** - Match-related state
- **playerStore** - Player-related state
- **teamStore** - Team-related state

**React Query (TanStack Query):**
- Server state management via backend API
- Automatic caching and refetching
- Optimistic updates
- Real-time data synchronization via WebSocket

### Backend Architecture

**Layered Architecture:**
- **Routes Layer** - HTTP endpoint definitions
- **Controllers Layer** - Request/response handling
- **Services Layer** - Business logic and data processing
- **Database Layer** - Prisma ORM for database operations

**Middleware Stack:**
- **Authentication** - JWT token validation
- **Authorization** - Role-based access control
- **Validation** - Request data validation with Zod
- **Error Handling** - Centralized error handling
- **Rate Limiting** - API rate limiting
- **CORS** - Cross-origin resource sharing
- **Security** - Helmet.js for security headers

**Real-time Communication:**
- **Socket.io** - WebSocket server for real-time updates
- **Event Handlers** - Match score updates, notifications
- **Room Management** - Per-match WebSocket rooms

## 🛡️ Route Protection

Routes are protected based on user roles:

- **Public Routes**: `/`, `/login`, `/register`
- **Player Routes**: `/player/*` (accessible to players, captains, admins)
- **Captain Routes**: `/captain/*` (accessible to captains and admins)
- **Admin Routes**: `/admin/*` (accessible only to admins)
- **Shared Routes**: `/tournaments/:id`, `/players/:id`, `/match/:id/scorer`

## 🚢 Deployment

### Deploy via Lovable

Simply open [Lovable](https://lovable.dev/projects/5e6a541b-5c18-4a4a-b6e5-e4e589167b9b) and click on **Share → Publish**.

### Custom Domain

To connect a custom domain:
1. Navigate to **Project > Settings > Domains**
2. Click **Connect Domain**
3. Follow the setup instructions

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

### Manual Deployment

**Frontend:**
1. Build the frontend: `npm run build`
2. Deploy the `dist` folder to your hosting service (Vercel, Netlify, etc.)
3. Ensure environment variables are set in your hosting platform

**Backend:**
1. Build the backend: `cd backend && npm run build`
2. Deploy to a Node.js hosting service (Railway, Render, Heroku, etc.)
3. Set up environment variables on your hosting platform
4. Run database migrations: `npx prisma migrate deploy`
5. Ensure the database connection string is configured correctly

## 🤝 Contributing

This is a personal project, but contributions are welcome! Please feel free to fork the repository and submit pull requests.

## 📄 License

This project is open source and available under the MIT License.

## 🔗 Links

- **GitHub Repository**: https://github.com/ammyyou112/cricket-management
- **Lovable Project**: https://lovable.dev/projects/5e6a541b-5c18-4a4a-b6e5-e4e589167b9b
- **Supabase**: https://supabase.com

## 📞 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

Built with ❤️ using modern web technologies
