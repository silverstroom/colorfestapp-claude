'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Strategy, SECTION_TEMPLATES, StrategySection, CustomHtmlFile } from '@/lib/types';
import { saveStrategy, generateId } from '@/lib/db';
import { ArrowLeft, Upload, FileCode, Trash2, Sparkles, CheckCircle2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const GEN_STEPS = [
  { label: 'Analisi del testo fornito', icon: '📝' },
  { label: 'Strutturazione delle sezioni', icon: '🏗️' },
  { label: 'Creazione della Cover', icon: '🎨' },
  { label: 'Generazione Identità del Brand', icon: '🔍' },
  { label: 'Analisi Social & Competitor', icon: '📊' },
  { label: 'Definizione Buyer Personas', icon: '👥' },
  { label: 'Elaborazione SWOT', icon: '⚡' },
  { label: 'Composizione contenuti visivi', icon: '🖼️' },
  { label: 'Creazione fasi operative', icon: '📋' },
  { label: 'Integrazione file HTML custom', icon: '🔗' },
  { label: 'Finalizzazione presentazione', icon: '✅' },
];

export default function NewStrategyPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<'form' | 'loading' | 'done'>('form');
  const [genStep, setGenStep] = useState(0);
  const [genId, setGenId] = useState('');

  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [accentColor, setAccentColor] = useState('#e6194b');
  const [mainText, setMainText] = useState('');
  const [htmlFiles, setHtmlFiles] = useState<CustomHtmlFile[]>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [sectionTexts, setSectionTexts] = useState<Record<string, string>>({});

  function toggleSection(type: string) {
    setOpenSections(prev => ({ ...prev, [type]: !prev[type] }));
  }

  async function handleHtmlUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const text = await file.text();
      setHtmlFiles(prev => [...prev, { id: generateId(), name: file.name, htmlContent: text }]);
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleGenerate() {
    if (!name.trim()) return;
    setPhase('loading');

    const sid = generateId();

    for (let i = 0; i < GEN_STEPS.length; i++) {
      setGenStep(i);
      await new Promise(r => setTimeout(r, 350 + Math.random() * 300));
    }

    const now = new Date().toISOString();
    const sections: StrategySection[] = SECTION_TEMPLATES.map(tmpl => ({
      id: generateId(),
      type: tmpl.type,
      title: tmpl.title,
      subtitle: tmpl.subtitle,
      color: tmpl.color,
      badgeLabel: tmpl.badgeLabel,
      order: tmpl.order,
      content: buildContent(tmpl.type, sectionTexts[tmpl.type] || '', mainText, clientName, name),
    }));

    const strategy: Strategy = {
      id: sid,
      name,
      clientName: clientName || 'Cliente',
      subtitle: subtitle || 'Strategia Social Media',
      createdAt: now,
      updatedAt: now,
      sections,
      customHtmlFiles: htmlFiles,
      accentColor,
    };

    saveStrategy(strategy);
    setGenId(sid);
    setPhase('done');
  }

  // === LOADING SCREEN ===
  if (phase === 'loading' || phase === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div className="w-full" style={{ maxWidth: 500 }}>
          <div className="text-center mb-8">
            <h2 style={{ fontFamily: 'var(--f)', fontWeight: 800, fontSize: 24, marginBottom: 6 }}>
              {phase === 'done' ? 'Strategia Creata!' : 'Generazione in corso...'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--t2)' }}>
              {phase === 'done' ? `"${name}" è pronta.` : 'Stiamo costruendo la tua presentazione.'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {GEN_STEPS.map((gs, i) => {
              const done = phase === 'done' || i < genStep;
              const active = phase !== 'done' && i === genStep;
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{
                  background: 'var(--card)', border: '1px solid',
                  borderColor: active ? 'var(--accent)' : done ? 'var(--green)' : 'var(--border)',
                  boxShadow: active ? '0 2px 16px rgba(230,25,75,.1)' : 'none',
                  transition: 'all .5s',
                }}>
                  <div className={active ? 'step-dot-active' : ''} style={{ width: 10, height: 10, borderRadius: '50%', background: done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--t3)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--f)', fontSize: 13, fontWeight: 500, flex: 1, color: done ? 'var(--green)' : active ? 'var(--t1)' : 'var(--t3)' }}>
                    {gs.icon} {gs.label}
                  </span>
                  {done && <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />}
                  {active && <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent)' }} />}
                </div>
              );
            })}
          </div>
          {phase === 'done' && (
            <div className="flex gap-3 justify-center mt-8">
              <button className="btn-primary" onClick={() => router.push('/strategy/' + genId)}><Sparkles size={16} /> Apri Presentazione</button>
              <button className="btn-secondary" onClick={() => router.push('/')}>Dashboard</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // === FORM ===
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 px-6 py-3" style={{ background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
        <button className="btn-secondary" style={{ padding: '8px 12px' }} onClick={() => router.push('/')}><ArrowLeft size={16} /></button>
        <span style={{ fontFamily: 'var(--f)', fontWeight: 700, fontSize: 14 }}>Nuova Strategia</span>
      </header>

      <main className="pt-20 px-6 pb-12 max-w-4xl mx-auto">
        {/* Info */}
        <div className="form-section">
          <h2 style={{ fontFamily: 'var(--f)', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Informazioni Generali</h2>
          <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20 }}>Dati principali della strategia</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontFamily: 'var(--f)', fontSize: 11, fontWeight: 600, color: 'var(--t3)', letterSpacing: .5, display: 'block', marginBottom: 6 }}>NOME STRATEGIA *</label>
              <input className="form-input" placeholder="Es. Strategia Social Media 2026" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--f)', fontSize: 11, fontWeight: 600, color: 'var(--t3)', letterSpacing: .5, display: 'block', marginBottom: 6 }}>NOME CLIENTE *</label>
              <input className="form-input" placeholder="Es. EduNews24" value={clientName} onChange={e => setClientName(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontFamily: 'var(--f)', fontSize: 11, fontWeight: 600, color: 'var(--t3)', letterSpacing: .5, display: 'block', marginBottom: 6 }}>SOTTOTITOLO</label>
              <input className="form-input" placeholder="Es. Piano Editoriale Q1 2026" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--f)', fontSize: 11, fontWeight: 600, color: 'var(--t3)', letterSpacing: .5, display: 'block', marginBottom: 6 }}>COLORE PRINCIPALE</label>
              <div className="flex items-center gap-3">
                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: 42, height: 42, border: 'none', borderRadius: 10, cursor: 'pointer' }} />
                <input className="form-input" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ fontFamily: 'monospace' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Main text */}
        <div className="form-section">
          <h2 style={{ fontFamily: 'var(--f)', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Testo della Strategia</h2>
          <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20 }}>Inserisci il testo completo. Verrà distribuito nelle sezioni.</p>
          <textarea className="form-textarea" style={{ minHeight: 300 }} placeholder={'Incolla qui il testo completo della tua strategia...\n\nIl contenuto verrà distribuito nelle diverse sezioni della presentazione.'} value={mainText} onChange={e => setMainText(e.target.value)} />
        </div>

        {/* Per-section */}
        <div className="form-section">
          <h2 style={{ fontFamily: 'var(--f)', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Contenuto per Sezione</h2>
          <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20 }}>Opzionale: testo specifico per ogni sezione.</p>
          {SECTION_TEMPLATES.filter(t => t.type !== 'cover' && t.type !== 'index').map(tmpl => (
            <div key={tmpl.type} style={{ marginBottom: 8 }}>
              <button onClick={() => toggleSection(tmpl.type)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl" style={{ border: '1px solid var(--border)', background: openSections[tmpl.type] ? 'rgba(230,25,75,.02)' : 'transparent' }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: tmpl.color }} />
                  <span style={{ fontFamily: 'var(--f)', fontSize: 13, fontWeight: 600 }}>{tmpl.badgeLabel} — {tmpl.title}</span>
                  {sectionTexts[tmpl.type] && <span style={{ padding: '2px 8px', borderRadius: 8, background: '#dcfce7', color: '#16a34a', fontSize: 10, fontWeight: 600 }}>Compilato</span>}
                </div>
                {openSections[tmpl.type] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openSections[tmpl.type] && (
                <div className="px-4 py-3">
                  <textarea className="form-textarea" style={{ minHeight: 140 }} placeholder={`Contenuto per "${tmpl.title}"...`} value={sectionTexts[tmpl.type] || ''} onChange={e => setSectionTexts(p => ({ ...p, [tmpl.type]: e.target.value }))} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* HTML uploads */}
        <div className="form-section">
          <h2 style={{ fontFamily: 'var(--f)', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>File HTML Aggiuntivi</h2>
          <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20 }}>Carica file HTML da integrare come slide aggiuntive.</p>
          <input ref={fileRef} type="file" accept=".html,.htm" multiple className="hidden" onChange={handleHtmlUpload} />
          {htmlFiles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {htmlFiles.map(f => (
                <div key={f.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <FileCode size={18} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontFamily: 'var(--f)', fontSize: 13, fontWeight: 500 }}>{f.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--t3)' }}>{(f.htmlContent.length / 1024).toFixed(1)} KB</span>
                  </div>
                  <button onClick={() => setHtmlFiles(prev => prev.filter(x => x.id !== f.id))} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50">
                    <Trash2 size={14} style={{ color: 'var(--red)' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button className="btn-secondary" onClick={() => fileRef.current?.click()}><Upload size={16} /> Carica file HTML</button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8">
          <button className="btn-secondary" onClick={() => router.push('/')}><ArrowLeft size={16} /> Annulla</button>
          <button className="btn-primary" disabled={!name.trim()} onClick={handleGenerate} style={{ fontSize: 15, padding: '14px 32px' }}>
            <Sparkles size={18} /> Genera Presentazione
          </button>
        </div>
      </main>
    </div>
  );
}

function buildContent(type: string, sectionText: string, mainText: string, client: string, stratName: string): string {
  const text = sectionText || mainText || '';
  const paras = text.split('\n').filter(p => p.trim()).map(p => '<p>' + p + '</p>').join('');
  const placeholder = '<p style="color:var(--t3);font-style:italic;">Contenuto da inserire. Clicca Modifica per aggiungere il testo.</p>';

  if (type === 'cover') {
    return '<div style="text-align:center;"><h1 style="font-family:var(--f);font-weight:800;font-size:clamp(28px,5vw,48px);margin-bottom:12px;">' + stratName + '</h1><p style="font-size:16px;color:var(--t2);">' + client + '</p></div>';
  }
  if (type === 'index') return '';
  if (type === 'swot') {
    const c = sectionText || 'Da definire';
    return '<div class="swot-grid"><div class="swot-card" style="border-top:4px solid var(--green);"><h4 style="color:var(--green);">💪 Punti di Forza</h4><p style="font-size:12px;color:var(--t2);line-height:1.6;">' + c + '</p></div><div class="swot-card" style="border-top:4px solid var(--amber);"><h4 style="color:var(--amber);">⚠️ Debolezze</h4><p style="font-size:12px;color:var(--t2);">Da definire</p></div><div class="swot-card" style="border-top:4px solid #3b82f6;"><h4 style="color:#3b82f6;">🚀 Opportunità</h4><p style="font-size:12px;color:var(--t2);">Da definire</p></div><div class="swot-card" style="border-top:4px solid var(--red);"><h4 style="color:var(--red);">🛑 Minacce</h4><p style="font-size:12px;color:var(--t2);">Da definire</p></div></div>';
  }
  if (type === 'personas') {
    return '<div class="grid-3"><div class="persona-card" style="border-top:4px solid #2D6A4F;"><h4 style="color:#2D6A4F;">👤 Persona Primaria</h4><div style="font-size:12px;color:var(--t2);line-height:1.6;">' + (paras || placeholder) + '</div></div><div class="persona-card" style="border-top:4px solid var(--edu);"><h4 style="color:var(--edu);">👤 Persona Secondaria</h4><div style="font-size:12px;color:var(--t2);">' + placeholder + '</div></div><div class="persona-card" style="border-top:4px solid #EA580C;"><h4 style="color:#EA580C;">👤 Persona Terziaria</h4><div style="font-size:12px;color:var(--t2);">' + placeholder + '</div></div></div>';
  }
  if (type === 'competitors') {
    return '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;"><tr><th style="padding:12px 14px;text-align:left;font-family:var(--f);font-size:10px;font-weight:700;letter-spacing:.5px;color:#fff;background:#7C3AED;">Competitor</th><th style="padding:12px 14px;text-align:left;font-family:var(--f);font-size:10px;font-weight:700;color:#fff;background:#7C3AED;">Punti di Forza</th><th style="padding:12px 14px;text-align:left;font-family:var(--f);font-size:10px;font-weight:700;color:#fff;background:#7C3AED;">Differenziale</th></tr><tr><td style="padding:12px;border-bottom:1px solid var(--border);font-weight:600;">' + (sectionText || 'Da definire') + '</td><td style="padding:12px;border-bottom:1px solid var(--border);color:var(--t2);">—</td><td style="padding:12px;border-bottom:1px solid var(--border);color:var(--t2);">—</td></tr></table></div>';
  }
  if (type === 'phases') {
    return '<div class="grid-3"><div class="content-card" style="border-top:3px solid var(--accent);"><h3 style="color:var(--accent);">Fase 1</h3><p style="font-family:var(--f);font-weight:800;font-size:14px;">Setup & Fondamenta</p><p>Settimane 1-4</p>' + (paras || placeholder) + '</div><div class="content-card" style="border-top:3px solid #3b82f6;"><h3 style="color:#3b82f6;">Fase 2</h3><p style="font-family:var(--f);font-weight:800;font-size:14px;">Crescita & Contenuti</p><p>Settimane 5-12</p>' + placeholder + '</div><div class="content-card" style="border-top:3px solid #8b5cf6;"><h3 style="color:#8b5cf6;">Fase 3</h3><p style="font-family:var(--f);font-weight:800;font-size:14px;">Scala & Ottimizza</p><p>Settimane 13-24</p>' + placeholder + '</div></div>';
  }
  if (type === 'contacts') {
    return '<div style="text-align:center;padding:40px 0;"><h2 style="font-family:var(--f);font-weight:800;font-size:28px;margin-bottom:20px;">Pronti a partire?</h2><p style="font-size:16px;color:var(--t2);max-width:500px;margin:0 auto 24px;">Contattaci per iniziare a implementare questa strategia.</p></div>';
  }

  return '<div class="content-card">' + (paras || placeholder) + '</div>';
}
