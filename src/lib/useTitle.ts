import { useEffect } from 'react';

export function useTitle(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    if (description) {
      const tag = document.querySelector('meta[name="description"]');
      if (tag) tag.setAttribute('content', description);
    }
  }, [title, description]);
}
