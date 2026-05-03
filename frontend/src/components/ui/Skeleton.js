import React from 'react';

function Skeleton({ count = 3 }) {
  return (
    <div className="skeleton-list" aria-label="Loading">
      {Array.from({ length: count }).map((_, index) => (
        <div className="skeleton-row" key={index}>
          <span className="skeleton-avatar" />
          <span className="skeleton-lines">
            <i />
            <i />
          </span>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
