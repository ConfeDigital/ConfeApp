import { useState, useEffect } from 'react';

function useDocumentTitle(initialTitle) {
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    document.title = title;
    // Dispatch a custom event whenever the title changes
    window.dispatchEvent(new CustomEvent('documentTitleChanged', { detail: title }));
  }, [title]);

  return setTitle;
}

export default useDocumentTitle;