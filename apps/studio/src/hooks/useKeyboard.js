import { useEffect } from 'react';

export default function useKeyboard(shortcuts) {
  useEffect(() => {
    function handler(e) {
      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const metaMatch = shortcut.meta ? e.metaKey : true;
        if (keyMatch && ctrlMatch && metaMatch) {
          e.preventDefault();
          shortcut.handler(e);
          return;
        }
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
