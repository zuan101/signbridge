/**
 * ISLDictionary — High-frequency vocabulary for Indian Sign Language communication,
 * public desk interactions, health/education facilities, and everyday dialogue.
 *
 * Powers real-time word suggestion and typing assistance in the SignBridge composer.
 */

export const FREQUENT_ISL_WORDS: readonly string[] = [
  // Short core words
  'A', 'I', 'AM', 'AN', 'AS', 'AT', 'BE', 'BY', 'DO', 'GO', 'HE', 'IF', 'IN', 'IS', 'IT', 'ME', 'MY', 'NO', 'OF', 'ON', 'OR', 'SO', 'TO', 'UP', 'US', 'WE',
  // 3-letter common words
  'AND', 'ARE', 'ASK', 'BAD', 'BIG', 'BOY', 'BUS', 'CAN', 'CAR', 'DAY', 'EAT', 'FOR', 'GET', 'HAD', 'HAS', 'HER', 'HIM', 'HIS', 'HOT', 'HOW', 'MAN', 'NEW', 'NOT', 'NOW', 'OLD', 'ONE', 'OUR', 'OUT', 'RUN', 'SAY', 'SEE', 'SHE', 'SIT', 'TEA', 'THE', 'TWO', 'USE', 'WAY', 'WHO', 'WHY', 'YES', 'YOU',
  // 4-letter communication & desk words
  'ALSO', 'BACK', 'BOOK', 'BUSY', 'CALL', 'COME', 'COLD', 'DESK', 'DOOR', 'EACH', 'FEES', 'FIND', 'FINE', 'FORM', 'FREE', 'FROM', 'GIVE', 'GOOD', 'HAVE', 'HEAR', 'HELP', 'HERE', 'HOME', 'JUST', 'KNOW', 'LATE', 'LEFT', 'LIKE', 'LINE', 'LIVE', 'LOOK', 'MAKE', 'MANY', 'MEET', 'MORE', 'MOST', 'MUCH', 'NAME', 'NEED', 'NEXT', 'NICE', 'OPEN', 'PAIN', 'PASS', 'ROOM', 'SAID', 'SAME', 'SHOW', 'SIGN', 'SLOW', 'SOME', 'STOP', 'SURE', 'TAKE', 'TELL', 'THAN', 'THAT', 'THEM', 'THEN', 'THEY', 'THIS', 'TIME', 'TRUE', 'VERY', 'WAIT', 'WANT', 'WELL', 'WHAT', 'WHEN', 'WILL', 'WITH', 'WORK', 'YEAR',
  // 5-letter words
  'ABOUT', 'AFTER', 'AGAIN', 'AGREE', 'ALONE', 'BREAD', 'BRING', 'CHAIR', 'CLASS', 'CLEAN', 'CLOSE', 'DRINK', 'EARLY', 'ENTER', 'EVERY', 'FIRST', 'FLOOR', 'GLASS', 'GREAT', 'HAPPY', 'HELLO', 'HOUSE', 'LARGE', 'LUNCH', 'MAYBE', 'MONEY', 'NIGHT', 'ORDER', 'PAPER', 'PEACE', 'PHONE', 'PLACE', 'PLEASE', 'PRICE', 'READY', 'RIGHT', 'SLEEP', 'SMALL', 'SMART', 'SORRY', 'SPEAK', 'START', 'STUDY', 'TABLE', 'THANK', 'THESE', 'THINK', 'THOSE', 'TODAY', 'TRAIN', 'UNDER', 'VISIT', 'WATER', 'WHERE', 'WHICH', 'WOMAN', 'WRITE',
  // 6-letter words (campus, medical, everyday)
  'ANSWER', 'BEHIND', 'CAMPUS', 'CHANCE', 'CLINIC', 'DOCTOR', 'EXCUSE', 'FAMILY', 'FATHER', 'FINISH', 'FORGET', 'FRIEND', 'HAPPEN', 'HEALTH', 'HUNGRY', 'INSIDE', 'LETTER', 'LISTEN', 'LITTLE', 'MINUTE', 'MOTHER', 'NUMBER', 'OFFICE', 'PARENT', 'PEOPLE', 'PERSON', 'POLICE', 'PUBLIC', 'REASON', 'REPEAT', 'SCHOOL', 'SEARCH', 'SECOND', 'SISTER', 'STREET', 'STRONG', 'THANKS', 'TICKET', 'TRAVEL', 'WINDOW',
  // 7+ letter words
  'ADDRESS', 'ALREADY', 'ANOTHER', 'ANYTHING', 'BECAUSE', 'BROTHER', 'COLLEGE', 'CONFUSED', 'COUNTER', 'EVENING', 'EXPLAIN', 'FACULTY', 'HEARING', 'HOSPITAL', 'IMPORTANT', 'MEDICINE', 'MEETING', 'MORNING', 'NOTHING', 'OUTSIDE', 'PATIENT', 'PROBLEM', 'RECEIPT', 'STATION', 'STUDENT', 'TEACHER', 'THIRSTY', 'WELCOME', 'YESTERDAY'
] as const;

/**
 * Return top word completions for a given typing prefix.
 * @param prefix Current unfinished word (e.g. "HEL")
 * @param maxResults Maximum number of suggestions to return
 */
export function getWordSuggestions(prefix: string, maxResults = 4): string[] {
  const clean = prefix.trim().toUpperCase();
  if (!clean || clean.length < 1) return [];

  const startsWithMatches: string[] = [];
  for (const word of FREQUENT_ISL_WORDS) {
    if (word === clean) continue; // Don't suggest the exact word if already complete
    if (word.startsWith(clean)) {
      startsWithMatches.push(word);
      if (startsWithMatches.length >= maxResults) {
        return startsWithMatches;
      }
    }
  }

  // If no prefix match and length >= 3, find 1-edit typo matches
  if (startsWithMatches.length === 0 && clean.length >= 3) {
    const typoMatches: string[] = [];
    for (const word of FREQUENT_ISL_WORDS) {
      if (Math.abs(word.length - clean.length) <= 1 && levenshteinDistance(word, clean) === 1) {
        typoMatches.push(word);
        if (typoMatches.length >= maxResults) break;
      }
    }
    return typoMatches;
  }

  return startsWithMatches;
}

/** Compute simple Levenshtein distance for fuzzy typo correction */
function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], prev, row[j]) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }

  return row[b.length];
}
