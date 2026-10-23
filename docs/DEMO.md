# SignBridge: Live Hackathon Demo Walkthrough Script

Use this step-by-step presentation script to demonstrate SignBridge cleanly in front of judges or users.

---

## Pre-Flight Checklist (30 seconds)
1. Run `npm run verify` in the terminal to show 0 blue violations, validated local model files, and clean unit test suite.
2. Launch `npm run dev` and open in Chrome or Edge.
3. Show the initial screen: Clean, warm ivory canvas with chocolate headings and burnt-orange accents.

---

## 3-Minute Live Demo Flow

### Act 1: The College Help Desk Scenario (30s)
- **Context:** "A Deaf student approaches the campus information counter to ask about the admissions fee counter. The receptionist does not know Indian Sign Language."
- **First Impression:** Point out the warm, welcoming interface with high contrast, clear font hierarchy, and absence of generic blue templates.
- **Privacy Assurance:** Point out that the camera is strictly OFF until clicked.

### Act 2: Signer Input & Landmark Processing (60s)
1. Click **Start Camera**.
2. Allow webcam permission. Notice the persistent "Camera is ON" status badge and real-time FPS counter.
3. Hold up your hand (e.g. 1, 2, 3 fingers or open palm).
4. Point out the **Landmark Overlay** (rendered in warm terracotta `#B94E2F` and sand `#EEDCC5` – 0% blue).
5. Explain the **SignProposal Composer**:
   - The detected gesture appears in the editable composer.
   - **Crucial Accessibility Feature:** The system does NOT blindly blast uncertain text into the chat. The signer can edit with the keyboard or word-builder tray and explicitly clicks **Confirm & Send**.
6. Show the sent message appearing in the shared conversation thread with timestamp.

### Act 3: Receptionist Two-Way Reply & Web Speech (45s)
1. The receptionist on the right panel reads the message.
2. Receptionist clicks a Quick Reply chip: *"Please wait a moment"* or types: *"Go to Room 104 on the first floor for fee payment"*.
3. Receptionist clicks **Send Reply**.
4. The message instantly appears in the conversation.
5. Receptionist clicks the **Speak** icon: The message is spoken out loud via the browser's native Web Speech synthesis.
6. Toggle **Large Display Mode**: Show how both parties can read the conversation across a wide desk with giant high-contrast typography.

### Act 4: Honest ISL Reference & Accessibility (45s)
1. Click **Learn Signs** in the navigation (or press `Alt+2`).
2. Show verified ISL entries referenced from the **ISLRTC (Indian Sign Language Research and Training Centre)** with honest badges indicating whether signs are static landmark-detectable or dynamic educational references.
3. Open **Settings** (press `Alt+4`):
   - Switch to Warm Dark Mode (deep espresso and cream, 0% cool gray or blue).
   - Adjust conversation text scale (Small -> Extra Large).
   - Demonstrate data sovereignty: Click **Export All Data (JSON)** or **Export as .txt**.
4. Press `?` to display the keyboard accessibility map (`Alt+1..4`, `Alt+C`, `Alt+S`, `Ctrl+Enter`).
