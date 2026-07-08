import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/onest/400.css';
import '@fontsource/onest/500.css';
import { NeuralLoader } from '../neural-loader.js';
import './styles.css';

import clearIcon from '../Icons/Clear.svg';
import panicIcon from '../Icons/Notif Icons.svg';
import breathIcon from '../Icons/Notif Icons-1.svg';
import gameIcon from '../Icons/Notif Icons-2.svg';
import meditationIcon from '../Icons/Notif Icons-3.svg';
import chevronIcon from '../Icons/Chevron.svg';
import signIcon from '../Icons/Sign.svg';
import sosWordmark from '../Icons/SOS.svg';
import undoIcon from '../Icons/Undo.svg';

type DrawerAction = {
  label: string;
  icon: string;
};

type SignaturePoint = {
  x: number;
  y: number;
  pressure: number;
};

type DrawerTabId = 'support' | 'recap' | 'sign';

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
  signActions?: never;
};

type SignDrawerTab = DrawerTabBase & {
  description: readonly string[];
  visual: 'sign';
  actions?: never;
};

type DrawerTab = ActionDrawerTab | RecapDrawerTab | SignDrawerTab;

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
  {
    id: 'sign',
    label: 'Open Sign drawer',
    title: ['One promise:', 'to yourself, not to me.'],
    description: ['You don’t have to figure this out alone. In three sessions, we’ll unpack what’s really going on and what to do next.'],
    visual: 'sign',
  },
];

