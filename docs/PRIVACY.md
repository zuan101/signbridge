# SignBridge: Privacy, Security & Data Governance

SignBridge was engineered under strict zero-knowledge principles for vulnerable populations and shared workstation environments.

---

## 1. Zero Frame Retention Policy
- **No Video Storage:** Webcam frames are streamed directly from `HTMLVideoElement` to WebAssembly memory buffers.
- **No Cloud Ingestion:** SignBridge has no backend server, telemetry endpoint, or analytics script. 100% of landmark calculations execute inside your local browser.
- **Immediate Buffer Reclaim:** Once hand landmarks are extracted for a frame, the frame buffer is immediately released by the garbage collector.

---

## 2. Camera Lifecycle & Hardware Control
- **Explicit Permission Only:** SignBridge will never invoke `navigator.mediaDevices.getUserMedia` upon page load. The user must click the **Start Camera** button.
- **Absolute Track Termination:** Clicking **Stop Camera**, switching tabs, navigating away, or unmounting cleanly calls `MediaStreamTrack.stop()` on every audio/video track.
- **Hardware Disconnect Detection:** If the camera is physically unplugged or claimed by another application, the application catches `NotReadableError` / `ended` events and clears the UI state immediately.

---

## 3. Local-Only Storage
- Saved conversation transcripts and user preferences are persisted exclusively in browser `localStorage` or `IndexedDB`.
- No cookies, no session identifiers, no tracking beacons.
- Users can click **Export All Data (JSON)** or **Clear History** at any time to inspect or wipe their data completely.
