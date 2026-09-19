import { useEffect, useRef, useState } from 'react';

const UNDO_WINDOW_MS = 6_000;

export interface UndoState {
  id: number;
  message: string;
  restore: () => void;
}

/** The last delete, which can be undone for a few seconds. */
export function useUndo() {
  const [undo, setUndo] = useState<UndoState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const dismissUndo = () => {
    if (timer.current) clearTimeout(timer.current);
    setUndo(null);
  };

  const showUndo = (message: string, restore: () => void) => {
    if (timer.current) clearTimeout(timer.current);
    setUndo({ id: Date.now(), message, restore });
    timer.current = setTimeout(() => setUndo(null), UNDO_WINDOW_MS);
  };

  return { undo, showUndo, dismissUndo };
}
