import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/**
 * A section settles into place the first time it enters the viewport.
 * Transform + opacity only, so it stays off the layout and paint path.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
  variant = 'up',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  variant?: 'up' | 'left' | 'scale';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin: '0px 0px -6% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const variantClass = variant === 'left' ? 'reveal-left' : variant === 'scale' ? 'reveal-scale' : '';

  return (
    <div
      ref={ref}
      className={`reveal ${variantClass} ${shown ? 'reveal-in' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
