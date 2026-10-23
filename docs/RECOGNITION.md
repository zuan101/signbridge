# SignBridge: ISL Recognition & Computer Vision Architecture

> **Tagline:** *Every gesture deserves to be understood.*  
> **Status:** Honest Technical Audit & Landmark Recognition Specification

---

## 1. Executive Summary & ISL Linguistic Honesty

Indian Sign Language (ISL) is a rich, natural language with its own grammar, syntax, facial markers (non-manual features), spatial referencing, and movement dynamics. 

### Critical Distinctions
1. **Landmark Detection $\neq$ Language Translation:**
   MediaPipe HandLandmarker extracts 21 3D coordinates per detected hand. This is structural spatial tracking, not semantic sign comprehension.
2. **Static Handshapes $\neq$ Continuous ISL Sentences:**
   Over 85% of standard ISL vocabulary (per ISLRTC – Indian Sign Language Research and Training Centre) relies on **movement trajectories**, **two-handed coordination**, and **facial expressions**. Single-frame static classifiers can at most recognize a subset of fingerspelling alphabets or static numeral signs.
3. **No Unverified External Models:**
   Many online repositories claiming "ISL translation" are either ASL (American Sign Language) models mislabelled as ISL, or hardcoded scripts claiming 99% accuracy on 5 self-recorded test frames. SignBridge strictly rejects fake statistics and unverified neural weights.

---

## 2. Classifier Seam Architecture

SignBridge defines a modular, strictly typed classifier seam:

```typescript
export interface PredictionResult {
  label: string;
  confidence: number; // 0.0 to 1.0 (real, un-fabricated)
  alternatives?: Array<{ label: string; confidence: number }>;
}

export interface SignClassifier {
  readonly id: string;
  readonly name: string;
  readonly license: string;
  readonly labels: readonly string[];
  load(signal?: AbortSignal): Promise<void>;
  predict(landmarks: HandLandmarks[]): Promise<PredictionResult | null>;
  dispose(): void;
}
```

### Available Adapters in SignBridge:

| Adapter ID | Mode Name | Description | Confidence Reporting |
|---|---|---|---|
| `tracking-only` | **Hand Tracking Only** | MediaPipe HandLandmarker tracks 21 joints per hand, computes real FPS, bounding boxes, and landmark connections. No semantic proposal is made. | N/A (Honest disclaimer: "Recognition disabled") |
| `isl-geometric-v1` | **Geometric ISL Static Signs** | Scale-invariant, wrist-relative angular and extension matching for verified ISL static numbers (1, 2, 3, 4, 5) and core greeting handshapes. Uses cosine distance against verified ISLRTC landmark centroids. | Real mathematical cosine similarity (0.65–0.98) |
| `demo-testing` | **Demo / Testing Mode** | Presentation mode for live counter simulation. Presenter or user selects or triggers target signs to evaluate the composer, confirmation pipeline, and TTS response without pretending to be a black-box AI. | Clearly labelled "Manual Demo / Simulation" (no fake confidence score) |

---

## 3. Preprocessing & Normalization Pipeline

For any landmark vector $L = [p_0, p_1, \dots, p_{20}]$ where $p_i = (x_i, y_i, z_i)$:

1. **Wrist Translation Invariance:**
   All coordinates are translated relative to wrist landmark $p_0$:
   $$p_i' = p_i - p_0 \quad \forall i \in \{0, \dots, 20\}$$
2. **Scale Normalization:**
   Scale $s$ is computed as the Euclidean distance between wrist $p_0$ and middle finger MCP joint $p_9$:
   $$s = \|p_9 - p_0\|_2$$
   $$p_i'' = \frac{p_i'}{s}$$
3. **Finger Extension State Vector:**
   Inter-phalangeal angles and tip-to-wrist distances compute a binary/continuous extension score for Thumb, Index, Middle, Ring, Pinky.
4. **Temporal Smoothing & Stability Buffer:**
   To prevent erratic flickering, SignBridge uses an $M$-frame ring buffer (default 6 frames). A gesture must remain stable for $\ge N$ consecutive frames ($N \ge 4$) above the threshold before triggering a proposal.
5. **Repeat Prevention & Cooldown:**
   Once a proposal is pushed to the composer, an active gesture lock is engaged for 1200ms or until hands leave the frame, preventing duplicate character insertion while a user holds a sign.

---

## 4. Why We Reject ASL Models for ISL

- **Alphabets:** ISL fingerspelling for alphabets is predominantly **two-handed** (e.g., 'A', 'B', 'P', 'T' require both hands interacting), whereas ASL is one-handed. Using ASL classifiers for Indian Sign Language users is linguistically invalid and culturally disrespectful.
- **Numbers:** While some single-handed numeral handshapes overlap (1 through 5), orientation and context differ.
- **SignBridge Commitment:** We explicitly label every sign's linguistic origin and provide direct links to the **ISLRTC official dictionary** (islrtc.nic.in).

---

## 5. Offline Capabilities

- Local Model: `/public/models/hand_landmarker.task` (7.46 MB, Apache 2.0).
- Local WASM: `/public/wasm/vision_wasm_internal.wasm` (13.5 MB, Apache 2.0).
- Zero external network requests during camera tracking and sign proposal.
