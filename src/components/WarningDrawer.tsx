import warningIcon from '../../Icons/Warning.svg';
import { PulsingHeart } from './PulsingHeart';

type WarningDrawerProps = {
  isOpen: boolean;
  onAcknowledge?: () => void;
};

export function WarningDrawer({ isOpen, onAcknowledge }: WarningDrawerProps) {
  return (
    <section
      className="help-drawer help-drawer--warning"
      aria-labelledby="help-drawer-title"
      data-node-id="4658:56775"
      data-name="Warning_drawer"
    >
      <div className="help-drawer__background" aria-hidden="true" />
      <div className="help-drawer__handle" aria-hidden="true" />

      <div className="warning-drawer__content">
        <PulsingHeart active={isOpen} />

        <div className="warning-drawer__copy" data-node-id="4658:56776">
          <h1 className="warning-drawer__title" id="help-drawer-title" data-node-id="4658:56783">
            Before we begin
          </h1>

          <p className="warning-drawer__description" data-node-id="4658:56784">
            Remember: I can help you work through your feelings, thoughts, and difficult situations. But I’m not a doctor, I can’t diagnose conditions or prescribe treatment.
          </p>

          <div className="warning-drawer__notice" data-node-id="4658:56794" data-name="Time Container">
            <img
              className="warning-drawer__notice-icon"
              src={warningIcon}
              alt=""
              width="32"
              height="32"
              draggable={false}
              data-node-id="4658:56812"
            />
            <p data-node-id="4658:56809">
              If you’re in crisis and need immediate help, contact a mental health professional or your local emergency services.
            </p>
          </div>
        </div>

        <button
          className="warning-drawer__action"
          type="button"
          onClick={onAcknowledge}
          data-node-id="4658:56786"
          data-name="Research_Button"
        >
          I understand
        </button>
      </div>
    </section>
  );
}

export type { WarningDrawerProps };
