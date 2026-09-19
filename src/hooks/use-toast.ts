import { useEffect, useRef, useState } from 'react';

/** A short message that clears itself. Show it with <Toast message={message} />. */
export function useToast(durationMs = 3000) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const showToast = (text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(null), durationMs);
  };

  return { message, showToast };
}
