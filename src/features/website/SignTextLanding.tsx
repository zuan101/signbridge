import React, { useState } from 'react';
import { 
  Camera, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  ChevronDown, 
  Volume2, 
  Zap, 
  CheckCircle2, 
  Sun, 
  Moon, 
  Menu, 
  X,
  BookOpen,
  Type,
  Hash,
  Hand
} from 'lucide-react';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { HeroGraphic } from './HeroGraphic';

interface SignTextLandingProps {
  onNavigateToApp: () => void;
  onNavigateToLogin: () => void;
  onNavigateToSignUp: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'How does SignText translate Indian Sign Language?',
    answer: 'SignText runs local on-device computer vision through MediaPipe Tasks Vision to detect 21 hand landmarks per hand at up to 30 FPS. Candidate hand geometries are evaluated against verified ISL sign definitions. When a sign is recognized with high confidence, it appears as an editable proposal in the composer for the signer to review, edit, and confirm before sending.'
  },
  {
    question: 'Does SignText record, upload, or save my webcam footage?',
    answer: 'Absolutely not. All computer-vision frame analysis executes strictly inside your browser memory using WebAssembly. SignText never uploads, records, or persists camera footage to any remote server or cloud infrastructure. You can stop the camera at any second with a single click.'
  },
  {
    question: 'What signs are currently supported by the recognition engine?',
    answer: 'The system features three dedicated recognition modes: (1) Complete Alphabet A–Z fingerspelling with hold-to-confirm typing, double-letter relaxation, and 200+ word dictionary suggestions; (2) Dedicated single-handed Numbers 0 through 9; and (3) Conversational Greetings & Phrases including Namaste / Hello, Thank You, Please Wait, Help, Yes / Agree, No / Disagree, Good / Fine, and Where?.'
  },
  {
    question: 'How does SignBridge prevent confusing lookalike letters like A vs S or U vs V?',
    answer: 'SignBridge uses 3D spatial invariant joint angles and strict anatomical knuckle/thumb constraints. For example, letter A requires an upright thumb resting on the lateral edge of the index knuckle, whereas S requires the thumb wrapped horizontally across front knuckles. Similarly, U requires index and middle fingers touching parallel, whereas V requires them spread wide.'
  },
  {
    question: 'Can I communicate if my camera or recognition model is unavailable?',
    answer: 'Yes! SignText is a full two-way communication application. Even without a webcam or if tracking is paused, both participants can type in the conversation thread, use quick-reply shortcuts, and use browser Text-To-Speech to speak replies aloud.'
  },
  {
    question: 'How does the demo access work without creating an account?',
    answer: 'This demo build requires zero database setup and stores no account credentials. You can click "Try SignText for Free" or submit any valid email and password on the Log In / Sign Up pages to immediately launch the live workspace.'
  }
];

