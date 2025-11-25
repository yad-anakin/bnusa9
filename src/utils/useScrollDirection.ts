import { useEffect, useRef, useState } from 'react';

export type ScrollDirection = 'up' | 'down';

export default function useScrollDirection(): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>('down');
  const lastY = useRef<number>(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      const dir: ScrollDirection = y > lastY.current ? 'down' : 'up';
      if (dir !== direction) setDirection(dir);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [direction]);

  return direction;
}
