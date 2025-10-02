import DiffMatchPatch from 'diff-match-patch';

export interface CharacterDiff {
  char: string;
  correct: boolean;
}

export function calculateDiff(reference: string, attempt: string): {
  diff: CharacterDiff[];
  score: number;
} {
  const dmp = new DiffMatchPatch();
  // Compare attempt against reference to show user's typed text
  const diffs = dmp.diff_main(attempt, reference);
  dmp.diff_cleanupSemantic(diffs);

  const characterDiff: CharacterDiff[] = [];
  let correctChars = 0;
  let totalChars = reference.length;

  for (const [operation, text] of diffs) {
    if (operation === 0) {
      // Equal - characters match
      for (const char of text) {
        characterDiff.push({ char, correct: true });
        correctChars++;
      }
    } else if (operation === 1) {
      // Insertion - extra characters in attempt (show as error)
      for (const char of text) {
        characterDiff.push({ char, correct: false });
      }
    }
    // operation === -1 is deletion (missing from attempt)
    // Don't display these in the user's answer
  }

  const score = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;

  return { diff: characterDiff, score };
}
