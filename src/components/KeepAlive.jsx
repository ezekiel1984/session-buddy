import React from 'react';
import { motion } from 'framer-motion';

/**
 * KeepAlive caches tab pages by keeping them mounted in the DOM and toggling
 * visibility with `display: none`. This preserves component state (scroll
 * position, loaded data, form inputs) when switching between tabs.
 *
 * Only pages flagged `cacheable` (i.e. tab pages) are cached. Non-tab pages
 * render directly and unmount when navigated away from.
 */
export default function KeepAlive({ activeKey, cacheable, children }) {
  const cacheRef = React.useRef({});

  // Store the current page element in the cache so its subtree stays mounted
  if (cacheable) {
    cacheRef.current[activeKey] = children;
  }

  return (
    <>
      {Object.entries(cacheRef.current).map(([key, cachedChildren]) => (
        <motion.div
          key={key}
          initial={{ opacity: 0 }}
          animate={{ opacity: key === activeKey ? 1 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ display: key === activeKey ? 'block' : 'none' }}
          aria-hidden={key !== activeKey}
        >
          {cachedChildren}
        </motion.div>
      ))}
      {/* Non-cacheable pages render directly (mount/unmount normally) */}
      {!cacheable && children}
    </>
  );
}