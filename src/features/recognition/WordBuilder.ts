/**
 * WordBuilder — Converts a real-time stream of recognised letter predictions into words
 * with hold-to-confirm stabilization, duplicate suppression, and dictionary integration.
 *
 * KEY FEATURES:
 *  1. Hold-to-Confirm: A letter must be held steadily for holdDurationMs (default 280ms)
 *     before it commits. This prevents transitional hand movements from inserting garbage.
 *  2. Real-time Hold Progress: Returns holdProgress (0.0 to 1.0) and holdLetter for UI meters.
 *  3. Double-letter support: Relaxing hand for >350ms resets commitment so repeated letters
 *     like "LL" in "HELLO" can be deliberately typed.
 *  4. Automatic Word-Pause Space: Hand absence for >1500ms appends a word space.
 *  5. Word Extraction & Completion: Provides .currentWord and .completeWord() for dictionary chips.
 */

export interface WordBuilderStatus {
  text: string;
  currentWord: string;
  holdLetter: string | null;
  holdProgress: number; // 0.0 to 1.0
  justCommittedLetter: string | null;
}

export class WordBuilder {
  /** Full accumulated text */
  private buffer = '';

  /** Letter currently being held */
  private currentCandidate: string | null = null;

  /** Timestamp when current candidate hold began */
  private candidateStartTime = 0;

  /** Whether the current held candidate has already been committed to the buffer */
  private candidateCommitted = false;

  /** Time required to hold a sign before committing (ms) */
  private readonly holdDurationMs: number;

  /** How long (ms) hand absence inserts a word break space */
  private readonly pauseForSpaceMs: number;

  /** How long (ms) of neutral hand resets commitment for double-letter typing */
  private readonly doubleLetterResetMs: number;

  /** Timestamp of last detected letter */
  private lastLetterTime = 0;

  /** Timestamp when hand was last seen */
  private lastHandTime = 0;

  /** Whether previous frame had a hand visible */
  private hadHand = false;

  /** Whether a space has already been inserted for the current absence */
  private spacePending = false;

  constructor(
    holdDurationMs = 280,
    pauseForSpaceMs = 1500,
    doubleLetterResetMs = 380
  ) {
    this.holdDurationMs = holdDurationMs;
    this.pauseForSpaceMs = pauseForSpaceMs;
    this.doubleLetterResetMs = doubleLetterResetMs;
  }

  /**
   * Process a frame's raw/smoothed prediction.
   * @param letter The predicted letter candidate (or null if none/uncertain)
   * @param handPresent Whether a hand is detected in frame
   * @returns WordBuilderStatus containing current buffer, hold progress, and commit events
   */
  push(letter: string | null, handPresent: boolean): WordBuilderStatus {
    const now = performance.now();
    let justCommitted: string | null = null;
    let progress = 0;

    if (handPresent) {
      this.lastHandTime = now;
      this.spacePending = false;

      if (letter) {
        this.lastLetterTime = now;

        if (letter === this.currentCandidate) {
          // Continuing hold of the same candidate
          const elapsed = now - this.candidateStartTime;
          progress = this.holdDurationMs <= 0 ? 1.0 : Math.min(1.0, elapsed / this.holdDurationMs);

          if (progress >= 1.0 && !this.candidateCommitted) {
            // Commit letter!
            this.buffer += letter;
            this.candidateCommitted = true;
            justCommitted = letter;
          }
        } else {
          // Switched to a new letter candidate — reset hold timer
          this.currentCandidate = letter;
          this.candidateStartTime = now;
          this.candidateCommitted = false;

          if (this.holdDurationMs <= 0) {
            this.buffer += letter;
            this.candidateCommitted = true;
            justCommitted = letter;
            progress = 1.0;
          } else {
            progress = 0;
          }
        }
      } else {
        // Hand present but pose is neutral / transitional
        // If neutral for long enough, reset candidate so the user can re-sign the same letter
        if (this.currentCandidate && now - this.lastLetterTime > this.doubleLetterResetMs) {
          this.currentCandidate = null;
          this.candidateCommitted = false;
          progress = 0;
        } else if (this.currentCandidate && !this.candidateCommitted) {
          // Decay progress if hand twitched briefly
          progress = 0;
        }
      }

      this.hadHand = true;
    } else {
      // Hand completely absent from camera frame
      if (this.hadHand) {
        this.currentCandidate = null;
        this.candidateCommitted = false;
        progress = 0;
      }
      this.hadHand = false;

      // Auto-space insertion after hand absence pause
      if (
        !this.spacePending &&
        this.buffer.length > 0 &&
        !this.buffer.endsWith(' ') &&
        now - this.lastHandTime > this.pauseForSpaceMs
      ) {
        this.buffer += ' ';
        this.spacePending = true;
      }
    }

    return {
      text: this.buffer,
      currentWord: this.currentWord,
      holdLetter: this.currentCandidate,
      holdProgress: progress,
      justCommittedLetter: justCommitted,
    };
  }

  /** Current unfinished word (the letters after the last space) */
  get currentWord(): string {
    const lastSpace = this.buffer.lastIndexOf(' ');
    if (lastSpace === -1) return this.buffer;
    return this.buffer.slice(lastSpace + 1);
  }

  /** Replace the current unfinished word with a completed word from dictionary */
  completeWord(completedWord: string): string {
    const lastSpace = this.buffer.lastIndexOf(' ');
    const prefix = lastSpace === -1 ? '' : this.buffer.slice(0, lastSpace + 1);
    this.buffer = `${prefix}${completedWord} `;
    this.currentCandidate = null;
    this.candidateCommitted = false;
    return this.buffer;
  }

  /** Delete last character (Backspace) */
  backspace(): string {
    this.buffer = this.buffer.slice(0, -1);
    this.currentCandidate = null;
    this.candidateCommitted = false;
    return this.buffer;
  }

  /** Insert a space manually */
  addSpace(): string {
    if (!this.buffer.endsWith(' ')) {
      this.buffer += ' ';
    }
    this.currentCandidate = null;
    this.candidateCommitted = false;
    return this.buffer;
  }

  /** Direct buffer overwrite (manual edits in textarea) */
  set(text: string): void {
    this.buffer = text;
    this.currentCandidate = null;
    this.candidateCommitted = false;
  }

  /** Append manual text */
  append(text: string): string {
    this.buffer += text;
    this.currentCandidate = null;
    this.candidateCommitted = false;
    return this.buffer;
  }

  get text(): string {
    return this.buffer;
  }

  reset(): void {
    this.buffer = '';
    this.currentCandidate = null;
    this.candidateStartTime = 0;
    this.candidateCommitted = false;
    this.lastLetterTime = 0;
    this.hadHand = false;
    this.lastHandTime = 0;
    this.spacePending = false;
  }
}
