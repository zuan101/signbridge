import React, { useState } from 'react';
import { X, Search, Sparkles, BookOpen, Hand, Hash, MessageCircle } from 'lucide-react';

interface GestureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode?: (mode: 'isl-fingerspelling' | 'isl-numbers' | 'isl-phrases') => void;
  activeMode?: string;
}

interface SignGuideItem {
  id: string;
  name: string;
  category: 'alphabet' | 'numbers' | 'phrases';
  summary: string;
  poseTip: string;
  distinctionTip?: string;
}

const ALPHABET_ITEMS: SignGuideItem[] = [
  { id: 'A', name: 'Letter A', category: 'alphabet', summary: 'Fist with thumb upright along side', poseTip: 'Curl all 4 fingers into a tight fist. Keep your thumb pointing straight up resting against the outer side of your index knuckle.', distinctionTip: 'Thumb stays on the side, NOT wrapped across the front (which is S).' },
  { id: 'B', name: 'Letter B', category: 'alphabet', summary: 'Four fingers straight up, thumb across palm', poseTip: 'Extend index, middle, ring, and pinky straight up touching together. Fold thumb flat across your palm.', distinctionTip: 'Keep all four fingers touching parallel.' },
  { id: 'C', name: 'Letter C', category: 'alphabet', summary: 'Curved open "C" cup profile', poseTip: 'Curve all fingers and thumb in an open arc facing sideways, like grasping a glass.', distinctionTip: 'Keep an open gap between thumb and fingertips (touching is O).' },
  { id: 'D', name: 'Letter D', category: 'alphabet', summary: 'Index straight up, thumb touches middle pad', poseTip: 'Point index finger straight up. Curl middle, ring, pinky down, with thumb touching middle fingertip.', distinctionTip: 'Only index points up.' },
  { id: 'E', name: 'Letter E', category: 'alphabet', summary: 'All fingers hooked tightly down onto thumb', poseTip: 'Curl all 4 fingertips down tightly so their tips press directly onto the top edge of your folded thumb.', distinctionTip: 'Thumb is tucked horizontally beneath all fingertips.' },
  { id: 'F', name: 'Letter F', category: 'alphabet', summary: 'Index and thumb form circle, other 3 up', poseTip: 'Touch index tip to thumb tip to form an "OK" circle. Keep middle, ring, and pinky extended straight up and spread.', distinctionTip: 'Opposite of D.' },
  { id: 'G', name: 'Letter G', category: 'alphabet', summary: 'Index pointing sideways, thumb parallel', poseTip: 'Turn hand sideways. Point index finger horizontally to the side, with thumb extended parallel above it.', distinctionTip: 'Only 1 finger points sideways.' },
  { id: 'H', name: 'Letter H', category: 'alphabet', summary: 'Index & middle together pointing sideways', poseTip: 'Extend both index and middle fingers together horizontally sideways. Fold ring and pinky into palm.', distinctionTip: 'Two fingers together sideways.' },
  { id: 'I', name: 'Letter I', category: 'alphabet', summary: 'Only pinky extended straight up', poseTip: 'Extend pinky straight up. Curl index, middle, ring into a fist with thumb folded over them.', distinctionTip: 'Only pinky is up.' },
  { id: 'J', name: 'Letter J', category: 'alphabet', summary: 'Pinky traces a "J" curve in the air', poseTip: 'Start with pinky up (like I) and draw a small curved "J" hook in the air from the wrist.', distinctionTip: 'Traces motion from I.' },
  { id: 'K', name: 'Letter K', category: 'alphabet', summary: 'Index up, middle forward/up, thumb between', poseTip: 'Index straight up, middle finger angled slightly forward/up, thumb tip placed between them at the knuckle.', distinctionTip: 'Thumb rests between index and middle.' },
  { id: 'L', name: 'Letter L', category: 'alphabet', summary: 'Index up, thumb extended sideways (~90°)', poseTip: 'Index finger straight up, thumb pointing horizontally outward to form an "L" shape. Other 3 fingers curled.', distinctionTip: 'Distinct 90° angle between thumb and index.' },
  { id: 'M', name: 'Letter M', category: 'alphabet', summary: '3 fingers folded over thumb', poseTip: 'Fold index, middle, and ring fingers down over your thumb so thumb peeks between ring and pinky.', distinctionTip: 'Three fingers over thumb.' },
  { id: 'N', name: 'Letter N', category: 'alphabet', summary: '2 fingers folded over thumb', poseTip: 'Fold index and middle fingers down over thumb so thumb peeks between middle and ring.', distinctionTip: 'Two fingers over thumb.' },
  { id: 'O', name: 'Letter O', category: 'alphabet', summary: 'All fingertips touch thumb tip forming "O"', poseTip: 'Curve all five fingers so all fingertips touch the thumb tip, creating a closed circle.', distinctionTip: 'Closed circle (C is open).' },
  { id: 'P', name: 'Letter P', category: 'alphabet', summary: 'K shape pointing downward', poseTip: 'Form K shape (index and middle with thumb between) and aim fingers downward towards the floor.', distinctionTip: 'Points downward.' },
  { id: 'Q', name: 'Letter Q', category: 'alphabet', summary: 'G shape pointing downward', poseTip: 'Index and thumb pointing downward like a downward pinch. Other fingers curled into palm.', distinctionTip: 'Index and thumb aim downward.' },
  { id: 'R', name: 'Letter R', category: 'alphabet', summary: 'Index and middle crossed together', poseTip: 'Extend index and middle straight up and cross middle over index finger (cross your fingers for luck).', distinctionTip: 'Fingers crossed.' },
  { id: 'S', name: 'Letter S', category: 'alphabet', summary: 'Fist with thumb across front of knuckles', poseTip: 'Make a tight fist and wrap your thumb horizontally across the front surface of your curled fingers.', distinctionTip: 'Thumb is on the FRONT surface (A is on the side).' },
  { id: 'T', name: 'Letter T', category: 'alphabet', summary: 'Thumb tucked between index and middle', poseTip: 'Make a fist with thumb tip wedged between index and middle knuckles.', distinctionTip: 'Thumb peeks between index & middle.' },
  { id: 'U', name: 'Letter U', category: 'alphabet', summary: 'Index and middle straight up touching parallel', poseTip: 'Extend index and middle fingers straight up held close together (touching). Thumb folded across palm.', distinctionTip: 'Fingers touching parallel (V is spread).' },
  { id: 'V', name: 'Letter V', category: 'alphabet', summary: 'Index and middle straight up spread in "V"', poseTip: 'Extend index and middle fingers straight up spread apart like a peace / victory sign.', distinctionTip: 'Fingers spread apart (U is touching).' },
  { id: 'W', name: 'Letter W', category: 'alphabet', summary: 'Index, middle, ring spread in "W"', poseTip: 'Extend index, middle, and ring fingers straight up and spread apart. Thumb holds pinky down.', distinctionTip: 'Three spread fingers.' },
  { id: 'X', name: 'Letter X', category: 'alphabet', summary: 'Index finger hooked / crooked', poseTip: 'Bend index finger at the first knuckle into a pirate hook. All other fingers curled into palm.', distinctionTip: 'Hooked index finger.' },
  { id: 'Y', name: 'Letter Y', category: 'alphabet', summary: 'Thumb and pinky extended wide ("shaka")', poseTip: 'Extend thumb and pinky wide to the sides. Keep index, middle, ring curled tightly into palm.', distinctionTip: '"Hang loose" / shaka shape.' },
  { id: 'Z', name: 'Letter Z', category: 'alphabet', summary: 'Index finger traces a "Z" path in the air', poseTip: 'Point index finger forward and trace the letter "Z" in the air from left to right, down-left, and right.', distinctionTip: 'Index pointing motion.' },
];

