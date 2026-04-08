# PathFinderAI

An AI-powered career guidance ecosystem for Vinschool students to discover their strengths, explore career paths, and connect with peers for collaborative learning.

## Overview

PathFinderAI is a comprehensive platform designed to help high school students:

- **Discover themselves** through AI-powered quizzes and conversational analysis
- **Explore career paths** with personalized career maps and learning paths
- **Track progress** with activity management and achievement systems
- **Connect with peers** through intelligent matching for collaboration

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Convex (real-time database + serverless functions)
- **Authentication**: Convex Auth with Google OAuth
- **AI Integration**: Google Gemini for conversational AI
- **Deployment**: Vercel (frontend) + Convex Cloud (backend)

## Features

### For Students

- [x] **Quiz System** - Interactive 6-step questionnaire covering interests, strengths, working style, values, and goals
- [x] **AI Chat Assistant** - Real-time AI help during the quiz process
- [x] **Career Map Generation** - Personalized career clusters with learning paths and skill recommendations
- [x] **Activity Explorer** - Browse and save activities, competitions, and opportunities
- [x] **Progress Tracking** - Track saved, in-progress, and completed activities
- [x] **LinkUp Matching** - Find teammates with similar or complementary strengths
- [x] **Achievement System** - Earn achievements for milestones
- [x] **Reflection Journal** - Document learning experiences and growth
- [x] **Quiz Redo** - Retake the quiz to update your profile

### For Counselors

- [x] **Dashboard** - Overview of student engagement and progress
- [x] **Student List** - View individual student profiles and progress
- [x] **Interest Trends** - Analyze aggregate student interests and strengths
- [x] **Career Distribution** - View career cluster popularity
- [x] **Activity Engagement** - Monitor activity participation rates
- [x] **CSV Export** - Export student data for reports

### For Administrators

- [x] **Admin Dashboard** - System-wide analytics
- [x] **User Management** - View and manage user roles
- [x] **Activity Overview** - Monitor activity engagement
- [x] **Audit Log** - Track system activity

## Project Structure

```
PathFinderAIPublic/
├── app/                          # Next.js app directory
│   ├── (auth)/                   # Authentication pages
│   │   └── login/
│   ├── (dashboard)/              # Protected dashboard pages
│   │   ├── activities/
│   │   ├── admin/               # Admin dashboard
│   │   ├── career-map/
│   │   ├── counselor/            # Counselor dashboard
│   │   ├── discover/             # Quiz page
│   │   ├── linkup/               # Peer matching
│   │   ├── progress/
│   │   ├── settings/
│   │   └── dashboard/            # Student home
│   ├── globals.css               # Global styles
│   └── layout.tsx                # Root layout
├── components/                   # Reusable components
│   └── providers/
├── convex/                       # Convex backend
│   ├── _generated/              # Auto-generated types
│   ├── achievements.ts           # Achievement system
│   ├── activities.ts            # Activity management
│   ├── admin.ts                 # Admin functions
│   ├── ai.ts                    # AI integration
│   ├── auth.ts                  # Authentication
│   ├── careerAlgorithm.ts       # Career matching logic
│   ├── careerMap.ts             # Career map storage
│   ├── counselor.ts             # Counselor analytics
│   ├── linkup.ts                # Peer matching
│   ├── quiz.ts                  # Quiz management
│   ├── reflections.ts           # Journal entries
│   ├── savedActivities.ts       # Activity tracking
│   ├── schema.ts                # Database schema
│   ├── security.ts              # Security rules
│   └── users.ts                # User management
├── hooks/                       # Custom React hooks
│   └── useNotifications.ts     # Notification system
├── public/                      # Static assets
├── .env.example                 # Environment variables template
├── convex.json                 # Convex configuration
├── next.config.ts              # Next.js configuration
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Cloud account (for OAuth and Gemini API)
- Convex account (free tier available)

### Environment Setup

1. Clone the repository
2. Copy the environment variables:

```bash
cp .env.example .env.local
```

3. Fill in the required variables:

```env
# Convex
CONVEX_DEPLOYMENT=
CONVEX_DEPLOY_KEY=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Google Gemini AI
GEMINI_API_KEY=
```

### Installation

```bash
npm install
```

### Running Locally

```bash
# Start Convex backend
npx convex dev

