/**
 * SignBridge Built-in Assistant Engine
 * Lightweight, deterministic, browser-native chatbot that operates 100% offline
 * with zero external API keys, server secrets, or network dependencies.
 *
 * Runs reliably on Vercel static deployments and local development environments.
 */

export interface BotResponse {
  reply: string;
  matchedIntent: string;
}

/**
 * Safely normalizes any input value into a clean, human-readable string.
 * Completely eliminates any "[object Object]" or undefined/null display errors.
 */
export function normalizeMessageText(input: unknown): string {
  if (input === null || input === undefined) {
    return '';
  }
  if (typeof input === 'string') {
    return input.trim();
  }
  if (typeof input === 'number' || typeof input === 'boolean') {
    return String(input);
  }
  if (typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    if (typeof obj.text === 'string' && obj.text.trim()) return obj.text.trim();
    if (typeof obj.reply === 'string' && obj.reply.trim()) return obj.reply.trim();
    if (typeof obj.message === 'string' && obj.message.trim()) return obj.message.trim();
    if (typeof obj.response === 'string' && obj.response.trim()) return obj.response.trim();
    if (typeof obj.content === 'string' && obj.content.trim()) return obj.content.trim();

    // Nested error object e.g. { error: { message: "..." } } or { error: "..." }
    if (typeof obj.error === 'string' && obj.error.trim()) return obj.error.trim();
    if (obj.error && typeof obj.error === 'object') {
      const errObj = obj.error as Record<string, unknown>;
      if (typeof errObj.message === 'string' && errObj.message.trim()) return errObj.message.trim();
    }

    try {
      const json = JSON.stringify(input);
      if (json && json !== '{}' && json !== '[]') {
        return json;
      }
    } catch {
      // ignore serialization failure
    }
  }
  return 'Message received';
}

/**
 * Deterministic intent rule matcher for SignBridge topics.
 */