const NUMBERS_ITEMS: SignGuideItem[] = [
  { id: '0', name: 'Number 0', category: 'numbers', summary: 'Zero circle formed by thumb & fingertips', poseTip: 'Bring all fingertips and thumb together into a round closed "0" shape.' },
  { id: '1', name: 'Number 1', category: 'numbers', summary: 'Index finger extended straight up', poseTip: 'Extend index finger straight up. Fold middle, ring, pinky, and thumb into a fist.' },
  { id: '2', name: 'Number 2', category: 'numbers', summary: 'Index and middle fingers extended up', poseTip: 'Extend index and middle fingers straight up. Fold other fingers into palm.' },
  { id: '3', name: 'Number 3', category: 'numbers', summary: 'Index, middle, and ring fingers up', poseTip: 'Extend index, middle, and ring fingers up. Fold pinky and hold with thumb.' },
  { id: '4', name: 'Number 4', category: 'numbers', summary: 'Four fingers up, thumb folded across palm', poseTip: 'Extend all four fingers (index, middle, ring, pinky) straight up. Fold thumb across palm.' },
  { id: '5', name: 'Number 5', category: 'numbers', summary: 'All 5 fingers extended open wide', poseTip: 'Open entire hand with all five fingers spread wide facing the camera.' },
  { id: '6', name: 'Number 6', category: 'numbers', summary: 'Thumb touches pinky tip', poseTip: 'Touch thumb tip to pinky tip while keeping index, middle, and ring fingers extended up.' },
  { id: '7', name: 'Number 7', category: 'numbers', summary: 'Thumb touches ring finger tip', poseTip: 'Touch thumb tip to ring finger tip while keeping index, middle, and pinky extended up.' },
  { id: '8', name: 'Number 8', category: 'numbers', summary: 'Thumb touches middle finger tip', poseTip: 'Touch thumb tip to middle finger tip while keeping index, ring, and pinky extended up.' },
  { id: '9', name: 'Number 9', category: 'numbers', summary: 'Thumb touches index finger tip (OK loop)', poseTip: 'Touch thumb tip to index finger tip while keeping middle, ring, and pinky extended up.' },
];

