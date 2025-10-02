# 📄 Software Requirements Specification

## 1. Overview
Learners hear French sentences, type what they hear, and receive immediate feedback. Adds **difficulty level** and **topic/theme selection** to guide sentence generation.  

---

## 2. Functional Requirements (YAML)

```yaml
requirements:

  # ---------- FRONTEND ----------
  - id: UI-01
    layer: front_end
    trigger: "WHEN learner opens app"
    behavior: "Display dropdowns for difficulty and theme selection"
    acceptance_criteria:
      - CEFR level dropdown visible (A1–C2, default A1)
      - Theme dropdown visible with at least: ['General', 'Travel', 'Food', 'Daily Life']
      - Default theme is 'General'

  - id: UI-02
    layer: front_end
    trigger: "WHEN learner selects difficulty/theme and clicks 'Generate Sentence'"
    behavior: "Request new sentence from backend with difficulty and theme"
    acceptance_criteria:
      - API request includes difficulty + theme
      - Play button visible after sentence generated
      - No text shown before learner listens

  - id: UI-03
    layer: front_end
    trigger: "WHEN learner clicks 'Play'"
    behavior: "Play audio of generated sentence"
    acceptance_criteria:
      - Audio starts from beginning
      - Playback speed adjustable (0.5x–1.5x)
      - Unlimited replays allowed

  - id: UI-04
    layer: front_end
    trigger: "WHEN learner types input"
    behavior: "Accept learner’s attempt in text field"
    acceptance_criteria:
      - Input is editable until submission
      - No autocorrect or spellcheck
      - Input persists until cleared manually

  - id: UI-05
    layer: front_end
    trigger: "WHEN learner clicks 'Submit'"
    behavior: "Send typed attempt to backend for grading"
    acceptance_criteria:
      - Request includes sentence_id, difficulty, theme, and attempt_text
      - Input locked until feedback displayed

  - id: UI-06
    layer: front_end
    trigger: "AFTER backend returns feedback"
    behavior: "Display character-level diff + percentage correct"
    acceptance_criteria:
      - Incorrect characters highlighted red
      - Correct characters highlighted green
      - Percentage correct displayed numerically
      - Replay button remains available

  # ---------- BACKEND ----------
  - id: BE-01
    layer: back_end
    trigger: "WHEN frontend requests new sentence"
    behavior: "Call OpenAI API to generate French sentence at given CEFR level + theme"
    acceptance_criteria:
      - Sentence complexity aligns with CEFR level
      - Sentence relates to selected theme
      - Store sentence with difficulty + theme metadata

  - id: BE-02
    layer: back_end
    trigger: "WHEN frontend requests audio"
    behavior: "Call OpenAI TTS API to generate audio"
    acceptance_criteria:
      - Audio file stored in Supabase storage
      - Playback URL returned

  - id: BE-03
    layer: back_end
    trigger: "WHEN learner submits typed attempt"
    behavior: "Compare attempt against reference sentence"
    acceptance_criteria:
      - Case + accent sensitive
      - Return character-level diff JSON
      - Return percentage correct

  - id: BE-04
    layer: back_end
    trigger: "AFTER grading"
    behavior: "Store attempt in database"
    acceptance_criteria:
      - Save user_id, sentence_id, attempt_text, score, diff_json, timestamp
      - Retrievable for future analytics

  # ---------- DATABASE ----------
  - id: DB-01
    layer: database
    behavior: "Maintain schema for users, sentences, and attempts"
    acceptance_criteria:
      - Normalized schema with foreign keys
      - Indexed by user_id for retrieval
```

---

## 3. Database Schema (Postgres via Supabase)

```yaml
tables:

  users:
    - id: uuid (PK)
    - email: text (unique, not null)
    - created_at: timestamp (default now)

  sentences:
    - id: uuid (PK)
    - text: text (not null)
    - difficulty: text (enum: A1–C2)
    - theme: text (default 'General')
    - source: text (default 'generated')
    - audio_url: text (nullable until audio generated)
    - created_at: timestamp (default now)

  attempts:
    - id: uuid (PK)
    - user_id: uuid (FK → users.id)
    - sentence_id: uuid (FK → sentences.id)
    - attempt_text: text
    - score: numeric (0–100)
    - diff_json: jsonb (stores character-level diff)
    - created_at: timestamp (default now)

indexes:
  - users.email (unique)
  - attempts.user_id
  - attempts.sentence_id
  - sentences.difficulty
  - sentences.theme
```

---

## 4. Non-Functional Requirements

```yaml
non_functional:
  - id: NFR-01
    category: performance
    description: "Sentence generation + grading <2s typical latency"

  - id: NFR-02
    category: availability
    description: "Target uptime 99.5%"

  - id: NFR-03
    category: scalability
    description: "Support 100 concurrent learners without degradation"

  - id: NFR-04
    category: security
    description: "All data encrypted in transit (TLS) + at rest (Postgres)"

  - id: NFR-05
    category: usability
    description: "Keyboard and screen-reader accessible UI"

  - id: NFR-06
    category: internationalization
    description: "Full support for UTF-8 French accents and punctuation"
```

---

## 5. Assumptions & Constraints
- Authentication handled by Supabase Auth.  
- Only **French sentences** supported at launch.  
- No progress dashboards in v1 (data stored for later).  
- Audio caching optional (first pass: generate on demand).  

---

## 6. Edge Cases
- Empty input → return “No attempt recorded.”  
- Extra whitespace/punctuation → treated as errors.  
- Rare French chars (ç, œ, é, à) → must grade correctly.  
- Audio API failure → return retry option.  