export const SignTextLanding: React.FC<SignTextLandingProps> = ({
  onNavigateToApp,
  onNavigateToLogin,
  onNavigateToSignUp,
  theme,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(prev => (prev === index ? null : index));
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`landing-page ${theme === 'dark' ? 'landing-dark' : 'landing-light'}`}>
      {/* TOP NAVIGATION BAR */}
      <header className="landing-navbar" role="banner">
        <div className="landing-nav-inner">
          {/* Brand Logo */}
          <div className="landing-brand" onClick={() => scrollToSection('hero')} role="button" tabIndex={0}>
            <BrandLogo size={36} />
            <div className="brand-text-block">
              <span className="brand-name">SignText</span>
              <span className="brand-badge">ISL Vision</span>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="landing-nav-links" aria-label="Website Navigation">
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection('hero')}>
              Home
            </button>
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection('how-it-works')}>
              How It Works
            </button>
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection('recognition-modes')}>
              Modes
            </button>
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection('about')}>
              About
            </button>
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection('benefits')}>
              Benefits
            </button>
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection('faq')}>
              FAQ
            </button>
          </nav>

          {/* Right Action Items */}
          <div className="landing-nav-actions">
            {/* Theme Toggle Button */}
            <button
              type="button"
              className="btn btn-icon theme-toggle-btn"
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Warm Light' : 'Dark Charcoal'} theme`}
              aria-label="Toggle visual theme"
            >
              {theme === 'dark' ? <Sun size={18} color="var(--sand)" /> : <Moon size={18} color="var(--chocolate)" />}
            </button>

            {/* Log In */}
            <button
              type="button"
              className="btn-nav-ghost"
              onClick={onNavigateToLogin}
            >
              Log in
            </button>

            {/* Sign Up */}
            <button
              type="button"
              className="btn-nav-primary"
              onClick={onNavigateToSignUp}
            >
              <span>Sign up</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="landing-mobile-menu" role="dialog" aria-label="Mobile Navigation Menu">
            <button type="button" className="mobile-nav-link" onClick={() => scrollToSection('hero')}>
              Home
            </button>
            <button type="button" className="mobile-nav-link" onClick={() => scrollToSection('how-it-works')}>
              How It Works
            </button>
            <button type="button" className="mobile-nav-link" onClick={() => scrollToSection('recognition-modes')}>
              Modes
            </button>
            <button type="button" className="mobile-nav-link" onClick={() => scrollToSection('about')}>
              About
            </button>
            <button type="button" className="mobile-nav-link" onClick={() => scrollToSection('benefits')}>
              Benefits
            </button>
            <button type="button" className="mobile-nav-link" onClick={() => scrollToSection('faq')}>
              FAQ
            </button>
            <div className="mobile-menu-divider" />
            <div className="mobile-menu-actions">
              <button type="button" className="btn btn-secondary w-full" onClick={onNavigateToLogin}>
                Log in
              </button>
              <button type="button" className="btn btn-primary w-full" onClick={onNavigateToSignUp}>
                Sign up
              </button>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section id="hero" className="landing-section hero-section">
        <div className="landing-container hero-layout">
          {/* Left Column: Hero Copy */}
          <div className="hero-text-content">
            <div className="hero-eyebrow">
              <Sparkles size={14} color="var(--terracotta)" />
              <span>Accessible Campus Communication • Indian Sign Language</span>
            </div>

            <h1 className="hero-headline">
              Translate Sign Language into Clear Text Instantly
            </h1>

            <p className="hero-description">
              Convert Indian Sign Language gestures into written words in real time. Designed for college reception desks, admissions counters, and barrier-free two-way conversations.
            </p>

            <div className="hero-cta-group">
              <button
                type="button"
                className="btn-hero-primary"
                onClick={onNavigateToApp}
              >
                <span>Try SignText for Free</span>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="btn-hero-secondary"
                onClick={() => scrollToSection('how-it-works')}
              >
                <span>See How It Works</span>
              </button>
            </div>

            <div className="hero-trust-row">
              <div className="trust-item">
                <CheckCircle2 size={16} color="var(--olive)" />
                <span>Zero Cloud Video Upload</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={16} color="var(--olive)" />
                <span>Runs 100% Locally in Browser</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={16} color="var(--olive)" />
                <span>Two-Way Speech Synthesis</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Graphic Panel */}
          <div className="hero-graphic-col">
            <HeroGraphic />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="landing-section section-elevated">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-eyebrow">Core Workflow</span>
            <h2 className="section-title">How SignText Works</h2>
            <p className="section-subtitle">
              Four simple, privacy-first steps enable seamless communication between Deaf signers and hearing staff.
            </p>
          </div>

          <div className="how-it-works-grid">
            {/* Card 1 */}
            <div className="feature-card">
              <div className="card-step-badge">01</div>
              <div className="card-icon-box">
                <Camera size={26} color="var(--terracotta)" />
              </div>
              <h3 className="card-title">Start Camera</h3>
              <p className="card-text">
                Explicit single-click webcam activation. Camera tracks run entirely on your local machine and stop instantly on command.
              </p>
            </div>

            {/* Card 2 */}
            <div className="feature-card">
              <div className="card-step-badge">02</div>
              <div className="card-icon-box">
                <Sparkles size={26} color="var(--terracotta)" />
              </div>
              <h3 className="card-title">Track Gestures</h3>
              <p className="card-text">
                MediaPipe HandLandmarker extracts 21 spatial landmarks per hand in real-time, tracking joint angles and wrist orientation.
              </p>
            </div>

            {/* Card 3 */}
            <div className="feature-card">
              <div className="card-step-badge">03</div>
              <div className="card-icon-box">
                <FileText size={26} color="var(--terracotta)" />
              </div>
              <h3 className="card-title">Translate to Text</h3>
              <p className="card-text">
                Recognized signs appear as candidate proposals in an editable composer. The signer reviews and confirms before sending.
              </p>
            </div>

            {/* Card 4 */}
            <div className="feature-card">
              <div className="card-step-badge">04</div>
              <div className="card-icon-box">
                <ShieldCheck size={26} color="var(--olive)" />
              </div>
              <h3 className="card-title">Secure & Private</h3>
              <p className="card-text">
                Zero video footage leaves your machine. Local transcripts are stored only if you choose, and can be cleared with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RECOGNITION MODES & DISAMBIGUATION SECTION */}
      <section id="recognition-modes" className="landing-section">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-eyebrow">High Accuracy ISL Engine</span>
            <h2 className="section-title">Dedicated Modes for Zero Confusion</h2>
            <p className="section-subtitle">
              By separating alphabet fingerspelling, numeric digits, and conversational whole-signs into dedicated operating modes, SignBridge eliminates false classifications between lookalike hand poses.
            </p>
          </div>

          <div className="how-it-works-grid">
            <div className="feature-card">
              <div className="card-icon-box">
                <Type size={26} color="var(--terracotta)" />
              </div>
              <h3 className="card-title">Alphabet (A–Z) Fingerspelling</h3>
              <p className="card-text">
                Continuous hold-to-confirm letter typing. Strict spatial knuckle geometry separates tricky pairs like A vs S vs E vs T and U vs V. Powered by 200+ word ISL dictionary autocomplete.
              </p>
            </div>

            <div className="feature-card">
              <div className="card-icon-box">
                <Hash size={26} color="var(--terracotta)" />
              </div>
              <h3 className="card-title">Dedicated Numbers (0–9)</h3>
              <p className="card-text">
                Isolated numerical digit classification prevents numbers from colliding with letters. Instantly switchable from the camera header or settings for inputting phone numbers, counter IDs, or years.
              </p>
            </div>

            <div className="feature-card">
              <div className="card-icon-box">
                <Hand size={26} color="var(--terracotta)" />
              </div>
              <h3 className="card-title">Conversational Signs</h3>
              <p className="card-text">
                Instant one-pose recognition of high-frequency ISL interactions: Namaste / Hello, Thank You, Please Wait, Help, Yes, No, Good, and Where. Speeds up common counter dialogue.
              </p>
            </div>

            <div className="feature-card">
              <div className="card-icon-box">
                <BookOpen size={26} color="var(--olive)" />
              </div>
              <h3 className="card-title">Interactive Visual Guide</h3>
              <p className="card-text">
                On-demand visual cheat-sheet with clear pose instructions and disambiguation tips for Alphabet, Numbers, and Greetings. Signers can reference it anytime right inside the workspace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="landing-section section-elevated">
        <div className="landing-container about-grid">
          <div className="about-content">
            <span className="section-eyebrow">Purpose & Mission</span>
            <h2 className="section-title">Built for Real Counter Conversations</h2>
            <p className="about-text">
              Every day at college reception desks, library circulation counters, and administrative offices, Deaf and hard-of-hearing students encounter unnecessary communication barriers.
            </p>
            <p className="about-text">
              SignText was designed specifically for shared-screen counter interaction: the signer uses hand gestures captured by the webcam, while the receptionist reads messages and types back. Replies can be read on screen or spoken aloud using Web Speech synthesis.
            </p>
            <div className="about-highlight-box">
              <strong>Honest Recognition Philosophy</strong>
              <p>
                Indian Sign Language is a complete natural language with rich grammatical depth. SignText never fabricates guesses or claims full sentence translation. It classifies verified static signs honestly and provides manual aids when gestures are uncertain.
              </p>
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onNavigateToApp}
              >
                <BookOpen size={16} />
                <span>Explore Verified ISL Vocabulary</span>
              </button>
            </div>
          </div>

          <div className="about-stats-panel">
            <div className="stat-card">
              <span className="stat-number">21</span>
              <span className="stat-label">Landmarks Tracked Per Hand</span>
              <p className="stat-desc">Complete 3D spatial joint coordinates processed every frame.</p>
            </div>
            <div className="stat-card">
              <span className="stat-number">30 FPS</span>
              <span className="stat-label">Smooth Real-Time Loop</span>
              <p className="stat-desc">Optimized inference eliminates UI stutter and video lag.</p>
            </div>
            <div className="stat-card">
              <span className="stat-number">0 bytes</span>
              <span className="stat-label">Cloud Video Transferred</span>
              <p className="stat-desc">All inference runs locally in browser memory via WebAssembly.</p>
            </div>
            <div className="stat-card">
              <span className="stat-number">2-Way</span>
              <span className="stat-label">Shared Screen Dialogue</span>
              <p className="stat-desc">Sign-to-text input paired with typed and spoken speech output.</p>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section id="benefits" className="landing-section section-elevated">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-eyebrow">Why Choose SignText</span>
            <h2 className="section-title">Designed for Trust, Speed, and Inclusion</h2>
            <p className="section-subtitle">
              Engineered from the ground up to respect user dignity, accessibility standards, and privacy requirements.
            </p>
          </div>

          <div className="benefits-grid">
            <div className="benefit-card">
              <Zap size={24} color="var(--burnt-orange)" />
              <h3 className="benefit-title">Ultra-Low Latency</h3>
              <p className="benefit-text">
                Local WebAssembly vision models eliminate network round-trips, ensuring instant responsiveness without network buffering.
              </p>
            </div>

            <div className="benefit-card">
              <Volume2 size={24} color="var(--burnt-orange)" />
              <h3 className="benefit-title">Two-Way Speech Synthesis</h3>
              <p className="benefit-text">
                Hearing counter personnel can speak their replies aloud via the browser Web Speech API, with adjustable rate and pitch.
              </p>
            </div>

            <div className="benefit-card">
              <ShieldCheck size={24} color="var(--olive)" />
              <h3 className="benefit-title">Zero-Knowledge Hardware Privacy</h3>
              <p className="benefit-text">
                Camera access requires explicit user confirmation. Video frames are analyzed in-memory and discarded immediately after processing.
              </p>
            </div>

            <div className="benefit-card">
              <BookOpen size={24} color="var(--burnt-orange)" />
              <h3 className="benefit-title">Offline & Autonomous</h3>
              <p className="benefit-text">
                Bundled local model and WASM binaries enable SignText to run in air-gapped rooms or areas with spotty connectivity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="landing-section">
        <div className="landing-container faq-container">
          <div className="section-header">
            <span className="section-eyebrow">Frequently Asked Questions</span>
            <h2 className="section-title">Got Questions? We Have Answers</h2>
            <p className="section-subtitle">
              Everything you need to know about SignText, gesture recognition accuracy, and data security.
            </p>
          </div>

          <div className="faq-accordion" role="region" aria-label="FAQ Accordion">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={faq.question} className={`faq-item ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <ChevronDown size={20} className={`faq-chevron ${isOpen ? 'rotate' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="faq-answer-panel">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="landing-cta-banner">
        <div className="landing-container cta-banner-inner">
          <div className="cta-banner-text">
            <h2>Ready to experience barrier-free communication?</h2>
            <p>Launch the live Indian Sign Language workspace in your browser right now.</p>
          </div>
          <button
            type="button"
            className="btn-cta-launch"
            onClick={onNavigateToApp}
          >
            <span>Launch SignText Workspace</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer" role="contentinfo">
        <div className="landing-container footer-layout">
          <div className="footer-brand-col">
            <div className="landing-brand">
              <BrandLogo size={32} />
              <div className="brand-text-block">
                <span className="brand-name">SignText</span>
                <span className="brand-badge">ISL Vision</span>
              </div>
            </div>
            <p className="footer-tagline">
              Every gesture deserves to be understood. Empowering inclusive counter conversations across colleges and public institutions.
            </p>
            <div className="footer-privacy-badge">
              <ShieldCheck size={14} color="var(--olive)" />
              <span>100% In-Browser Vision • Zero Video Storage</span>
            </div>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-col-title">Navigation</h4>
            <ul>
              <li><button type="button" onClick={() => scrollToSection('hero')}>Home</button></li>
              <li><button type="button" onClick={() => scrollToSection('how-it-works')}>How It Works</button></li>
              <li><button type="button" onClick={() => scrollToSection('about')}>About SignText</button></li>
              <li><button type="button" onClick={() => scrollToSection('benefits')}>Key Benefits</button></li>
              <li><button type="button" onClick={() => scrollToSection('faq')}>FAQ</button></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-col-title">Account & Demo</h4>
            <ul>
              <li><button type="button" onClick={onNavigateToLogin}>Log in (Demo)</button></li>
              <li><button type="button" onClick={onNavigateToSignUp}>Sign up (Free Demo)</button></li>
              <li><button type="button" onClick={onNavigateToApp}>Live Workspace</button></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-col-title">Engine & Resources</h4>
            <ul>
              <li><button type="button" onClick={onNavigateToApp}>ISL Vocabulary Reference</button></li>
              <li><button type="button" onClick={onNavigateToApp}>Hardware & Privacy Specs</button></li>
              <li><button type="button" onClick={onNavigateToApp}>Keyboard Shortcuts (?)</button></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="landing-container bottom-bar-inner">
            <span>© {new Date().getFullYear()} SignText / SignBridge. Open source under MIT License.</span>
            <span>Hacktofest Open Source Stream • Built for Accessibility</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
