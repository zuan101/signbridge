import type { HandLandmarks } from './types';

// Standard 21 MediaPipe Hand landmark connection pairs
export const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [5, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [9, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];

// Strictly warm palette colors (NO BLUE ANYWHERE)
const LINE_COLOR = '#B94E2F'; // Terracotta
const JOINT_FILL = '#FFF9F1'; // Cream
const JOINT_STROKE = '#C96332'; // Burnt Orange
const WRIST_COLOR = '#382116'; // Chocolate for wrist base

export function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  allLandmarks: HandLandmarks[],
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);

  for (const landmarks of allLandmarks) {
    if (!landmarks || landmarks.length !== 21) continue;

    // Draw skeletal connections
    ctx.lineWidth = 3;
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];
      if (!p1 || !p2) continue;

      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    }

    // Draw joint nodes
    for (let i = 0; i < landmarks.length; i++) {
      const pt = landmarks[i];
      const cx = pt.x * width;
      const cy = pt.y * height;
      const radius = i === 0 ? 6 : (i % 4 === 0 ? 5 : 3.5); // Fingertips and wrist slightly larger

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.fillStyle = i === 0 ? WRIST_COLOR : JOINT_FILL;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = JOINT_STROKE;
      ctx.stroke();
    }
  }
}
