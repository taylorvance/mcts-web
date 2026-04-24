import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  placement?: 'top' | 'bottom';
}

interface TooltipPosition {
  left: number;
  top: number;
}

const VIEWPORT_MARGIN_PX = 8;
const TOOLTIP_GAP_PX = 8;
const MAX_TOOLTIP_WIDTH_PX = 420;

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
}) => {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    const minCenterX = VIEWPORT_MARGIN_PX + tooltipRect.width / 2;
    const maxCenterX =
      window.innerWidth - VIEWPORT_MARGIN_PX - tooltipRect.width / 2;
    const left = Math.min(maxCenterX, Math.max(minCenterX, triggerCenterX));

    let top =
      placement === 'bottom'
        ? triggerRect.bottom + TOOLTIP_GAP_PX
        : triggerRect.top - tooltipRect.height - TOOLTIP_GAP_PX;

    if (placement === 'top' && top < VIEWPORT_MARGIN_PX) {
      top = triggerRect.bottom + TOOLTIP_GAP_PX;
    } else if (
      placement === 'bottom' &&
      top + tooltipRect.height > window.innerHeight - VIEWPORT_MARGIN_PX
    ) {
      top = triggerRect.top - tooltipRect.height - TOOLTIP_GAP_PX;
    }

    const maxTop = window.innerHeight - VIEWPORT_MARGIN_PX - tooltipRect.height;
    setPosition({
      left,
      top: Math.min(
        Math.max(VIEWPORT_MARGIN_PX, top),
        Math.max(VIEWPORT_MARGIN_PX, maxTop),
      ),
    });
  }, [placement]);

  useLayoutEffect(() => {
    if (!isVisible) {
      return;
    }

    updatePosition();
  }, [isVisible, updatePosition]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const handleViewportChange = () => updatePosition();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isVisible, updatePosition]);

  const showTooltip = () => {
    setIsVisible(true);
  };

  const hideTooltip = () => {
    setIsVisible(false);
    setPosition(null);
  };

  return (
    <div
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      <div
        ref={tooltipRef}
        role="tooltip"
        id={tooltipId}
        className={`pointer-events-none fixed z-20 whitespace-normal break-words rounded-lg border border-white/50 bg-white/50 px-3 py-2 text-sm leading-snug text-gray-900 shadow-lg shadow-slate-900/10 backdrop-blur-md transition-[opacity,transform] duration-150 ${
          isVisible && position ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{
          left: position?.left ?? 0,
          maxWidth: `min(${MAX_TOOLTIP_WIDTH_PX}px, calc(100vw - ${VIEWPORT_MARGIN_PX * 2}px))`,
          top: position?.top ?? 0,
          transform: 'translateX(-50%)',
          visibility: isVisible && position ? 'visible' : 'hidden',
        }}
      >
        {content}
      </div>
      <div aria-describedby={tooltipId}>{children}</div>
    </div>
  );
};

export default Tooltip;
