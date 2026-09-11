import { useEffect, useRef, useState, type ReactNode } from 'react';
import { WeeklyFocus } from './WeeklyFocus';
import burgerIcon from '../../../Icons/New/Burger.svg';
import cardsIcon from '../../../Icons/New/Cards.svg';
import sosIcon from '../../../Icons/New/SOShome.svg';
import statusBarIcon from '../../../Icons/New/Header_Component/Status Bar.svg';
import focusLightning from './assets/focus-lightning.svg';
import focusChevron from './assets/focus-chevron.svg';
import './focus-page.css';

const focuses = [
  { id: 'harmony', choice: 'Worry less', label: 'Harmony', description: 'Make room for a little more balance.' },
  { id: 'acceptance', choice: 'Be kinder to myself', label: 'Acceptance', description: 'Meet yourself where you are.' },
  { id: 'joy', choice: 'Find more joy in life', label: 'Joy', description: 'Notice the things that light you up.' },
  { id: 'boundaries', choice: 'Stand up for my boundaries', label: 'Boundaries', description: 'Give your needs a little more space.' },
  { id: 'desires', choice: 'Understand what I want', label: 'Desires', description: 'Listen to what you really want.' },
];

function weeklyStorageKey() {
  const monday = new Date();
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  return `mira-weekly-focus-${monday.getFullYear()}-${monday.getMonth() + 1}-${monday.getDate()}`;
}

export default function FocusPage({ supportContent }: { supportContent: ReactNode }) {
  const [storageKey] = useState(weeklyStorageKey);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return focuses.some((focus) => focus.id === saved) ? saved : null;
    } catch { return null; }
  });
  const [drawerKind, setDrawerKind] = useState<'picker' | 'support'>('picker');
  const [modal, setModal] = useState<'picker' | 'support' | 'menu' | null>(null);
  const lastDrawerTrigger = useRef<HTMLElement | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerSystemRef = useRef<HTMLDivElement>(null);
  const supportTriggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDialogElement>(null);
  const selected = focuses.find((focus) => focus.id === selectedId);
  const date = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(new Date());
  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Weekly focus · Mira';
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    const isOpen = modal === 'support' || modal === 'picker';
    if (drawerSystemRef.current) drawerSystemRef.current.inert = !isOpen;
    if (!isOpen) return;
    lastDrawerTrigger.current = document.activeElement as HTMLElement;
    const frame = requestAnimationFrame(() => drawerRef.current?.focus({ preventScroll: true }));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModal(null);
      if (event.key === 'Tab') {
        const buttons = drawerRef.current?.querySelectorAll<HTMLButtonElement>('button');
        if (!buttons?.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === drawerRef.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      lastDrawerTrigger.current?.focus({ preventScroll: true });
    };
  }, [modal]);

  function openPicker() {
    setDrawerKind('picker');
    setModal('picker');
  }

  function chooseFocus(id: string | null) {
    setSelectedId(id);
    try {
      if (id) localStorage.setItem(storageKey, id);
      else localStorage.removeItem(storageKey);
    } catch { /* Selection still works without storage. */ }
    setModal(null);
  }

  return (
    <main className="focus-page">
      <section className="focus-screen" aria-label="Mira weekly focus" data-modal-open={modal !== null}>
        <div className="focus-statusbar" aria-hidden="true"><img src={statusBarIcon} alt="" /></div>
        <header className="focus-header">
          <button className="focus-icon-button" aria-label="Open menu" aria-haspopup="dialog" onClick={() => { setModal('menu'); menuRef.current?.showModal(); }}>
            <img src={burgerIcon} alt="" />
          </button>
          <a className="focus-icon-button" href={`${base}sparkles`} aria-label="Open daily plan"><img src={cardsIcon} alt="" /></a>
        </header>
        <section className="focus-greeting" aria-label="Your plan">
          <div><p className="focus-name">Juliette,</p><p className="focus-date">Your plan for {date}</p></div>
          <button className="focus-icon-button" ref={supportTriggerRef} aria-label="Open SOS support" aria-haspopup="dialog" aria-expanded={modal === 'support'} onClick={() => { setDrawerKind('support'); setModal('support'); }}><img src={sosIcon} alt="" /></button>
        </section>
        <div className="focus-divider" />
        <section className="focus-main" aria-labelledby="weekly-focus-title">
          <h1 id="weekly-focus-title">{selected ? 'Your focus for this week' : 'Choose your focus for this week'}</h1>
          <WeeklyFocus focuses={selected ? [selected] : focuses} onOpenFocusPicker={openPicker} paused={modal !== null} size="min(76vw, 304px)" />
          <div className="focus-caption" aria-live="polite">
            {selected ? <><p>{selected.description}</p><button onClick={openPicker}>Change focus</button></> : <p>Tap the sphere to choose</p>}
          </div>
        </section>
        <div className={`drawer-system ${modal === 'support' || modal === 'picker' ? 'drawer-system--open' : ''}`} ref={drawerSystemRef} aria-hidden={modal !== 'support' && modal !== 'picker'}>
          <button className="drawer-overlay" type="button" aria-label={drawerKind === 'picker' ? 'Close weekly focus drawer' : 'Close SOS drawer'} onClick={() => setModal(null)} />
          <div className="drawer-positioner" ref={drawerRef} role="dialog" aria-modal="true" aria-labelledby={drawerKind === 'picker' ? 'focus-picker-title' : 'help-drawer-title'} aria-describedby={drawerKind === 'picker' ? 'focus-picker-description' : undefined} tabIndex={-1}>
            {drawerKind === 'support' ? supportContent : (
              <section className="help-drawer weekly-focus-drawer" data-node-id="4987:20969">
                <div className="help-drawer__handle" aria-hidden="true" />
                <div className="help-drawer__content">
                  <span className="weekly-focus-drawer__icon" aria-hidden="true"><img src={focusLightning} alt="" /></span>
                  <h2 id="focus-picker-title">Choose your focus<br />for this week</h2>
                  <p id="focus-picker-description">Mira will keep your focus in mind during sessions. You can choose a new one every Monday, if you’d like.</p>
                  <div className="help-drawer__list">
                    {focuses.map((focus) => (
                      <button className="help-drawer__item" type="button" key={focus.id} aria-pressed={selectedId === focus.id} onClick={() => chooseFocus(focus.id)}>
                        <span className="help-drawer__item-label">{focus.choice}</span>
                        <img className="weekly-focus-drawer__chevron" src={focusChevron} alt="" />
                      </button>
                    ))}
                  </div>
                  <button className="weekly-focus-drawer__skip" type="button" onClick={() => chooseFocus(null)}>Skip this week</button>
                </div>
              </section>
            )}
          </div>
        </div>
        <dialog className="focus-sheet focus-menu" ref={menuRef} aria-labelledby="focus-menu-title" onClose={() => setModal(null)}>
          <div className="focus-sheet__heading"><h2 id="focus-menu-title">Mira</h2><button className="focus-close" aria-label="Close menu" onClick={() => menuRef.current?.close()}>×</button></div>
          <a href={`${base}focus`} aria-current="page">Weekly focus</a><a href={`${base}sparkles`}>Daily plan</a><a href={base}>Drawer demos</a>
        </dialog>
      </section>
    </main>
  );
}
