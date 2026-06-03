import { useEffect, useMemo, useRef, useState } from 'react';

interface CounterCardProps {
  label: string;
  value: number | string;
  duration?: number;
}

export default function CounterCard({ label, value, duration = 1200 }: CounterCardProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [display, setDisplay] = useState('1');
  const isOfficeCountdown = value === 'office-close-countdown';
  const counter = useMemo(() => {
    if (value === 'office-close-countdown') return null;
    if (typeof value === 'number') {
      return { target: value, prefix: '', suffix: '' };
    }

    const text = String(value);
    const match = text.match(/^(\D*)(\d+(?:,\d{3})*)(.*)$/);
    if (!match) return null;

    return {
      prefix: match[1],
      target: Number(match[2].replace(/,/g, '')),
      suffix: match[3],
    };
  }, [value]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isOfficeCountdown) {
      const update = () => {
        const now = new Date();
        const closesAt = new Date(now);
        closesAt.setHours(17, 0, 0, 0);
        const remainingMs = Math.max(0, closesAt.getTime() - now.getTime());
        const totalSeconds = Math.floor(remainingMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        setDisplay([hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':'));
      };

      update();
      const interval = window.setInterval(update, 1000);
      return () => window.clearInterval(interval);
    }

    if (!counter) {
      setDisplay(String(value));
      return undefined;
    }

    if (!visible) {
      setDisplay(`${counter.prefix}1${counter.suffix}`);
      return undefined;
    }

    const start = performance.now();
    const initial = Math.min(1, counter.target);
    let frame = 0;

    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(initial + (counter.target - initial) * eased);
      setDisplay(`${counter.prefix}${current.toLocaleString()}${counter.suffix}`);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [counter, duration, isOfficeCountdown, value, visible]);

  return (
    <article ref={ref} className="counter-card">
      <strong aria-label={String(value)}>{display}</strong>
      <span>{label}</span>
    </article>
  );
}
