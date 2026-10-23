import React from 'react';
import { Camera, Sparkles, CheckCircle2, Volume2, Shield } from 'lucide-react';

export const HeroGraphic: React.FC = () => {
  return (
    <div className="hero-graphic-card" aria-hidden="true">
      {/* Top Window Bar */}
      <div className="hero-graphic-header">
        <div className="window-dots">
          <span className="dot dot-brick" />
          <span className="dot dot-sand" />
          <span className="dot dot-olive" />
        </div>
        <div className="window-title">
          <Camera size={13} color="var(--sand)" />
          <span>SignText Vision Engine • Real-Time</span>
        </div>
        <div className="live-chip">
          <span className="live-pulse" />
          <span>30 FPS</span>
        </div>
      </div>

      {/* Simulated Live Camera & Hand Landmark Feed */}
      <div className="hero-viewfinder">
        {/* Subtle grid backdrop */}
        <div className="viewfinder-grid" />

        {/* 21-point Hand Landmark Skeleton Visualization (SVG) */}
        <svg viewBox="0 0 360 260" className="landmark-svg">
          {/* Skeleton Bones (Warm Terracotta / Burnt Orange) */}
          <g stroke="rgba(201, 99, 50, 0.75)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Palm Base to Wrist */}
            <line x1="180" y1="230" x2="180" y2="180" />
            <line x1="180" y1="230" x2="135" y2="200" />
            <line x1="180" y1="230" x2="225" y2="200" />

            {/* Thumb */}
            <line x1="135" y1="200" x2="110" y2="175" />
            <line x1="110" y1="175" x2="95" y2="150" />
            <line x1="95" y1="150" x2="85" y2="125" />

            {/* Index Finger */}
            <line x1="150" y1="175" x2="140" y2="130" />
            <line x1="140" y1="130" x2="135" y2="95" />
            <line x1="135" y1="95" x2="130" y2="65" />

            {/* Middle Finger */}
            <line x1="175" y1="175" x2="175" y2="120" />
            <line x1="175" y1="120" x2="175" y2="85" />
            <line x1="175" y1="85" x2="175" y2="55" />

            {/* Ring Finger */}
            <line x1="200" y1="180" x2="205" y2="135" />
            <line x1="205" y1="135" x2="210" y2="100" />
            <line x1="210" y1="100" x2="215" y2="75" />

            {/* Pinky Finger */}
            <line x1="225" y1="195" x2="238" y2="155" />
            <line x1="238" y1="155" x2="245" y2="125" />
            <line x1="245" y1="125" x2="250" y2="105" />

            {/* Palm Connections */}
            <line x1="135" y1="200" x2="150" y2="175" />
            <line x1="150" y1="175" x2="175" y2="175" />
            <line x1="175" y1="175" x2="200" y2="180" />
            <line x1="200" y1="180" x2="225" y2="195" />
          </g>

          {/* 21 Keypoint Joints (Cream core with Terracotta ring) */}
          <g fill="#FFF9F1" stroke="#B94E2F" strokeWidth="2">
            {/* Wrist */}
            <circle cx="180" cy="230" r="4.5" />
            {/* Thumb */}
            <circle cx="135" cy="200" r="3.5" />
            <circle cx="110" cy="175" r="3.5" />
            <circle cx="95" cy="150" r="3.5" />
            <circle cx="85" cy="125" r="4" fill="#C96332" />
            {/* Index */}
            <circle cx="150" cy="175" r="3.5" />
            <circle cx="140" cy="130" r="3.5" />
            <circle cx="135" cy="95" r="3.5" />
            <circle cx="130" cy="65" r="4" fill="#C96332" />
            {/* Middle */}
            <circle cx="175" cy="175" r="3.5" />
            <circle cx="175" cy="120" r="3.5" />
            <circle cx="175" cy="85" r="3.5" />
            <circle cx="175" cy="55" r="4" fill="#C96332" />
            {/* Ring */}
            <circle cx="200" cy="180" r="3.5" />
            <circle cx="205" cy="135" r="3.5" />
            <circle cx="210" cy="100" r="3.5" />
            <circle cx="215" cy="75" r="4" fill="#C96332" />
            {/* Pinky */}
            <circle cx="225" cy="195" r="3.5" />
            <circle cx="238" cy="155" r="3.5" />
            <circle cx="245" cy="125" r="3.5" />
            <circle cx="250" cy="105" r="4" fill="#C96332" />
          </g>
        </svg>

        {/* Real-time Recognition Proposal Badge */}
        <div className="recognition-overlay-pill">
          <Sparkles size={15} color="var(--cream)" />
          <span className="sign-name">Namaste (Hello)</span>
          <span className="confidence-pill">96% ISL</span>
        </div>

        {/* Tracking HUD Corner Markers */}
        <div className="corner-bracket top-left" />
        <div className="corner-bracket top-right" />
        <div className="corner-bracket bottom-left" />
        <div className="corner-bracket bottom-right" />
      </div>

      {/* Two-Way Conversation Simulation Stream */}
      <div className="hero-graphic-footer">
        <div className="hero-msg signer">
          <div className="msg-header">
            <span className="sender-tag">Signer (ISL)</span>
            <span className="msg-time">Just now</span>
          </div>
          <div className="msg-bubble">
            <p>"Hello! Where is the admissions counter?"</p>
            <CheckCircle2 size={13} color="var(--olive)" />
          </div>
        </div>

        <div className="hero-msg reply">
          <div className="msg-header">
            <span className="sender-tag staff">Help Desk Staff</span>
            <div className="tts-indicator">
              <Volume2 size={12} color="var(--terracotta)" />
              <span>TTS Audio Ready</span>
            </div>
          </div>
          <div className="msg-bubble reply-bubble">
            <p>"Please proceed to Room 104 on the first floor."</p>
          </div>
        </div>
      </div>

      {/* Privacy Guarantee Stamp */}
      <div className="hero-privacy-strip">
        <Shield size={13} color="var(--olive)" />
        <span>100% In-Browser MediaPipe Tasks Vision • Zero Server Video Upload</span>
      </div>
    </div>
  );
};
