# Implemented User Stories

## Overview
This document tracks all implemented features in the French Dictation learning app.

---

## Implemented Requirements

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
    implementation:
      - file: app/page.tsx:14-15
      - file: app/page.tsx:350-383
    status: ✅ IMPLEMENTED

  - id: UI-02
    layer: front_end
    trigger: "WHEN learner selects difficulty/theme and clicks 'Generate Sentence'"
    behavior: "Request new sentence from backend with difficulty and theme"
    acceptance_criteria:
      - API request includes difficulty + theme
      - Play button visible after sentence generated
      - No text shown before learner listens
    implementation:
      - file: app/page.tsx:94-132
      - file: app/page.tsx:412-422
    status: ✅ IMPLEMENTED

  - id: UI-03
    layer: front_end
    trigger: "WHEN learner clicks 'Play'"
    behavior: "Play audio of generated sentence"
    acceptance_criteria:
      - Audio starts from beginning
      - Playback speed adjustable (0.5x–1.5x)
      - Unlimited replays allowed
    implementation:
      - file: app/page.tsx:162-173
      - file: app/page.tsx:454-460
      - file: app/page.tsx:492-499
    status: ⚠️ PARTIAL (playback speed not implemented)

  - id: UI-04
    layer: front_end
    trigger: "WHEN learner types input"
    behavior: "Accept learner's attempt in text field"
    acceptance_criteria:
      - Input is editable until submission
      - No autocorrect or spellcheck
      - Input persists until cleared manually
    implementation:
      - file: app/page.tsx:521-531
    status: ✅ IMPLEMENTED

  - id: UI-05
    layer: front_end
    trigger: "WHEN learner clicks 'Submit'"
    behavior: "Send typed attempt to backend for grading"
    acceptance_criteria:
      - Request includes sentence_id, difficulty, theme, and attempt_text
      - Input locked until feedback displayed
    implementation:
      - file: app/page.tsx:288-313
      - file: app/page.tsx:533-540
    status: ✅ IMPLEMENTED

  - id: UI-06
    layer: front_end
    trigger: "AFTER backend returns feedback"
    behavior: "Display character-level diff + percentage correct"
    acceptance_criteria:
      - Incorrect characters highlighted red
      - Correct characters highlighted green
      - Percentage correct displayed numerically
      - Replay button remains available
    implementation:
      - file: app/page.tsx:557-595
    status: ⚠️ PARTIAL (character highlighting not implemented, percentage displayed)

  # ---------- ADDITIONAL FRONTEND FEATURES ----------
  - id: UI-07
    layer: front_end
    trigger: "WHEN learner clicks 'Speak' button"
    behavior: "Record learner's pronunciation attempt"
    acceptance_criteria:
      - Audio recording starts/stops
      - Recording available for playback
      - Automatic pronunciation checking
    implementation:
      - file: app/page.tsx:175-253
      - file: app/page.tsx:462-470
    status: ✅ IMPLEMENTED

  - id: UI-08
    layer: front_end
    trigger: "AFTER recording pronunciation"
    behavior: "Display pronunciation transcription and accuracy score"
    acceptance_criteria:
      - Show what learner actually said
      - Display pronunciation accuracy percentage
      - Compare against reference text
    implementation:
      - file: app/page.tsx:255-286
      - file: app/page.tsx:544-551
      - file: app/page.tsx:583-592
    status: ✅ IMPLEMENTED

  - id: UI-09
    layer: front_end
    trigger: "WHEN learner navigates sentences"
    behavior: "Browse previously generated sentences"
    acceptance_criteria:
      - Previous/Next buttons to navigate
      - Load sentence with audio
      - Reset practice state
    implementation:
      - file: app/page.tsx:134-149
      - file: app/page.tsx:389-410
    status: ✅ IMPLEMENTED

  - id: UI-10
    layer: front_end
    trigger: "WHEN learner clicks 'View History'"
    behavior: "Display all generated sentences in table format"
    acceptance_criteria:
      - Show sentence text, difficulty, theme, creation date
      - Sortable/filterable list
      - Navigate back to practice
    implementation:
      - file: app/sentences/page.tsx:1-111
      - file: app/page.tsx:325-330
    status: ✅ IMPLEMENTED

  - id: UI-11
    layer: front_end
    trigger: "WHEN app loads"
    behavior: "Load a random existing sentence with audio"
    acceptance_criteria:
      - Fetch random sentence from database
      - Only select sentences with audio
      - Fall back to generation if none exist
    implementation:
      - file: app/page.tsx:46-82
    status: ✅ IMPLEMENTED

  - id: UI-12
    layer: front_end
    trigger: "DURING practice workflow"
    behavior: "Enforce Listen → Speak → Type workflow"
    acceptance_criteria:
      - Must listen before speaking
      - Must speak before typing
      - Visual progress indicators
    implementation:
      - file: app/page.tsx:35-37
      - file: app/page.tsx:158-173
      - file: app/page.tsx:211
      - file: app/page.tsx:428-451
      - file: app/page.tsx:464
      - file: app/page.tsx:517-526
    status: ✅ IMPLEMENTED

  # ---------- BACKEND ----------
  - id: BE-01
    layer: back_end
    trigger: "WHEN frontend requests new sentence"
    behavior: "Call OpenAI API to generate French sentence at given CEFR level + theme"
    acceptance_criteria:
      - Sentence complexity aligns with CEFR level
      - Sentence relates to selected theme
      - Store sentence with difficulty + theme metadata
    implementation:
      - file: app/api/generate-sentence/route.ts:1-104
    status: ✅ IMPLEMENTED

  - id: BE-02
    layer: back_end
    trigger: "WHEN frontend requests audio"
    behavior: "Call OpenAI TTS API to generate audio"
    acceptance_criteria:
      - Audio file stored in Supabase storage
      - Playback URL returned
    implementation:
      - file: app/api/generate-audio/route.ts:1-74
    status: ✅ IMPLEMENTED

  - id: BE-03
    layer: back_end
    trigger: "WHEN learner submits typed attempt"
    behavior: "Compare attempt against reference sentence"
    acceptance_criteria:
      - Case + accent sensitive
      - Return character-level diff JSON
      - Return percentage correct
    implementation:
      - file: app/api/grade-attempt/route.ts:1-64
      - file: utils/diff.ts
    status: ✅ IMPLEMENTED

  - id: BE-04
    layer: back_end
    trigger: "AFTER grading"
    behavior: "Store attempt in database"
    acceptance_criteria:
      - Save user_id, sentence_id, attempt_text, score, diff_json, timestamp
      - Retrievable for future analytics
    implementation:
      - file: app/api/grade-attempt/route.ts:34-49
    status: ✅ IMPLEMENTED

  # ---------- ADDITIONAL BACKEND FEATURES ----------
  - id: BE-05
    layer: back_end
    trigger: "WHEN learner submits pronunciation recording"
    behavior: "Transcribe audio using Whisper API and grade pronunciation"
    acceptance_criteria:
      - Convert audio to text using Whisper
      - Compare transcription to reference text
      - Return accuracy score
    implementation:
      - file: app/api/check-pronunciation/route.ts:1-67
    status: ✅ IMPLEMENTED

  - id: BE-06
    layer: back_end
    trigger: "WHEN app loads"
    behavior: "Fetch random sentence with audio from database"
    acceptance_criteria:
      - Only return sentences with audio URLs
      - Random selection from available sentences
      - Handle empty database case
    implementation:
      - file: app/api/random-sentence/route.ts:1-49
    status: ✅ IMPLEMENTED

  - id: BE-07
    layer: back_end
    trigger: "WHEN history page loads"
    behavior: "Fetch all sentences ordered by creation date"
    acceptance_criteria:
      - Return up to 100 most recent sentences
      - Include all sentence metadata
      - Ordered newest first
    implementation:
      - file: app/api/list-sentences/route.ts:1-29
    status: ✅ IMPLEMENTED

  # ---------- DATABASE ----------
  - id: DB-01
    layer: database
    behavior: "Maintain schema for users, sentences, and attempts"
    acceptance_criteria:
      - Normalized schema with foreign keys
      - Indexed by user_id for retrieval
    implementation:
      - Supabase database with tables: users, sentences, attempts
      - Referenced in: lib/supabase.ts
    status: ✅ IMPLEMENTED
```

---

## Summary Statistics

- **Total Features**: 20
- **Fully Implemented**: 17 ✅
- **Partially Implemented**: 2 ⚠️
- **Not Implemented**: 1 ❌

### Notes on Partial Implementations

1. **UI-03** (Audio Playback): Playback speed adjustment (0.5x–1.5x) not yet implemented
2. **UI-06** (Feedback Display): Percentage scoring implemented, but character-level highlighting (red/green) not yet implemented
