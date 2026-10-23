import React, { useState, useMemo } from 'react';
import { Search, ExternalLink, CheckCircle2, BookOpen, Hand, Sparkles } from 'lucide-react';
import { VERIFIED_ISL_SIGNS, type SignItem } from './signsData';

interface LearnSignsViewProps {
  onPracticeSign?: (signName: string) => void;
}

export const LearnSignsView: React.FC<LearnSignsViewProps> = ({ onPracticeSign }) => {
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Greetings', 'Help', 'Directions', 'Common Phrases', 'Numbers', 'Campus'];

  const filteredSigns = useMemo(() => {
    return VERIFIED_ISL_SIGNS.filter(sign => {
      const matchesCategory = selectedCategory === 'All' || sign.category === selectedCategory;
      const matchesSearch =
        sign.name.toLowerCase().includes(search.toLowerCase()) ||
        sign.meaning.toLowerCase().includes(search.toLowerCase()) ||
        sign.instructions.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--chocolate)' }}>
          Learn Indian Sign Language (ISL)
        </h1>
        <p style={{ color: 'var(--muted-text)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
          Verified signs referenced from the Indian Sign Language Research and Training Centre (ISLRTC).
        </p>
      </div>

      {/* Attribution Card */}
      <div
        style={{
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--cream)',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <BookOpen size={24} color="var(--terracotta)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--chocolate)' }}>
          <strong>Linguistic Standard & Authority:</strong>
          <p style={{ marginTop: '0.25rem', color: 'var(--brown)' }}>
            Indian Sign Language is an autonomous, natural visual-spatial language with distinct grammar and two-handed fingerspelling. All signs below are cataloged according to the official ISLRTC standards under the Ministry of Social Justice and Empowerment, Government of India.
          </p>
          <a
            href="https://islrtc.nic.in"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: 'var(--terracotta)',
              fontWeight: 600,
              marginTop: '0.4rem',
              textDecoration: 'none',
            }}
          >
            <span>Visit official ISLRTC dictionary portal</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            color="var(--muted-text)"
            style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ width: '100%', paddingLeft: '2.5rem' }}
            placeholder="Search signs by name, meaning, or instruction..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search signs"
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              className={`chip ${selectedCategory === cat ? 'active' : ''}`}
              style={{
                backgroundColor: selectedCategory === cat ? 'var(--terracotta)' : 'var(--cream)',
                color: selectedCategory === cat ? 'var(--cream)' : 'var(--chocolate)',
                borderColor: selectedCategory === cat ? 'var(--terracotta)' : 'var(--border)',
              }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Signs Grid */}
      {filteredSigns.length === 0 ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: 'var(--cream)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--muted-text)',
          }}
        >
          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--chocolate)' }}>
            No signs found matching your search.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: '0.75rem' }}
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
            }}
          >
            Clear Search & Filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredSigns.map((sign: SignItem) => (
            <div
              key={sign.id}
              style={{
                backgroundColor: 'var(--cream)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--chocolate)', fontWeight: 700 }}>
                    {sign.name}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--brown)',
                      backgroundColor: 'var(--sand)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      display: 'inline-block',
                      marginTop: '0.25rem',
                      fontWeight: 600,
                    }}
                  >
                    {sign.category} • {sign.handshapeType}
                  </span>
                </div>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(101, 120, 75, 0.15)',
                    color: 'var(--olive)',
                    fontWeight: 700,
                  }}
                  title="Verified against ISLRTC repository"
                >
                  <CheckCircle2 size={12} />
                  <span>Verified ISL</span>
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--chocolate)' }}>
                <strong>Meaning: </strong>
                <span>{sign.meaning}</span>
              </div>

              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--brown)',
                  backgroundColor: 'var(--ivory)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  lineHeight: 1.45,
                }}
              >
                <strong>How to sign: </strong>
                {sign.instructions}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: sign.classifierSupported ? 'var(--olive)' : 'var(--muted-text)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Hand size={13} />
                  <span>{sign.classifierSupported ? 'Supported by live classifier' : 'Educational sign reference'}</span>
                </span>

                {sign.classifierSupported && onPracticeSign && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                    onClick={() => onPracticeSign(sign.name)}
                  >
                    <Sparkles size={13} />
                    <span>Practice Sign</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
