import { useEffect, useRef, useState } from 'react';
import './celebration.js';
import './sparkles.css';

import addIcon from '../../../Icons/New/Add.svg';
import burgerIcon from '../../../Icons/New/Burger.svg';
import cardsIcon from '../../../Icons/New/Cards.svg';
import checkOffIcon from '../../../Icons/New/CheckOff.svg';
import chevronIcon from '../../../Icons/New/WhiteChevron.svg';
import editIcon from '../../../Icons/New/Edit.svg';
import greenTickIcon from '../../../Icons/New/GreenTick.svg';
import browserFooterIcon from '../../../Icons/New/Browser Footer.svg';
import skyIcon from '../../../Icons/New/Notif Icons.svg';
import diaryIcon from '../../../Icons/New/Notif Icons-1.svg';
import adviceIcon from '../../../Icons/New/Notif Icons-2.svg';
import sosHomeIcon from '../../../Icons/New/SOShome.svg';
import spinnerIcon from '../../../Icons/New/Spinner.svg';
import statusBarIcon from '../../../Icons/New/Header_Component/Status Bar.svg';
import sosChevronIcon from '../../../Icons/Chevron.svg';
import sosPanicIcon from '../../../Icons/Notif Icons.svg';
import sosBreathIcon from '../../../Icons/Notif Icons-1.svg';
import sosGameIcon from '../../../Icons/Notif Icons-2.svg';
import sosMeditationIcon from '../../../Icons/Notif Icons-3.svg';
import sosWordmark from '../../../Icons/SOS.svg';

declare global {
  interface Window {
    MiraCelebration?: {
      play: (options?: {
        container?: HTMLElement;
        zIndex?: number;
        vibrate?: boolean;
        onDone?: () => void;
      }) => void;
    };
  }
}

const dailyTasks = [
  {
    id: 'sky',
    title: ['My sky'],
    icon: skyIcon,
    completed: true,
  },
  {
    id: 'diary',
    title: ['Emotion', 'diary'],
    icon: diaryIcon,
    completed: true,
  },
  {
    id: 'advice',
    title: ['Mira’s', 'tip'],
    icon: adviceIcon,
    completed: false,
  },
] as const;

const sosActions = [
  {
    label: 'Panic attack support',
    icon: sosPanicIcon,
  },
  {
    label: 'Breathing exercise',
    icon: sosBreathIcon,
  },
  {
    label: 'Relaxing game',
    icon: sosGameIcon,
  },
  {
    label: 'Meditation',
    icon: sosMeditationIcon,
  },
] as const;

function StatusBar() {
  return (
    <div className="finale-statusbar" aria-hidden="true">
      <img src={statusBarIcon} alt="" draggable={false} />
    </div>
  );
}

function ProgressRing({ completed }: { completed: number }) {
  const value = completed / 3;
  const radius = 17.5;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="finale-progress-ring" aria-label={`${completed} of 3 tasks completed`}>
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle className="finale-progress-ring__track" cx="20" cy="20" r={radius} />
        <circle
          className="finale-progress-ring__value"
          cx="20"
          cy="20"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value)}
        />
      </svg>
      <span>{completed}/3</span>
    </div>
  );
}

