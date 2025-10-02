# requirements.md – Listen & Type

## User Story  
As a **language learner**,  
I want to **hear a French sentence and type what I hear**,  
so that I can **practice listening comprehension, spelling accuracy, and track my vocabulary growth**.

---

## Functional Requirements (EARS Notation)

### Sentence Source
- **WHEN** a learner starts a new session without preloaded content  
  **THE SYSTEM SHALL** generate French sentences using the OpenAI API.  

- **WHEN** generating sentences  
  **THE SYSTEM SHALL** allow the learner to select a target difficulty level (e.g., CEFR A1–C2).  

- **WHEN** a difficulty level is selected  
  **THE SYSTEM SHALL** request sentences from the OpenAI API matching that level.  

- **WHEN** sentences are generated  
  **THE SYSTEM SHALL** store them in the database with metadata (source=ai_generated, difficulty_level, topic).  

### Audio Playback  
- **WHEN** a learner starts the activity  
  **THE SYSTEM SHALL** play the target French audio clip once automatically.  

- **WHEN** the learner clicks “Replay”  
  **THE SYSTEM SHALL** replay the audio clip without penalty.  

- **WHEN** the learner requests a replay more than 3 times  
  **THE SYSTEM SHALL** log the count for analytics but still allow unlimited replays.  

---

### Input Capture  
- **WHEN** the learner is presented with the input field  
  **THE SYSTEM SHALL** allow the learner to type any characters, including accented French characters.  

- **WHEN** the learner types  
  **THE SYSTEM SHALL** provide a clean, distraction-free input box with no autocorrect or spellcheck assistance.  

---

### Submission & Grading (Hybrid Accuracy Metric)  
- **WHEN** the learner submits their typed response  
  **THE SYSTEM SHALL** normalize both the expected and submitted text (lowercase, spacing, punctuation).  

- **WHEN** text is normalized  
  **THE SYSTEM SHALL** compute **Word Error Rate (WER)** to evaluate word correctness.  

- **WHEN** WER is computed  
  **THE SYSTEM SHALL** compute **Character Error Rate (CER)** to evaluate spelling precision.  

- **WHEN** CER is computed  
  **THE SYSTEM SHALL** perform an **accent check** to detect missing or incorrect diacritics.  

- **WHEN** all three measures are computed  
  **THE SYSTEM SHALL** combine them into a weighted score:  
  - Word correctness = 70%  
  - Spelling accuracy = 20%  
  - Accent correctness = 10%  

- **WHEN** the learner’s response is scored  
  **THE SYSTEM SHALL** award:  
  - Full credit for exact matches  
  - Partial credit for minor errors (e.g., single typos, missing accent)  
  - Low credit for major errors (e.g., missing or incorrect words)  

---

### Feedback  
- **WHEN** feedback is displayed  
  **THE SYSTEM SHALL** show the learner:  
  - Their typed answer  
  - The correct transcription  
  - Error highlights (color-coded: missing words, typos, accents)  
  - A final score (percentage or points)  

- **WHEN** the learner views feedback  
  **THE SYSTEM SHALL** encourage repetition by offering a “Try Again” button.  

---

### Progress Tracking  
- **WHEN** the learner completes the activity  
  **THE SYSTEM SHALL** log:  
  - Number of attempts  
  - Score per attempt  
  - Replay count  
  - Time taken  

- **WHEN** progress is logged  
  **THE SYSTEM SHALL** sync the data with the learner’s profile for future review.  

---

### Word Exposure & Retention Tracking  
- **WHEN** an audio clip is played  
  **THE SYSTEM SHALL** multiply the sentence word count by the number of times the audio has been played and update the learner’s **Words Listened** metric.  

- **WHEN** the learner submits a typed response  
  **THE SYSTEM SHALL** tally the number of correctly typed words (based on grading results) and update the learner’s **Words Typed Correctly** metric.  

- **WHEN** an audio clip is played  
  **THE SYSTEM SHALL** add each word in the sentence to the learner’s **Distinct Words Listened** set.  

- **WHEN** the learner submits a typed response  
  **THE SYSTEM SHALL** add each correctly typed word to the learner’s **Distinct Words Typed Correctly** set.  

- **WHEN** a session ends  
  **THE SYSTEM SHALL** calculate session totals for:  
  - Words listened to  
  - Words typed correctly  
  - Distinct words listened to  
  - Distinct words typed correctly  

- **WHEN** session totals are calculated  
  **THE SYSTEM SHALL** persist them into the learner’s **lifetime totals**.  

- **WHEN** lifetime totals are updated  
  **THE SYSTEM SHALL** display progress towards long-term milestones (e.g., “You have listened to 12,480 words across 2,150 distinct words, on your way to 1,000,000 words”).  

- **WHEN** metrics are displayed  
  **THE SYSTEM SHALL** show both per-session counts and cumulative counts side by side.  

---

### Word Frequency & Personal Dictionary  
- **WHEN** an audio clip is played  
  **THE SYSTEM SHALL** increment a counter for each word in the sentence within the learner’s **Word Listen Frequency Map** (word → count).  

- **WHEN** the learner submits a typed response  
  **THE SYSTEM SHALL** increment a counter for each correctly typed word within the learner’s **Word Typed Frequency Map** (word → count).  

- **WHEN** a session ends  
  **THE SYSTEM SHALL** update session and lifetime frequency maps to reflect:  
  - Number of times each word was listened to  
  - Number of times each word was typed correctly  

- **WHEN** the learner opens their **Personal Dictionary view**  
  **THE SYSTEM SHALL** display:  
  - Distinct words sorted by listen count (most to least)  
  - Distinct words sorted by typing accuracy (most correct → least correct)  
  - Words with high listen counts but low typing counts (recommended for practice)  

- **WHEN** frequency data is displayed  
  **THE SYSTEM SHALL** allow filtering (e.g., top 10 most-heard words, top 10 most-typed words, weakest 10 words).  

---

## Non-Functional Requirements

### Scalability & Performance  
- **WHEN** the learner’s vocabulary reaches tens of thousands of distinct words  
  **THE SYSTEM SHALL** continue to support word frequency tracking using efficient data structures (hash maps).  

- **WHEN** frequency maps grow beyond 10,000 words  
  **THE SYSTEM SHALL** optimize dictionary views using pagination, lazy-loading, and filtering instead of rendering the full list at once.  

- **WHEN** cumulative word counts are updated  
  **THE SYSTEM SHALL** process updates incrementally (O(1) per word) to ensure performance remains responsive.  

- **WHEN** storage requirements are considered  
  **THE SYSTEM SHALL** persist vocabulary data in a compact format (e.g., SQLite or key-value store) so that even 100,000+ words remain manageable in memory (<10 MB).  
