import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import type { HelpContent } from '../types/Game';

export type HelpTopic = 'app' | 'game';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: HelpTopic;
  onTopicChange: (topic: HelpTopic) => void;
  appHelp: HelpContent;
  gameName: string;
  gameHelp?: HelpContent;
}

const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  topic,
  onTopicChange,
  appHelp,
  gameName,
  gameHelp,
}) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const activeHelp = topic === 'game' && gameHelp ? gameHelp : appHelp;
  const activeTitle =
    topic === 'game' && gameHelp ? `${gameName} Help` : 'MCTS Help';
  const hasGameHelp = Boolean(gameHelp);

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8 sm:py-12"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100vh-6rem)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div>
            <h2
              id="help-modal-title"
              className="text-2xl font-bold text-gray-900"
            >
              {activeTitle}
            </h2>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            onClick={onClose}
            aria-label="Close help"
          >
            <FiX className="text-xl" />
          </button>
        </header>

        <div className="border-b border-gray-200 px-5 py-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                topic === 'app'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => onTopicChange('app')}
            >
              MCTS
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                topic === 'game'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${!hasGameHelp ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={() => hasGameHelp && onTopicChange('game')}
              disabled={!hasGameHelp}
            >
              {gameName}
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <p className="text-base leading-7 text-gray-700">
            {activeHelp.overview}
          </p>

          <div className="mt-6 space-y-5">
            {activeHelp.sections.map((section) => (
              <section key={section.title}>
                <h3 className="text-lg font-semibold text-gray-900">
                  {section.title}
                </h3>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-gray-700">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