function SparklesPage() {
  const screenRef = useRef<HTMLDivElement>(null);
  const [completedCount, setCompletedCount] = useState(2);
  const [isSosOpen, setIsSosOpen] = useState(false);

  useEffect(() => {
    document.title = 'MIRA Sparkles';
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSosOpen(false);
      }
    }

    if (isSosOpen) {
      document.addEventListener('keydown', onKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isSosOpen]);

  function completeAdviceTask() {
    setCompletedCount(3);
    playFinale();
  }

  function playSparkles() {
    setCompletedCount(3);
    playFinale();
  }

  function playFinale() {
    window.MiraCelebration?.play({
      container: screenRef.current ?? undefined,
      zIndex: 30,
    });
  }

  return (
    <main className="finale-page">
      <section className="finale-screen" ref={screenRef} aria-label="MIRA daily plan">
        <StatusBar />

        <header className="finale-header" aria-label="App header">
          <button className="finale-icon-button finale-burger" type="button" aria-label="Open menu">
            <img src={burgerIcon} alt="" draggable={false} />
          </button>
          <button className="finale-icon-button finale-cards" type="button" aria-label="Open cards">
            <img src={cardsIcon} alt="" draggable={false} />
          </button>
        </header>

        <section className="finale-intro" aria-labelledby="finale-greeting">
          <div>
            <h1 id="finale-greeting">Juliette,</h1>
            <p>Your plan for July 9</p>
          </div>
          <button className="finale-sos" type="button" aria-label="Open SOS drawer" onClick={() => setIsSosOpen(true)}>
            <img src={sosHomeIcon} alt="" draggable={false} />
          </button>
        </section>

        <div className="finale-separator" />

        <section className="finale-session" aria-label="Session with Mira">
          <button className="finale-session__cta" type="button">
            <span>Start a session with Mira</span>
            <img src={chevronIcon} alt="" draggable={false} />
          </button>

          <div className="finale-week-card">
            <div className="finale-week-card__checks" aria-label="Two of seven sessions completed">
              {Array.from({ length: 7 }, (_, index) => (
                <img src={index < 2 ? greenTickIcon : checkOffIcon} alt="" draggable={false} key={index} />
              ))}
            </div>
            <p>This week: 2 of 7 sessions</p>
            <button className="finale-edit" type="button" aria-label="Edit session plan">
              <img src={editIcon} alt="" draggable={false} />
            </button>
          </div>
        </section>

        <div className="finale-separator" />

        <section className="finale-daily" aria-labelledby="finale-daily-title">
          <div className="finale-daily__head">
            <h2 id="finale-daily-title">Daily minimum</h2>
            <div className="finale-today">
              <span>today</span>
              {completedCount === 2 ? (
                <span className="finale-spinner-wrap" aria-label="2 of 3 tasks completed">
                  <img className="finale-spinner-icon" src={spinnerIcon} alt="" draggable={false} />
                  <span>2/3</span>
                </span>
              ) : (
                <ProgressRing completed={completedCount} />
              )}
            </div>
          </div>

          <div className="finale-task-grid">
            {dailyTasks.map((task, index) => {
              const isCompleted = index < completedCount;
              const isAdvice = task.id === 'advice';

              return (
                <button
                  className="finale-task-card"
                  key={task.id}
                  type="button"
                  aria-pressed={isCompleted}
                  onClick={isAdvice ? completeAdviceTask : undefined}
                >
                  <span className="finale-task-card__icon">
                    <img src={task.icon} alt="" draggable={false} />
                  </span>
                  <span className="finale-task-card__title">
                    {task.title.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="finale-countdown" aria-label="Sessions until first insight">
          <div className="finale-countdown__copy">
            <span className="finale-countdown__tick">
              <img src={addIcon} alt="" draggable={false} />
            </span>
            <p>Until first insight</p>
          </div>
          <div className="finale-countdown__number">
            <strong>3</strong>
            <span>sessions</span>
          </div>
        </section>

        <footer className="finale-browser-bar" aria-label="Browser footer">
          <img src={browserFooterIcon} alt="" draggable={false} />
        </footer>

        <div className={`drawer-system ${isSosOpen ? 'drawer-system--open' : ''}`} aria-hidden={!isSosOpen}>
          <button className="drawer-overlay" type="button" aria-label="Close SOS drawer" onClick={() => setIsSosOpen(false)} />

          <div className="drawer-positioner" role="dialog" aria-modal="true" aria-labelledby="finale-sos-title" tabIndex={-1}>
            <section className="help-drawer help-drawer--support" aria-labelledby="finale-sos-title">
              <div className="help-drawer__background" aria-hidden="true" />
              <div className="help-drawer__handle" aria-hidden="true" />

              <div className="help-drawer__content">
                <div className="help-drawer__sos sos-btn" role="img" aria-label="SOS">
                  <span className="sos-ripple" aria-hidden="true" />
                  <span className="sos-ripple sos-ripple--late" aria-hidden="true" />
                  <span className="sos-ring" aria-hidden="true" />
                  <span className="sos-core">
                    <img className="sos-label" src={sosWordmark} alt="" draggable={false} />
                  </span>
                </div>

                <div className="help-drawer__panel">
                  <h1 id="finale-sos-title" className="help-drawer__title" aria-label="What can help right now?">
                    <span>What can help</span>
                    <span>right now?</span>
                  </h1>

                  <div className="help-drawer__list" role="list">
                    {sosActions.map((action) => (
                      <button className="help-drawer__item" key={action.label} type="button">
                        <span className="help-drawer__item-main">
                          <img className="help-drawer__item-icon" src={action.icon} alt="" draggable={false} />
                          <span className="help-drawer__item-label">{action.label}</span>
                        </span>
                        <img className="help-drawer__chevron" src={sosChevronIcon} alt="" draggable={false} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <button className="finale-play-again" type="button" onClick={playSparkles} data-node-id="4559:68230">
        Play sparkles
      </button>
    </main>
  );
}

export default SparklesPage;
