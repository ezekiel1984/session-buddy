import React from 'react';

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
        <div
          key={key}
          style={{ display: key === activeKey ? 'block' : 'none' }}
          aria-hidden={key !== activeKey}
        >
          {cachedChildren}
        </div>
      ))}
      {/* Non-cacheable pages render directly (mount/unmount normally) */}
      {!cacheable && children}
    </>
  );
}