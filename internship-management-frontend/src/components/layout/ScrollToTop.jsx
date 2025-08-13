// src/components/layout/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * This component scrolls the window to the top
 * whenever the current route changes.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Using instant scroll
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // change to "smooth" if you want smooth scroll
    });
  }, [pathname]);

  return null; // no UI rendering
};

export default ScrollToTop;