const PHRASES_ITEMS: SignGuideItem[] = [
  { id: 'namaste', name: 'Namaste / Hello', category: 'phrases', summary: 'Two palms pressed together in front of chest', poseTip: 'Bring both hands together with open palms pressed together at chest level with a respectful nod.' },
  { id: 'thankyou', name: 'Thank You', category: 'phrases', summary: 'Flat hand at chin/chest extending forward', poseTip: 'Touch fingertips of dominant flat hand lightly to chin/lips, then move hand outward towards person.' },
  { id: 'wait', name: 'Please Wait', category: 'phrases', summary: 'Open flat palm facing camera', poseTip: 'Hold dominant hand open with palm facing camera, fingers together, indicating a gentle pause.' },
  { id: 'help', name: 'Help', category: 'phrases', summary: 'Fist resting on flat open palm', poseTip: 'Rest a closed dominant fist (thumb upright) onto the open palm of non-dominant hand; lift slightly.' },
  { id: 'yes', name: 'Yes / Agree', category: 'phrases', summary: 'Thumbs-up affirmative sign', poseTip: 'Form a thumbs-up gesture with thumb pointing straight up and nod hand slightly from wrist.' },
  { id: 'no', name: 'No / Disagree', category: 'phrases', summary: 'Index finger waving side-to-side', poseTip: 'Extend index finger and wave it gently side-to-side with a slight head shake.' },
  { id: 'good', name: 'Good / Fine', category: 'phrases', summary: 'Thumbs-up gesture', poseTip: 'Upright thumbs-up held steadily in front of chest.' },
  { id: 'where', name: 'Where?', category: 'phrases', summary: 'Both hands open palms facing upwards', poseTip: 'Hold both hands in front with palms facing up and fingers relaxed, moving side to side gently in question pose.' },
];

