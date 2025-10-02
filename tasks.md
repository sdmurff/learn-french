# tasks.md – Build Plan for Listen & Type Feature (Explicit Deliverables)

## 1. Project Setup
- [x] Initialize project with **React/Next.js** frontend.  
  - Deliverable: `package.json` with React/Next.js dependencies.  ✅
- [x] Set up **Supabase project** with authentication enabled.  
  - Deliverable: `.env.local` with `SUPABASE_URL` and `SUPABASE_ANON_KEY`.  ✅
- [x] Configure Postgres database schema in Supabase.  
  - Deliverable: `schema.sql` file.  ✅
- [x] Create project structure:  
  - `frontend/` for Next.js app.  ✅
  - `supabase/functions/` for Edge Functions.  ✅  

---

## 2. Database Schema (Supabase / Postgres)
- [x] Create schema.sql with these tables:  
  - `users`  
  - `sessions`  
  - `sentences`  
  - `words`  
  - `word_frequencies`  
  - `attempts`  
- [x] Add indexes on `user_id`, `sentence_id`, `word_id`, timestamps.  
  - Deliverable: `supabase/migrations/init_schema.sql` (migration-ready).  

---

## 3. Sentence Generation (AI-Powered)
- [x] Build API wrapper for **OpenAI** to generate sentences by CEFR level.  
  - Deliverable: `supabase/functions/sentence_gen/index.ts`.  
- [x] Input: difficulty level (A1–C2), optional topic.  
- [x] Store sentences in `sentences` table with metadata.  
  - Deliverable: DB insert query inside Edge Function.  
- [x] Handle API errors and retries.  

---

## 4. Audio Playback (TTS)
- [x] Integrate with **TTS API** (OpenAI or ElevenLabs).  
  - Deliverable: `lib/tts.ts` helper function.  
- [x] Generate audio clips from `sentences.text`.  
- [x] Frontend audio player: auto-play on load, replay button.  
  - Deliverable: `components/SentencePlayer.tsx`.  

---

## 5. Input Capture
- [x] Build text input with:  
  - No autocorrect/spellcheck.  
  - Accent character support.  
- [x] Capture submissions (Enter key or Submit button).  
  - Deliverable: `components/InputBox.tsx`.  

---

## 6. Grading Logic (Hybrid Accuracy Metric)
- [x] Implement **Edge Function** for grading.  
  - Deliverable: `supabase/functions/grading/index.ts`.  
- [x] Include:  
  - WER (word-level)  
  - CER (character-level)  
  - Accent check (diacritics)  
  - Weighted score (70/20/10).  
- [x] Save results in `attempts.score`.  

---

## 7. Feedback Display
- [x] Show learner’s submission, correct answer, highlights.  
- [x] Show numeric score (percentage).  
- [x] Provide retry button.  
  - Deliverable: `components/FeedbackPanel.tsx`.  

---

## 8. Progress Tracking
- [x] Update session-level metrics in `sessions`.  
- [x] Show **session vs lifetime totals** side by side.  
  - Deliverable: `components/ProgressPanel.tsx`.  

---

## 9. Word Exposure & Retention Tracking
- [x] Count words listened (sentence length × replays).  
- [x] Count words typed correctly.  
- [x] Track distinct words listened/typed.  
  - Deliverable: Edge Function updates inside `supabase/functions/grading/index.ts`.  

---

## 10. Word Frequency & Personal Dictionary
- [x] Maintain `word_frequencies` (UPSERT on attempts).  
- [x] Build dictionary UI with:  
  - Most-listened  
  - Most-typed  
  - Weakest words  
  - Pagination/filtering.  
  - Deliverable: `components/PersonalDictionary.tsx`.  

---

## 11. Supabase Edge Functions
- [x] Sentence generation → `supabase/functions/sentence_gen/index.ts`.  
- [x] Grading → `supabase/functions/grading/index.ts`.  
- [x] Frequency updates → included in grading function.  
- [x] Session finalization → optional `supabase/functions/finalize_session/index.ts`.  

---

## 12. Performance & Scalability
- [x] Use UPSERT for frequency tracking.  
- [x] Add pagination queries for dictionary.  
- [x] Add materialized views for “weak words”.  
  - Deliverable: `supabase/migrations/performance_indexes.sql`.  

---
