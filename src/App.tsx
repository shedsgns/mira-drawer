import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/onest/400.css';
import '@fontsource/onest/500.css';
import { NeuralLoader } from '../neural-loader.js';
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

type DrawerTabId = 'support' | 'recap';

type DrawerTabBase = {
  id: DrawerTabId;
  label: string;
  title: readonly string[];
};

type ActionDrawerTab = DrawerTabBase & {
  actions: readonly DrawerAction[];
  description?: never;
  visual?: never;
};

type RecapDrawerTab = DrawerTabBase & {
  description: readonly string[];
  visual: 'recap';
  actions?: never;
};

type DrawerTab = ActionDrawerTab | RecapDrawerTab;

type HelpDrawerProps = {
  drawer?: DrawerTab;
  isOpen?: boolean;
  onSelect?: (action: DrawerAction) => void;
};

const drawerActions: readonly DrawerAction[] = [
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

const drawerTabs: readonly DrawerTab[] = [
  {
    id: 'support',
    label: 'Open SOS drawer',
    title: ['What can help', 'right now?'],
    actions: drawerActions,
  },
  {
    id: 'recap',
    label: 'Open Recap drawer',
    title: ['Preparing a recap', 'of our session'],
    description: ['This should take no more', 'than 30 seconds.'],
    visual: 'recap',
  },
];

function HelpDrawer({ drawer = drawerTabs[0], isOpen = false, onSelect }: HelpDrawerProps) {
  const loaderCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen || drawer.visual !== 'recap' || !loaderCanvasRef.current) {
      return undefined;
    }

    const loader = new NeuralLoader(loaderCanvasRef.current, { theme: 'dark' });
    loader.start();

    return () => {
      loader.destroy();
    };
  }, [drawer.visual, isOpen]);

  return (
    <section className={`help-drawer help-drawer--${drawer.id}`} aria-labelledby="help-drawer-title">
      <div className="help-drawer__handle" aria-hidden="true" />

      <div className="help-drawer__content">
        {drawer.id === 'support' ? (
          <div className="help-drawer__sos sos-btn" role="img" aria-label="SOS">
            <span className="sos-ripple" aria-hidden="true" />
            <span className="sos-ripple sos-ripple--late" aria-hidden="true" />
            <span className="sos-ring" aria-hidden="true" />
            <span className="sos-core">
              <img className="sos-label" src={sosWordmark} alt="" draggable={false} />
            </span>
          </div>
        ) : null}

        <div className="help-drawer__panel" id={`help-drawer-panel-${drawer.id}`}>
          <h1 id="help-drawer-title" className="help-drawer__title" aria-label={`${drawer.title.join(' ')}${drawer.visual === 'recap' ? '...' : ''}`}>
            {drawer.title.map((line) => (
              <span key={line}>
                {line}
                {drawer.visual === 'recap' && line === drawer.title[drawer.title.length - 1] ? (
                  <span className="help-drawer__ellipsis" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                ) : null}
              </span>
            ))}
          </h1>

          {drawer.description ? (
            <p className="help-drawer__description">
              {drawer.description.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
          ) : null}

          {drawer.actions ? (
            <div className="help-drawer__list" role="list">
              {drawer.actions.map((action) => (
                <button
                  className="help-drawer__item"
                  key={action.label}
                  type="button"
                  onClick={() => onSelect?.(action)}
                >
                  <span className="help-drawer__item-main">
                    <img className="help-drawer__item-icon" src={action.icon} alt="" draggable={false} />
                    <span className="help-drawer__item-label">{action.label}</span>
                  </span>
                  <img className="help-drawer__chevron" src={chevronIcon} alt="" draggable={false} />
                </button>
              ))}
            </div>
          ) : null}

          {drawer.visual === 'recap' ? (
            <div className="neural-recap-visual" aria-hidden="true">
              <canvas className="neural-recap-visual__canvas" ref={loaderCanvasRef} draggable={false} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function App() {
  const [activeDrawerId, setActiveDrawerId] = useState<DrawerTabId | null>(null);
  const [renderedDrawerId, setRenderedDrawerId] = useState<DrawerTabId>('support');
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerSystemRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const activeDrawer = drawerTabs.find((drawer) => drawer.id === renderedDrawerId) ?? drawerTabs[0];
  const isDrawerOpen = activeDrawerId !== null;

  function openDrawer(drawerId: DrawerTabId, trigger: HTMLButtonElement) {
    lastTriggerRef.current = trigger;
    setRenderedDrawerId(drawerId);
    setActiveDrawerId(drawerId);
  }

  function closeDrawer() {
    setActiveDrawerId(null);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeDrawer();
      }
    }

    if (drawerSystemRef.current) {
      drawerSystemRef.current.inert = !isDrawerOpen;
    }

    if (isDrawerOpen) {
      document.addEventListener('keydown', onKeyDown);
      document.body.classList.add('drawer-is-open');
      requestAnimationFrame(() => {
        const firstButton = drawerRef.current?.querySelector('button');

        if (firstButton) {
          firstButton.focus();
          return;
        }

        drawerRef.current?.focus();
      });
    } else {
      document.body.classList.remove('drawer-is-open');
      lastTriggerRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('drawer-is-open');
    };
  }, [isDrawerOpen]);

  return (
    <main className={`app-shell ${isDrawerOpen ? 'app-shell--drawer-open' : ''}`}>
      <div className="launcher">
        <div className="drawer-launcher-tabs" role="group" aria-label="Choose drawer">
          {drawerTabs.map((drawer) => {
            const isActive = activeDrawerId === drawer.id;

            return (
              <button
                aria-expanded={isActive}
                aria-haspopup="dialog"
                className="drawer-launcher-tab"
                key={drawer.id}
                type="button"
                onClick={(event) => openDrawer(drawer.id, event.currentTarget)}
              >
                {drawer.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={`drawer-system ${isDrawerOpen ? 'drawer-system--open' : ''}`}
        ref={drawerSystemRef}
        aria-hidden={!isDrawerOpen}
      >
        <button className="drawer-overlay" type="button" aria-label="Close drawer" onClick={closeDrawer} />

        <div className="drawer-positioner" ref={drawerRef} role="dialog" aria-modal="true" aria-labelledby="help-drawer-title" tabIndex={-1}>
          <HelpDrawer drawer={activeDrawer} isOpen={isDrawerOpen} />
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
export type { DrawerAction, DrawerTab, HelpDrawerProps };
