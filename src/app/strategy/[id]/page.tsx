'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Strategy, StrategySection, SECTION_LABELS } from '@/lib/types';
import { getStrategy, saveStrategy } from '@/lib/db';
import { ArrowLeft, Edit3, Lock, Download, Save, ChevronLeft, ChevronRight, Maximize2, Minimize2, Printer } from 'lucide-react';

interface SlideItem {
  id: string;
  type: string;
  title: string;
  content: string;
  color: string;
  badgeLabel: string;
  subtitle: string;
  order: number;
  isCustom?: boolean;
}

export default function StrategyViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';

  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit modal
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    setMounted(true);
    if (id) {
      const data = getStrategy(id);
      if (data) {
        setStrategy(data);
      } else {
        router.push('/');
      }
    }
  }, [id, router]);

  const buildSlides = useCallback((): SlideItem[] => {
    if (!strategy) return [];
    const slides: SlideItem[] = strategy.sections.map(s => ({
      id: s.id,
      type: s.type,
      title: s.title,
      content: s.content,
      color: s.color,
      badgeLabel: s.badgeLabel,
      subtitle: s.subtitle,
      order: s.order,
    }));
    // Add custom HTML files before contacts
    if (strategy.customHtmlFiles && strategy.customHtmlFiles.length > 0) {
      const contactIdx = slides.findIndex(s => s.type === 'contacts');
      const insertAt = contactIdx >= 0 ? contactIdx : slides.length;
      strategy.customHtmlFiles.forEach((f, i) => {
        slides.splice(insertAt + i, 0, {
          id: f.id,
          type: 'custom-html',
          title: f.name.replace(/\.html?$/i, ''),
          content: f.htmlContent,
          color: strategy.accentColor || '#e6194b',
          badgeLabel: 'Extra',
          subtitle: '',
          order: 900 + i,
          isCustom: true,
        });
      });
    }
    return slides;
  }, [strategy]);

  const slides = buildSlides();
  const total = slides.length;

  const navigate = useCallback((dir: number) => {
    setCurrentSlide(prev => Math.max(0, Math.min(prev + dir, total - 1)));
  }, [total]);

  const goToSection = useCallback((type: string) => {
    const idx = slides.findIndex(s => s.type === type);
    if (idx >= 0) setCurrentSlide(idx);
  }, [slides]);

  // Keyboard nav
  useEffect(() => {
    if (!mounted) return;
    function handleKey(e: KeyboardEvent) {
      if (editingId) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setCurrentSlide(prev => Math.min(prev + 1, total - 1));
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentSlide(prev => Math.max(prev - 1, 0));
      }
      if (e.key === 'Escape' && fullscreen) setFullscreen(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mounted, total, fullscreen, editingId]);

  // Touch nav
  useEffect(() => {
    if (!mounted) return;
    let startX = 0;
    function onStart(e: TouchEvent) { startX = e.touches[0].clientX; }
    function onEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) {
        setCurrentSlide(prev => dx < 0 ? Math.min(prev + 1, total - 1) : Math.max(prev - 1, 0));
      }
    }
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchend', onEnd);
    };
  }, [mounted, total]);

  function handleSave() {
    if (!strategy) return;
    setSaving(true);
    saveStrategy(strategy);
    setTimeout(() => setSaving(false), 800);
  }

  function openEdit(section: SlideItem) {
    setEditingId(section.id);
    setEditContent(section.content);
    setEditTitle(section.title);
  }

  function saveEdit() {
    if (!strategy || !editingId) return;
    const updated: Strategy = {
      ...strategy,
      sections: strategy.sections.map(s =>
        s.id === editingId ? { ...s, content: editContent, title: editTitle } : s
      ),
    };
    setStrategy(updated);
    saveStrategy(updated);
    setEditingId(null);
  }

  function handlePrint() {
    window.print();
  }

  // Loading
  if (!mounted || !strategy) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const progress = total > 0 ? ((currentSlide + 1) / total) * 100 : 0;
  const current = slides[currentSlide];
  const sectionTypes = Array.from(new Set(strategy.sections.map(s => s.type)));

  return (
    <div className={`min-h-screen ${fullscreen ? 'fixed inset-0 z-[9999]' : ''}`} style={{ background: 'var(--bg)' }}>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-4 py-2 no-print" style={{ background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => router.push('/')}>
            <ArrowLeft size={14} />
          </button>
          <div>
            <span style={{ fontFamily: 'var(--f)', fontWeight: 700, fontSize: 13, display: 'block' }}>{strategy.name}</span>
            <span style={{ fontSize: 10, color: 'var(--t3)' }}>{strategy.clientName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className={`btn-secondary ${editMode ? 'border-blue-400 text-blue-600' : ''}`} style={{ padding: '6px 14px', fontSize: 11 }} onClick={() => setEditMode(!editMode)}>
            {editMode ? <><Lock size={13} /> Blocca</> : <><Edit3 size={13} /> Modifica</>}
          </button>
          {editMode && (
            <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 11 }} onClick={handleSave}>
              <Save size={13} /> {saving ? 'Salvato!' : 'Salva'}
            </button>
          )}
          <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 11 }} onClick={handlePrint}>
            <Printer size={13} /> Stampa/PDF
          </button>
          <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => setFullscreen(!fullscreen)}>
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="progress-bar no-print" style={{ width: progress + '%' }} />

      {/* Slides */}
      <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        {slides.map((s, i) => (
          <div key={s.id} className={`slide ${i === currentSlide ? 'active' : ''}`}>
            <div className="slide-inner">
              {s.type === 'custom-html' ? (
                <div className="anim" dangerouslySetInnerHTML={{ __html: s.content }} />
              ) : s.type === 'cover' ? (
                <CoverSlide strategy={strategy} />
              ) : s.type === 'index' ? (
                <IndexSlide strategy={strategy} goToSection={goToSection} />
              ) : (
                <StandardSlide slide={s} editMode={editMode} onEdit={() => openEdit(s)} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-[200] no-print" style={{ background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(16px)', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 0, padding: '6px 16px 4px', justifyContent: 'center', flexWrap: 'nowrap', overflowX: 'auto' }}>
          {sectionTypes.map(type => (
            <button key={type} className={`dock-item ${current && current.type === type ? 'active' : ''}`} onClick={() => goToSection(type)}>
              {SECTION_LABELS[type] || type}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 py-2 px-5">
          <button className="btn-secondary" style={{ padding: '6px 16px', fontSize: 11, opacity: currentSlide === 0 ? .3 : 1 }} onClick={() => navigate(-1)}>
            <ChevronLeft size={14} /> Precedente
          </button>
          <span style={{ fontFamily: 'var(--f)', fontSize: 11, color: 'var(--t3)', minWidth: 60, textAlign: 'center' }}>
            {currentSlide + 1} / {total}
          </span>
          <button className="btn-primary" style={{ padding: '6px 16px', fontSize: 11, opacity: currentSlide === total - 1 ? .3 : 1 }} onClick={() => navigate(1)}>
            Successiva <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Edit modal */}
      {editingId && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full rounded-2xl p-6" style={{ maxWidth: 700, maxHeight: '85vh', overflowY: 'auto', background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: 'var(--f)', fontWeight: 700, fontSize: 16 }}>Modifica Sezione</h3>
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50" style={{ border: '1px solid var(--border)' }} onClick={() => setEditingId(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: 'var(--f)', fontSize: 11, fontWeight: 600, color: 'var(--t3)', display: 'block', marginBottom: 6 }}>TITOLO</label>
              <input className="form-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: 'var(--f)', fontSize: 11, fontWeight: 600, color: 'var(--t3)', display: 'block', marginBottom: 6 }}>CONTENUTO HTML</label>
              <textarea className="form-textarea" style={{ minHeight: 350, fontFamily: 'monospace', fontSize: 12 }} value={editContent} onChange={e => setEditContent(e.target.value)} />
            </div>
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setEditingId(null)}>Annulla</button>
              <button className="btn-primary" onClick={saveEdit}><Save size={14} /> Salva modifiche</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== SLIDE COMPONENTS ====================

function CoverSlide({ strategy }: { strategy: Strategy }) {
  const accent = strategy.accentColor || '#e6194b';
  const dateStr = new Date(strategy.createdAt).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: 'calc(100vh - 200px)', position: 'relative' }}>
      <div className="cover-paths">
        <svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          <path d="M0,400 Q300,100 600,400 T1200,400" strokeWidth="1" />
          <path d="M0,300 Q400,600 800,300 T1200,500" strokeWidth="1" />
          <path d="M0,500 Q200,200 500,500 T1000,300" strokeWidth="1" />
        </svg>
      </div>
      <div className="anim" style={{ animationDelay: '.1s' }}>
        <div className="section-badge" style={{ background: accent + '15', border: '1px solid ' + accent + '30', color: accent, marginBottom: 16 }}>
          {strategy.subtitle}
        </div>
      </div>
      <h1 className="anim" style={{ fontFamily: 'var(--f)', fontWeight: 800, fontSize: 'clamp(28px, 5vw, 52px)', lineHeight: 1.1, marginBottom: 12, animationDelay: '.2s', maxWidth: 700 }}>
        {strategy.name}
      </h1>
      <p className="anim" style={{ fontSize: 18, color: 'var(--t2)', animationDelay: '.3s', marginBottom: 20 }}>
        {strategy.clientName}
      </p>
      <div className="anim flex items-center gap-3" style={{ animationDelay: '.4s' }}>
        <div style={{ width: 48, height: 2, borderRadius: 1, background: accent }} />
        <span style={{ fontFamily: 'var(--f)', fontSize: 11, fontWeight: 600, color: 'var(--t3)', letterSpacing: 1 }}>{dateStr}</span>
        <div style={{ width: 48, height: 2, borderRadius: 1, background: accent }} />
      </div>
    </div>
  );
}

function IndexSlide({ strategy, goToSection }: { strategy: Strategy; goToSection: (t: string) => void }) {
  const sections = strategy.sections.filter(s => s.type !== 'cover' && s.type !== 'index');
  return (
    <>
      <div className="sec-line anim" style={{ background: 'linear-gradient(90deg, var(--edu), var(--accent))' }} />
      <div className="section-badge anim" style={{ background: 'rgba(27,58,123,.06)', border: '1px solid rgba(27,58,123,.12)', color: 'var(--edu)' }}>Sommario</div>
      <h2 className="slide-title anim">Indice della Presentazione</h2>
      <div className="grid-2 anim" style={{ marginTop: 16 }}>
        {sections.map((s, i) => (
          <button key={s.id} className="content-card flex items-center gap-3 text-left cursor-pointer" onClick={() => goToSection(s.type)} style={{ padding: '12px 16px', transition: '.2s', border: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--f)', fontSize: 16, fontWeight: 800, minWidth: 28, color: s.color }}>{String(i + 1).padStart(2, '0')}</span>
            <div>
              <span style={{ fontFamily: 'var(--f)', fontSize: 12, fontWeight: 600, display: 'block' }}>{s.title}</span>
              <span style={{ fontSize: 10, color: 'var(--t3)' }}>{s.badgeLabel}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

function StandardSlide({ slide, editMode, onEdit }: { slide: SlideItem; editMode: boolean; onEdit: () => void }) {
  const color = slide.color || 'var(--accent)';
  return (
    <>
      <div className="sec-line anim" style={{ background: 'linear-gradient(90deg, ' + color + ', #3b82f6)' }} />
      <div className="section-badge anim" style={{ background: color + '15', border: '1px solid ' + color + '30', color: color }}>{slide.badgeLabel}</div>
      <div className="flex items-center justify-between w-full anim" style={{ maxWidth: 960 }}>
        <h2 className="slide-title">{slide.title}</h2>
        {editMode && (
          <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: 11 }} onClick={onEdit}><Edit3 size={12} /> Modifica</button>
        )}
      </div>
      {slide.subtitle && (
        <p className="anim" style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.6, maxWidth: 800, marginBottom: 16 }}>{slide.subtitle}</p>
      )}
      <div className="w-full anim" style={{ maxWidth: 960 }} dangerouslySetInnerHTML={{ __html: slide.content }} />
    </>
  );
}
