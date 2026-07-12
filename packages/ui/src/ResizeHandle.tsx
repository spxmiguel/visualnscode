import { useRef, type PointerEvent as ReactPointerEvent } from 'react';

interface ResizeHandleProps {
  readonly direction: 'horizontal' | 'vertical';
  readonly label: string;
  readonly onResize: (delta: number) => void;
}

export function ResizeHandle({ direction, label, onResize }: ResizeHandleProps) {
  const lastPosition = useRef(0);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    lastPosition.current = direction === 'horizontal' ? event.clientX : event.clientY;

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      const position = direction === 'horizontal' ? pointerEvent.clientX : pointerEvent.clientY;
      onResize(position - lastPosition.current);
      lastPosition.current = position;
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      aria-label={label}
      aria-orientation={direction === 'horizontal' ? 'vertical' : 'horizontal'}
      className={`group relative z-10 shrink-0 outline-none ${direction === 'horizontal' ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'}`}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') onResize(-16);
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') onResize(16);
      }}
      onPointerDown={handlePointerDown}
      role="separator"
      tabIndex={0}
    >
      <span
        className={`absolute bg-transparent transition group-hover:bg-[rgb(var(--accent))] group-focus:bg-[rgb(var(--accent))] ${direction === 'horizontal' ? 'inset-y-0 left-0 w-px' : 'inset-x-0 top-0 h-px'}`}
      />
    </div>
  );
}
