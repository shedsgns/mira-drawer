import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/onest/400.css';
import '@fontsource/onest/500.css';
import './styles.css';

import panicIcon from '../Icons/Notif Icons.svg';
import breathIcon from '../Icons/Notif Icons-1.svg';
import gameIcon from '../Icons/Notif Icons-2.svg';
import meditationIcon from '../Icons/Notif Icons-3.svg';
import chevronIcon from '../Icons/Chevron.svg';
import sosWordmark from '../Icons/SOS.svg';

type DrawerAction = {
  label: string;
  icon: string;
};

type HelpDrawerProps = {
  actions?: DrawerAction[];
  onSelect?: (action: DrawerAction) => void;
};

const drawerActions: DrawerAction[] = [
  {
    label: 'Panic attack support',
    icon: panicIcon,
  },
  {
    label: 'Breathing exercise',
    icon: breathIcon,
  },
  {
    label: 'Relaxing game',
    icon: gameIcon,
  },
  {
    label: 'Meditation',
    icon: meditationIcon,
  },
];

function HelpDrawer({ actions = drawerActions, onSelect }: HelpDrawerProps) {
  return (
    <section className="help-drawer" aria-labelledby="help-drawer-title">
      <div className="help-drawer__handle" aria-hidden="true" />

      <div className="help-drawer__content">
        <div className="help-drawer__sos sos-btn" role="img" aria-label="SOS">
          <span className="sos-ripple" aria-hidden="true" />
          <span className="sos-ripple sos-ripple--late" aria-hidden="true" />
          <span className="sos-ring" aria-hidden="true" />
          <span className="sos-core">
            <img className="sos-label" src={sosWordmark} alt="" />
          </span>
        </div>

        <h1 id="help-drawer-title" className="help-drawer__title">
          <span>What can help</span>
          <span>right now?</span>
        </h1>

        <div className="help-drawer__list" role="list">
          {actions.map((action) => (
            <button
              className="help-drawer__item"
              key={action.label}
              type="button"
              onClick={() => onSelect?.(action)}
            >
              <span className="help-drawer__item-main">
                <img className="help-drawer__item-icon" src={action.icon} alt="" />
                <span className="help-drawer__item-label">{action.label}</span>
              </span>
              <img className="help-drawer__chevron" src={chevronIcon} alt="" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDrawerOpen(false);
      }
    }

    if (isDrawerOpen) {
      document.addEventListener('keydown', onKeyDown);
      document.body.classList.add('drawer-is-open');
      requestAnimationFrame(() => {
        drawerRef.current?.querySelector('button')?.focus();
      });
    } else {
      document.body.classList.remove('drawer-is-open');
      openButtonRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('drawer-is-open');
    };
  }, [isDrawerOpen]);

  return (
    <main className={`app-shell ${isDrawerOpen ? 'app-shell--drawer-open' : ''}`}>
      <div className="launcher">
        <button
          className="sos-open-button"
          ref={openButtonRef}
          type="button"
          onClick={() => setIsDrawerOpen(true)}
        >
          Open SOS drawer
        </button>
      </div>

      <div
        className={`drawer-system ${isDrawerOpen ? 'drawer-system--open' : ''}`}
        aria-hidden={!isDrawerOpen}
        inert={isDrawerOpen ? undefined : true}
      >
        <button className="drawer-overlay" type="button" aria-label="Close SOS drawer" onClick={() => setIsDrawerOpen(false)} />

        <div className="drawer-positioner" ref={drawerRef} role="dialog" aria-modal="true" aria-labelledby="help-drawer-title">
          <HelpDrawer />
        </div>
      </div>
    </main>
  );
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

export { HelpDrawer };
export type { DrawerAction, HelpDrawerProps };