function HelpDrawer({ drawer = drawerTabs[0], isOpen = false, onSelect }: HelpDrawerProps) {
  const loaderCanvasRef = useRef<HTMLCanvasElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const isSigningRef = useRef(false);
  const signatureStrokesRef = useRef<SignaturePoint[][]>([]);
  const currentSignatureStrokeRef = useRef<SignaturePoint[] | null>(null);
  const lastSignaturePointRef = useRef<SignaturePoint | null>(null);
  const [signatureStrokeCount, setSignatureStrokeCount] = useState(0);
  const hasSignature = signatureStrokeCount > 0;

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

  useEffect(() => {
    if (!isOpen || drawer.visual !== 'sign' || !signatureCanvasRef.current) {
      return undefined;
    }

    let animationFrame = window.requestAnimationFrame(() => {
      const canvas = signatureCanvasRef.current;

      if (!canvas) {
        return;
      }

      redrawSignature(canvas);
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      isSigningRef.current = false;
      currentSignatureStrokeRef.current = null;
      lastSignaturePointRef.current = null;
    };
  }, [drawer.visual, isOpen]);

  function getSignaturePoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      pressure: event.pressure || 0.5,
    };
  }

  function configureSignatureCanvas(canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      return null;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.strokeStyle = '#001BBD';
    context.fillStyle = '#001BBD';
    context.lineWidth = 2.2;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    return { context, width: rect.width, height: rect.height };
  }

  function drawSignaturePath(context: CanvasRenderingContext2D, points: SignaturePoint[]) {
    if (points.length === 0) {
      return;
    }

    if (points.length === 1) {
      context.beginPath();
      context.arc(points[0].x, points[0].y, 1.1, 0, Math.PI * 2);
      context.fill();
      return;
    }

    context.beginPath();
    context.moveTo(points[0].x, points[0].y);

    for (let index = 1; index < points.length - 1; index += 1) {
      const currentPoint = points[index];
      const nextPoint = points[index + 1];
      const midpoint = {
        x: (currentPoint.x + nextPoint.x) / 2,
        y: (currentPoint.y + nextPoint.y) / 2,
      };

      context.quadraticCurveTo(currentPoint.x, currentPoint.y, midpoint.x, midpoint.y);
    }

    const lastPoint = points[points.length - 1];
    context.lineTo(lastPoint.x, lastPoint.y);
    context.stroke();
  }

  function redrawSignature(canvas = signatureCanvasRef.current) {
    if (!canvas) {
      return;
    }

    const configuredCanvas = configureSignatureCanvas(canvas);

    if (!configuredCanvas) {
      return;
    }

    const { context, width, height } = configuredCanvas;
    context.clearRect(0, 0, width, height);
    signatureStrokesRef.current.forEach((stroke) => drawSignaturePath(context, stroke));
  }

  function startSignature(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    isSigningRef.current = true;
    const point = getSignaturePoint(event);
    const stroke = [point];
    signatureStrokesRef.current.push(stroke);
    currentSignatureStrokeRef.current = stroke;
    lastSignaturePointRef.current = point;
    redrawSignature(event.currentTarget);
    setSignatureStrokeCount(signatureStrokesRef.current.length);
  }

  function moveSignature(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isSigningRef.current || !lastSignaturePointRef.current || !currentSignatureStrokeRef.current) {
      return;
    }

    const point = getSignaturePoint(event);
    currentSignatureStrokeRef.current.push(point);
    redrawSignature(event.currentTarget);
    lastSignaturePointRef.current = point;
  }

  function endSignature(event: React.PointerEvent<HTMLCanvasElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    isSigningRef.current = false;
    currentSignatureStrokeRef.current = null;
    lastSignaturePointRef.current = null;
  }

  function undoSignature() {
    if (!signatureStrokesRef.current.length) {
      return;
    }

    signatureStrokesRef.current.pop();
    isSigningRef.current = false;
    currentSignatureStrokeRef.current = null;
    lastSignaturePointRef.current = null;
    setSignatureStrokeCount(signatureStrokesRef.current.length);
    redrawSignature();
  }

  function clearSignature() {
    signatureStrokesRef.current = [];
    isSigningRef.current = false;
    currentSignatureStrokeRef.current = null;
    lastSignaturePointRef.current = null;
    setSignatureStrokeCount(0);
    redrawSignature();
  }

  return (
    <section className={`help-drawer help-drawer--${drawer.id}`} aria-labelledby="help-drawer-title">
      <div className="help-drawer__background" aria-hidden="true" />
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
            <p className="help-drawer__description" aria-label={drawer.description.join(' ')}>
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

          {drawer.visual === 'sign' ? (
            <div className="open-sign-block" data-node-id="4549:26590">
              <div
                className="open-sign-commitment"
                aria-label="Sign below if you’re ready to commit to these 3 sessions."
                data-node-id="4549:3248"
                data-name="Sign"
              >
                <span className="open-sign-commitment__copy">
                  <span>Sign below if you’re ready</span>
                  <span>to commit to these 3 sessions.</span>
                </span>
                <img className="open-sign-commitment__icon" src={signIcon} alt="" draggable={false} />
              </div>

              <div className="open-sign-pad-frame" data-node-id="4549:26596">
                <div className="open-sign-pad" data-node-id="4549:26583" data-name="Sign">
                  <canvas
                    ref={signatureCanvasRef}
                    className="open-sign-pad__canvas"
                    aria-label="Signature pad"
                    onPointerDown={startSignature}
                    onPointerMove={moveSignature}
                    onPointerUp={endSignature}
                    onPointerCancel={endSignature}
                  />
                </div>

                <div className="open-sign-pad-actions" aria-label="Signature actions">
                  <button className="open-sign-pad-action" type="button" onClick={undoSignature} disabled={!hasSignature}>
                    <img className="open-sign-pad-action__icon" src={undoIcon} alt="" draggable={false} />
                    <span>Undo</span>
                  </button>
                  <button className="open-sign-pad-action" type="button" onClick={clearSignature} disabled={!hasSignature}>
                    <img className="open-sign-pad-action__icon open-sign-pad-action__icon--clear" src={clearIcon} alt="" draggable={false} />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              <button className="open-sign-submit" type="button" disabled={!hasSignature} data-node-id="4549:43623" data-name="Research_Button">
                I give myself my word
              </button>

              <button className="open-sign-skip" type="button" data-node-id="4549:43626" data-name="Research_Button">
                Skip
              </button>
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
