import { useEffect } from 'react';

interface KeyboardShortcutActions {
  onTogglePalette: () => void;
  onEscape: () => void;
  isPaletteOpen: boolean;
}

export function useKeyboardShortcuts(actions: KeyboardShortcutActions): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip when focused on form elements
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
        // Allow Escape even in input
        if (e.key === 'Escape') {
          actions.onEscape();
          return;
        }
        return;
      }

      // Cmd/Ctrl+K: toggle palette
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        actions.onTogglePalette();
        return;
      }

      if (e.key === 'Escape') {
        actions.onEscape();
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);
}
