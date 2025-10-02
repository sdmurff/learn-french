# Learn French - Dictation Practice App

A Next.js application for practicing French listening comprehension and spelling through dictation exercises.

## Features

- **Adaptive Difficulty**: Choose CEFR levels from A1 to C2
- **Themed Content**: Practice with sentences about General topics, Travel, Food, or Daily Life
- **AI-Generated Content**: Uses OpenAI to generate contextually appropriate French sentences
- **Text-to-Speech**: High-quality French audio playback with adjustable speed (0.5x - 1.5x)
- **Real-time Feedback**: Character-level diff highlighting with percentage scoring
- **Progress Tracking**: Stores attempts in Supabase for future analytics

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **AI Services**: OpenAI (GPT-4 for text generation, TTS for audio)
- **Storage**: Supabase Storage for audio files

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL from `supabase-schema.sql` in the Supabase SQL Editor
3. Create a storage bucket named `audio` with public access

### 3. Configure Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Select a CEFR difficulty level (A1-C2)
2. Choose a theme (General, Travel, Food, Daily Life)
3. Click "Generate Sentence" to create a new French sentence
4. Listen to the audio (adjust playback speed if needed)
5. Type what you hear in the text input
6. Submit to see your results with character-level feedback

## Database Schema

### Tables

- **users**: User accounts (id, email, created_at)
- **sentences**: Generated French sentences (id, text, difficulty, theme, audio_url, created_at)
- **attempts**: User practice attempts (id, user_id, sentence_id, attempt_text, score, diff_json, created_at)

## API Endpoints

- `POST /api/generate-sentence`: Generate a new French sentence
- `POST /api/generate-audio`: Create TTS audio for a sentence
- `POST /api/grade-attempt`: Grade user's typed attempt

## Future Enhancements

- User authentication
- Progress dashboard with analytics
- Vocabulary tracking
- Spaced repetition system
- Multiple language support
- Mobile app version
