import React from 'react';

interface LiveRegionProps {
  message: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({ message }) => {
  return (
    <div
      className="sr-only"
      aria-live="polite"
      aria-atomic="true"
      role="status"
    >
      {message}
    </div>
  );
};
