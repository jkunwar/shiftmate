import { useEffect, useRef, useState } from 'react';

/** A boolean that turns on when triggered and switches itself off after `ms`. */
export function useTimedFlag(ms: number) {
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const trigger = () => {
    if (timer.current) clearTimeout(timer.current);
    setActive(true);
    timer.current = setTimeout(() => setActive(false), ms);
  };

  return [active, trigger] as const;
}
