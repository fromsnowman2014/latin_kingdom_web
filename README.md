# Latin Kingdom - Tower Defense Learning Game

A web-based tower defense game that teaches Latin vocabulary through engaging gameplay. Players defend their castle while learning Latin words, earning gold for correct translations.

## 🎮 Game Features

- **Tower Defense Gameplay**: 3 tower types (Archer, Magic, Cannon) with upgrade system
- **4 Enemy Types**: Goblins, Orcs, Trolls, and Dragons with increasing difficulty
- **Latin Learning**: Real-time vocabulary input with progressive hint system
- **Adaptive Difficulty**: Wave progression based on learning progress
- **Progress Tracking**: Statistics and mastery levels for educational assessment

## 🚀 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Game Engine**: Phaser.js 3.90+
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Authentication**: Supabase Auth (ready for implementation)

## 📋 Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd latin_kingdom_web
npm install
```

### 2. Environment Configuration

Copy the example environment file:
```bash
cp .env.local.example .env.local
```

Update `.env.local` with your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://nzffupbsltgoywgngyee.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

### 3. Database Setup

Run the SQL schema in your Supabase dashboard:

1. Go to your Supabase project: https://supabase.com/dashboard/project/nzffupbsltgoywgngyee
2. Navigate to SQL Editor
3. Copy and paste the contents of `docs/database-schema.sql`
4. Execute the SQL to create tables and sample data

### 4. Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 🗄️ Database Schema

The application uses the following main tables:

- **assignments**: Vocabulary sets/lessons
- **vocabularies**: Latin words with English meanings and hints
- **game_sessions**: Individual game play records
- **learning_progress**: User progress tracking per word
- **users**: User profiles (extends Supabase auth)

Sample data includes a "6th Grade Defender Week 1" assignment with basic Latin vocabulary.

## 🎯 How to Play

1. **Start Game**: Navigate to `/game` page
2. **Learn Vocabulary**:
   - View English meanings in the right panel
   - Type the corresponding Latin word
   - Earn gold for correct answers
   - Get progressive hints for wrong answers
3. **Build Defense**:
   - Use earned gold to place towers
   - Drag towers from the bottom panel to valid positions
   - Upgrade towers by clicking on them
4. **Survive Waves**: Defend against increasing enemy waves

## 🔧 Game Mechanics

### Gold System
- **Traditional**: Earn gold by defeating enemies
- **Educational**: Earn gold by correctly translating Latin words
- **Bonus**: Wave completion bonuses

### Learning System
- **Progressive Hints**: Letter-by-letter hints for wrong answers
- **Difficulty Scaling**: Word difficulty affects gold rewards
- **Progress Tracking**: Individual word mastery levels
- **Accuracy Statistics**: Real-time learning analytics

### Tower Types
- **Archer Tower ($50)**: Fast, low damage, good for early enemies
- **Magic Tower ($100)**: Medium speed, medium damage, magical projectiles
- **Cannon Tower ($150)**: Slow, high damage, area effect explosions

## 📊 Educational Features

- **Real-time Validation**: Instant feedback on word input
- **Adaptive Hints**: Progressive letter revelation system
- **Mastery Tracking**: Individual word learning progress
- **Statistical Analysis**: Accuracy rates and learning curves
- **Curriculum Integration**: Assignment-based vocabulary sets

## 🎨 Project Structure

```
latin_kingdom_web/
├── app/                    # Next.js app router
│   ├── game/              # Main game page
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── GameCanvas.tsx     # Phaser.js integration
│   └── VocabularyPanel.tsx # Learning interface
├── game/                  # Game engine (TypeScript)
│   ├── config/           # Game configuration
│   ├── scenes/           # Phaser scenes
│   └── entities/         # Game objects (Towers, Enemies, etc.)
├── lib/                  # Utilities
│   ├── supabase.ts       # Database client
│   └── vocabulary.ts     # Learning system API
├── store/                # State management
│   └── gameStore.ts      # Zustand store
├── types/                # TypeScript definitions
├── public/assets/        # Game assets
│   ├── images/          # Sprites (ported from Python)
│   └── audio/           # Sound effects
└── docs/                # Documentation
    ├── prd.md           # Product requirements
    └── database-schema.sql
```

## 🔄 Development Status

### ✅ Completed (MVP Phase 1-3)
- [x] Next.js 14 project setup with TypeScript
- [x] Asset migration from Python Kingdom Defender
- [x] Supabase database schema and integration
- [x] Complete Phaser.js game engine port
- [x] Tower defense mechanics (towers, enemies, projectiles)
- [x] Latin vocabulary learning system
- [x] Real-time word input and validation
- [x] Progressive hint system
- [x] Game state management (Zustand)
- [x] Responsive UI with learning panel

### 🔄 Pending (Phase 4+)
- [ ] User authentication system
- [ ] AI character generation (OpenAI integration)
- [ ] Advanced learning analytics
- [ ] Multiplayer/social features
- [ ] Comprehensive testing suite
- [ ] Performance optimizations

## 🧪 Testing

The app includes mock data for development and gracefully falls back when Supabase is unavailable. This allows for:

- **Local Development**: Full functionality without database
- **Database Testing**: Real Supabase integration when configured
- **Educational Content**: Pre-loaded Latin vocabulary for immediate play

## 🌟 Educational Impact

Based on learning research integrated into the PRD:

- **Immediate Feedback**: Instant validation improves retention
- **Progressive Difficulty**: Adaptive learning curves
- **Gamification**: Motivation through game mechanics
- **Contextual Learning**: Vocabulary in defensive scenarios
- **Statistical Tracking**: Progress measurement for educators

## 📝 Deployment

The application is ready for deployment on Vercel:

```bash
npm run build
```

Ensure environment variables are configured in your deployment platform.

## 🤝 Contributing

1. Follow the existing code style and TypeScript standards
2. Test both game mechanics and learning features
3. Ensure Supabase integration works with fallbacks
4. Update documentation for new features

## 📜 License

[License details to be added]

---

**Built with ❤️ for Latin learning and tower defense fans**