export function generateBotReply(rawMessage: unknown): BotResponse {
  const message = normalizeMessageText(rawMessage);
  const clean = message.replace(/[^\w\s]/gi, ' ').replace(/\s+/g, ' ').trim();
  const lower = clean.toLowerCase();

  if (!lower) {
    return {
      reply: 'Please sign a gesture in front of the camera or type a question to get started!',
      matchedIntent: 'empty',
    };
  }

  // 1. Greetings & Introductions
  if (
    /^(hello|hi|hey|namaste|greetings|good morning|good afternoon|good evening|vanakkam|aadaab)$/i.test(lower) ||
    /^(h e l l o|h i)$/i.test(lower) ||
    /\b(hello|namaste|hi there)\b/i.test(lower)
  ) {
    return {
      reply: 'Hello! 👋 Welcome to SignBridge. How can I help you communicate today?',
      matchedIntent: 'greeting',
    };
  }

  // 2. What is SignBridge?
  if (
    /what is signbridge/i.test(lower) ||
    /about signbridge/i.test(lower) ||
    /tell me about signbridge/i.test(lower) ||
    /what does signbridge do/i.test(lower) ||
    /what does this app do/i.test(lower) ||
    lower === 'signbridge'
  ) {
    return {
      reply: 'SignBridge helps bridge communication gaps by recognizing supported sign-language gestures and converting them into text. You can explore letters, numbers, and gestures in the application.',
      matchedIntent: 'what_is_signbridge',
    };
  }

  // 3. How do I spell a word? / Fingerspelling / Letters
  if (
    /how do i spell/i.test(lower) ||
    /how to spell/i.test(lower) ||
    /spelling/i.test(lower) ||
    /fingerspell/i.test(lower) ||
    /alphabet/i.test(lower) ||
    /letters section/i.test(lower) ||
    /letters mode/i.test(lower) ||
    /\b(letters|spell a word)\b/i.test(lower)
  ) {
    return {
      reply: 'Open the Letters section and perform the supported signs one by one. SignBridge should combine recognized letters into text when that functionality is available.',
      matchedIntent: 'how_to_spell',
    };
  }

  // 4. What can you do? / Capabilities
  if (
    /what can you do/i.test(lower) ||
    /what are your features/i.test(lower) ||
    /who are you/i.test(lower) ||
    /how can you help/i.test(lower) ||
    /help me/i.test(lower)
  ) {
    return {
      reply: 'I can explain how SignBridge works, help you navigate its features, and answer common questions about sign-language communication.',
      matchedIntent: 'capabilities',
    };
  }

  // 5. Thank you / Gratitude
  if (
    /thank you/i.test(lower) ||
    /thanks/i.test(lower) ||
    /dhanyavaad/i.test(lower) ||
    /shukriya/i.test(lower) ||
    /appreciated/i.test(lower)
  ) {
    return {
      reply: "You're welcome! 😊 I'm happy to help.",
      matchedIntent: 'gratitude',
    };
  }

  // 6. How SignBridge Works / Recognition Pipeline
  if (
    /how does signbridge work/i.test(lower) ||
    /how does it work/i.test(lower) ||
    /how does recognition work/i.test(lower) ||
    /webcam/i.test(lower) ||
    /camera/i.test(lower) ||
    /hand tracking/i.test(lower) ||
    /mediapipe/i.test(lower)
  ) {
    return {
      reply: 'SignBridge tracks 21 hand landmarks in real time using client-side computer vision in your browser. As you hold a sign steadily for ~0.3s, the recognized character is added to the composer where you can review or send it.',
      matchedIntent: 'how_it_works',
    };
  }

  // 7. Numbers Section
  if (
    /numbers/i.test(lower) ||
    /digits/i.test(lower) ||
    /how to sign numbers/i.test(lower) ||
    /count/i.test(lower)
  ) {
    return {
      reply: 'In the Numbers mode, SignBridge recognizes numeral signs 1 through 5 using normalized landmark angles. Select "ISL Numbers" from the camera panel mode selector or visit the Learn Signs tab to practice.',
      matchedIntent: 'numbers',
    };
  }

  // 8. Gestures & Phrases Section
  if (
    /gestures/i.test(lower) ||
    /phrases/i.test(lower) ||
    /learn signs/i.test(lower) ||
    /vocabulary/i.test(lower) ||
    /dictionary/i.test(lower)
  ) {
    return {
      reply: 'SignBridge supports static fingerspelling alphabets, numbers, and common greeting handshapes. You can visit the "Learn Signs" navigation tab (Alt+2) to browse the complete interactive sign dictionary.',
      matchedIntent: 'gestures',
    };
  }

  // 9. Repeated Letters (e.g. LL in HELLO)
  if (
    /double letter/i.test(lower) ||
    /repeat/i.test(lower) ||
    /two l/i.test(lower) ||
    /consecutive/i.test(lower)
  ) {
    return {
      reply: 'To sign repeated letters like the two "L"s in HELLO, hold the sign until the first letter commits, briefly relax or pause your hand for ~0.4s, and then sign it again.',
      matchedIntent: 'repeated_letters',
    };
  }

  // 10. Accessibility & Privacy
  if (
    /privacy/i.test(lower) ||
    /offline/i.test(lower) ||
    /accessibility/i.test(lower) ||
    /speech/i.test(lower) ||
    /audio/i.test(lower)
  ) {
    return {
      reply: 'SignBridge is 100% privacy-preserving and runs entirely in your browser without transmitting camera feeds over the network. It features speech synthesis, high-contrast themes, and full keyboard navigation (Alt+1 through Alt+4).',
      matchedIntent: 'accessibility',
    };
  }

  // 11. Campus / Counter Navigation
  if (/fee|counter|admission|room 104|register/i.test(lower)) {
    return {
      reply: 'The Admissions and Fee Payment counter is located in Room 104 on the ground floor. Staff there can assist you with enrollment and fee receipts.',
      matchedIntent: 'counter_fee',
    };
  }

  if (/library|books|card/i.test(lower)) {
    return {
      reply: 'The Central Library is located on the second floor of Block B. You can issue reference books at Counter 2 using your student ID.',
      matchedIntent: 'counter_library',
    };
  }

  // 12. Fallback for unrecognized questions with helpful examples
  return {
    reply: "I'm here to help you navigate SignBridge and understand sign-language communication! I didn't recognize that specific question. Try asking one of these:\n• 'What is SignBridge?'\n• 'How do I spell a word?'\n• 'What can you do?'\n• 'How does sign recognition work?'",
    matchedIntent: 'fallback',
  };
}