# In a new terminal, start Next.js
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Deployment

1. Deploy Convex backend:

```bash
npx convex deploy
```

2. Deploy to Vercel:

```bash
npm run deploy
```

## API Reference

### Convex Functions

#### Authentication (`convex/auth.ts`)
- `getCurrentUser` - Get authenticated user profile

#### Users (`convex/users.ts`)
- `updateProfile` - Update user profile (name, campus, grade)

#### Quiz (`convex/quiz.ts`)
- `getQuizResponses` - Get user's quiz responses
- `saveQuizResponses` - Save quiz responses
- `quizQuestions` - Get quiz question structure

#### Career Map (`convex/careerMap.ts`)
- `generateCareerMap` - Generate career map from quiz responses
- `getCareerMap` - Get user's career map

#### Activities (`convex/activities.ts`)
- `getActivities` - List activities with filters
- `seedActivities` - Seed sample activities

#### LinkUp (`convex/linkup.ts`)
- `getMatches` - Get peer matches (similar or complementary)
- `createIntroRequest` - Send connection request
- `getLinkupProfile` - Get user's LinkUp profile
- `saveOrUpdateProfile` - Update LinkUp profile

#### Achievements (`convex/achievements.ts`)
- `checkAndAwardAchievements` - Check and award achievements
- `getAchievements` - Get user's achievements

#### Counselor (`convex/counselor.ts`)
- `getStudentSummaries` - Get student analytics
- `getInterestTrends` - Get aggregate interest data
- `exportStudentData` - Export CSV data

#### Admin (`convex/admin.ts`)
- `getSystemStats` - Get system-wide statistics
- `getAllUsers` - List all users
- `updateUserRole` - Update user role

## Database Schema

### Users Table
```
- email: string (unique)
- name: string (optional)
- campus: string (optional)
- grade: string (optional)
- role: "student" | "counselor" | "partner" | "admin"
- profileComplete: boolean
- createdAt: number (timestamp)
```

### Quiz Responses Table
```
- userId: id("users")
- responses: {
    interests: string[]
    strengths: string[]
    workingStyle: { teamPreference, planningStyle }
    values: string[]
    goals: string[]
  }
- completedAt: number
- version: number
```

### Career Maps Table
```
- userId: id("users")
- clusters: { name, description, whyItFits }[]
- subjects: { name, priority, reason }[]
- skills: { hard: {...}[], soft: {...}[] }
- learningPaths: { step, title, description, timeframe }[]
- extracurriculars: string[]
- generatedAt: number
- version: number
```

### LinkUp Profiles Table
```
- userId: id("users")
- lookingFor: string
- interests: string[] (optional)
- strengths: string[] (optional)
- projectDescription: string (optional)
- isVisible: boolean
- createdAt: number
- updatedAt: number
```

## Design System

The app uses a retro Y2K-inspired design with:

- **Colors**: Vibrant palette (lime, yellow, pink, blue)
- **Typography**: Bold, uppercase headings
- **Components**: Chunky borders, offset shadows, grid backgrounds
- **Animations**: Subtle hover transforms, progress bars

See `app/globals.css` for the complete design system.

## Security

- Google OAuth authentication (Vinschool email restriction)
- Role-based access control (student, counselor, partner, admin)
- Secure introduction system (no direct contact sharing)
- Data encryption via Convex

## License

MIT License - See LICENSE file for details.

## Team

Built by team MANGOSLIDE for the Vinschool AI for Good project.

## Acknowledgments

- Vercel for hosting and Next.js
- Convex for real-time backend
- Google for OAuth and Gemini AI
