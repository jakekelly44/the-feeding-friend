# The Feeding Friend

Pet nutrition planning app built with Next.js 14 and Supabase.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.local.example` to `.env.local` and add your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Get your credentials from:
- Supabase Dashboard → Project Settings → API
  - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon/public key

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- ✅ Authentication (signup, login, logout)
- ✅ 6-section MER Calculator
- ✅ Pet profile management
- ✅ Home dashboard with pet cards
- ✅ PDF feeding plan generation (with food recommendations)
- ✅ Edit pet profiles through calculator flow
- ✅ Delete pet profiles
- 🔲 Food database (coming soon)
- 🔲 Meal planning (coming soon)
- 🔲 Cost analytics (coming soon)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── auth/              # Auth pages (login, signup)
│   ├── (main)/            # Main app pages (with bottom nav)
│   ├── calculator/        # MER calculator
│   └── pets/              # Pet profiles
├── components/            # React components
├── lib/
│   ├── supabase/         # Supabase client setup
│   └── calculations/     # MER calculator engine
├── stores/               # Zustand stores
└── hooks/                # Custom hooks
```

## Database

See `/supabase` directory for migrations and seed data.
