import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface FloatingBarProps {
  children: ReactNode;
  offsetSidebar?: boolean;
}

export default function FloatingBar({
  children,
  offsetSidebar = true,
}: FloatingBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed bottom-0 right-0 bg-card border-t border-line shadow-2xl p-4 flex items-center justify-between gap-3 ${
        offsetSidebar ? 'left-64' : 'left-0'
      }`}
      style={{ zIndex: 9999 }}
    >
      {children}
    </div>,
    document.body
  );
}