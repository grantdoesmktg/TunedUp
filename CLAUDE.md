# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TunedUp is a collection of automotive widgets built with React that can be embedded into websites via iframes. The project uses a single Vercel deployment with multiple routes to serve different widgets. Currently includes:

- **Performance Calculator**: An automotive performance estimation widget that uses Google's Gemini 2.5 Pro to analyze car modifications and predict performance metrics including horsepower, wheel horsepower (WHP), and 0-60 mph times.

## Development Commands

- **Start development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`
- **Install dependencies**: `npm install`

## Environment Setup

The application requires a Gemini API key to function:
- Set `GEMINI_API_KEY` in `.env.local` for local development
- **IMPORTANT**: Always sync local environment variables with Vercel production
  - Run `vercel env pull .env.vercel` to get latest Vercel environment variables
  - Replace `.env.local` with `.env.vercel` contents to ensure local matches production
  - Update `.env` file with the `DATABASE_URL` from Vercel for Prisma Studio to work correctly
- The application uses Gemini 2.5 Pro model exclusively (no OpenAI)

## Project Structure

### Root Level
- **src/App.tsx**: Main router component managing routes to different widgets
- **src/main.tsx**: Application entry point
- **src/index.css**: Global styles
- **index.html**: HTML template with Tailwind CSS and importmap
- **package.json**: Shared dependencies for all widgets
- **vite.config.ts**: Build configuration

### Widget Structure
Each widget lives in its own folder:
```
/
├── src/                    # Root application
│   ├── App.tsx            # Router component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── performance-calculator/ # Performance Calculator widget
│   ├── App.tsx            # Widget main component
│   ├── components/        # Widget-specific components
│   ├── services/          # API services
│   ├── types.ts           # Widget type definitions
│   └── constants.ts       # Widget constants
└── [future-widgets]/      # Additional widgets will be added here
```

## Performance Calculator Widget

### Core Architecture
- **App.tsx**: Main widget component managing routing, state, and data persistence
- **types.ts**: Type definitions for CarInput, AIResponse, User, and Build interfaces
- **constants.ts**: Application constants including dropdown options and car facts

### Key Components
- **Header.tsx**: Navigation and user authentication
- **InputForm.tsx**: Car specification and modification input form
- **ResultsDisplay.tsx**: AI performance estimation results
- **Profile.tsx**: User profile and saved builds management
- **LoadingScreen.tsx**: Loading state with random car facts

### Services
- **openaiService.ts**: Gemini API integration for performance estimation (note: legacy filename)
  - Creates detailed prompts for AI analysis
  - Handles JSON parsing and error handling
  - Uses structured JSON response format for reliable parsing
  - Actual backend API is in `/api/performance.ts` which calls Gemini 2.5 Pro

### Data Management
- Uses localStorage for data persistence (user profiles, saved builds, preferences)
- No backend database - all data stored client-side
- User data keyed by email address for multi-user support

### State Management
- React useState for component state
- useEffect for data persistence and loading
- Props drilling for component communication

### Styling
- Tailwind CSS with custom color variables
- Responsive design patterns
- Custom CSS classes for consistent theming

## Key Features

### Performance Estimation
- Multi-step AI analysis process:
  1. Baseline stock performance lookup
  2. Modification impact analysis
  3. Advanced 0-60 estimation with power-to-weight ratios
  4. Confidence scoring
- Supports various drivetrain, transmission, tire, fuel, and launch configurations

### User Management
- Profile creation and editing
- Build saving and loading
- Personal "What's Next" notes
- Profile picture and banner image support with cropping

### Build Management
- Save car configurations with AI results
- Load and modify previous builds
- Delete builds with confirmation
- Build history tracking

## Deployment Architecture

### Single Build, Multi-Route
- One Vercel deployment serves all widgets
- React Router handles routing between widgets
- Each widget accessible at `/widget-name` route
- Widgets can be embedded via iframe using their specific route URLs

### Widget Embedding
Widgets are designed to be embedded in iframes on external sites:
```html
<iframe src="https://your-deployment.vercel.app/performance-calculator" 
        width="100%" height="800px" frameborder="0">
</iframe>
```

## Development Notes

### TypeScript Configuration
- Strict TypeScript with experimental decorators enabled
- Path aliases configured (`@/*` maps to root)
- React JSX transform enabled
- Node types included for environment variable access

### API Integration
- Uses Google Generative AI SDK for Gemini 2.5 Pro model
- JSON response parsing with structured output format (`responseMimeType: "application/json"`)
- Backend API endpoints handle all AI calls (no client-side API calls)
- Form validation and submission error handling
- Usage tracking integrated into backend API endpoints (no separate increment endpoint needed)

### Error Handling
- API key validation and user-friendly error messages
- JSON parsing error recovery with structured responses
- Build operations with confirmation dialogs
- Graceful fallbacks for API failures

### Adding New Widgets
1. Create new folder at project root (e.g., `/new-widget/`)
2. Build widget as standalone React component with default export
3. Add route to `src/App.tsx` router
4. Widget will be accessible at `/new-widget` route
5. Ensure widget is self-contained with its own state management

## File Organization

```
/
├── src/                           # Root application
├── performance-calculator/        # Performance Calculator widget
│   ├── components/               # React components
│   │   ├── icons/               # SVG icon components
│   │   └── *.tsx               # Main UI components
│   ├── services/               # External service integrations
│   ├── utils/                  # Utility functions
│   ├── types.ts               # TypeScript type definitions
│   ├── constants.ts           # Application constants
│   └── App.tsx               # Widget main component
├── index.html                # HTML template
├── package.json             # Shared dependencies
└── vite.config.ts          # Build configuration
```

The architecture supports multiple independent widgets within a single deployment, making it cost-effective and easy to manage while allowing each widget to be embedded separately on external websites.