export const GestureGuideModal: React.FC<GestureGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  activeMode = 'isl-fingerspelling',
}) => {
  const [activeTab, setActiveTab] = useState<'alphabet' | 'numbers' | 'phrases'>(() => {
    if (activeMode === 'isl-numbers') return 'numbers';
    if (activeMode === 'isl-phrases') return 'phrases';
    return 'alphabet';
  });
  const [search, setSearch] = useState<string>('');

  if (!isOpen) return null;

  const currentList = activeTab === 'alphabet'
    ? ALPHABET_ITEMS
    : activeTab === 'numbers'
    ? NUMBERS_ITEMS
    : PHRASES_ITEMS;

  const filtered = currentList.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.summary.toLowerCase().includes(search.toLowerCase()) ||
    item.poseTip.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(39, 22, 14, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-title"
    >
      <div
        style={{
          backgroundColor: 'var(--cream)',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.1rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--ivory)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BookOpen size={20} color="var(--terracotta)" />
            <div>
              <h2 id="guide-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--chocolate)', margin: 0 }}>
                ISL Hand Gesture Visual Guide
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
                Exact pose instructions & disambiguation tips for accurate recognition
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Close guide"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', backgroundColor: 'var(--cream)' }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              className={`btn ${activeTab === 'alphabet' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => {
                setActiveTab('alphabet');
                if (onSelectMode) onSelectMode('isl-fingerspelling');
              }}
            >
              <Hand size={14} />
              <span>Alphabet A–Z ({ALPHABET_ITEMS.length})</span>
            </button>

            <button
              type="button"
              className={`btn ${activeTab === 'numbers' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => {
                setActiveTab('numbers');
                if (onSelectMode) onSelectMode('isl-numbers');
              }}
            >
              <Hash size={14} />
              <span>Numbers 0–9 ({NUMBERS_ITEMS.length})</span>
            </button>

            <button
              type="button"
              className={`btn ${activeTab === 'phrases' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => {
                setActiveTab('phrases');
                if (onSelectMode) onSelectMode('isl-phrases');
              }}
            >
              <MessageCircle size={14} />
              <span>Greetings & Phrases ({PHRASES_ITEMS.length})</span>
            </button>
          </div>

          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search size={14} color="var(--muted-text)" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2rem', paddingRight: '0.5rem', paddingTop: '0.25rem', paddingBottom: '0.25rem', fontSize: '0.8rem', width: '100%' }}
              placeholder="Filter gestures..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tricky Letters Banner for Alphabet Tab */}
        {activeTab === 'alphabet' && !search && (
          <div
            style={{
              padding: '0.6rem 1.5rem',
              backgroundColor: 'rgba(238, 220, 197, 0.45)',
              borderBottom: '1px solid var(--border)',
              fontSize: '0.75rem',
              color: 'var(--brown)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Sparkles size={14} color="var(--terracotta)" style={{ flexShrink: 0 }} />
            <span>
              <strong>Disambiguation Tips:</strong> <strong>A vs S:</strong> A has thumb upright on the lateral side; S has thumb wrapped across front knuckles. <strong>U vs V:</strong> U holds index & middle touching; V spreads them apart. <strong>L vs Z:</strong> L extends thumb out horizontally at 90°.
            </span>
          </div>
        )}

        {/* Cards Grid */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.85rem' }}>
          {filtered.map(item => (
            <div
              key={item.id}
              style={{
                backgroundColor: 'var(--ivory)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--terracotta)' }}>
                  {item.name}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--sand)',
                    color: 'var(--chocolate)',
                  }}
                >
                  {item.category.toUpperCase()}
                </span>
              </div>

              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--chocolate)' }}>
                {item.summary}
              </span>

              <p style={{ fontSize: '0.75rem', color: 'var(--brown)', margin: 0, lineHeight: 1.35 }}>
                {item.poseTip}
              </p>

              {item.distinctionTip && (
                <div
                  style={{
                    marginTop: 'auto',
                    padding: '0.35rem 0.5rem',
                    backgroundColor: 'rgba(238, 220, 197, 0.5)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.7rem',
                    color: 'var(--terracotta)',
                    fontWeight: 600,
                  }}
                >
                  Tip: {item.distinctionTip}
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: 'var(--muted-text)' }}>
              No gestures match "{search}".
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--ivory)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
            Hold any sign steadily for 0.3s to confirm. You can switch modes at any time.
          </span>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Got it, Let's Sign!
          </button>
        </div>
      </div>
    </div>
  );
};
