import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Scrolls the window back to the top whenever the route changes, so the
// SPA doesn't carry scroll position between pages.
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;