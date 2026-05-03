import React from 'react';

function Toast({ message, tone = 'info' }) {
  if (!message) return null;

  return (
    <div className={`toast toast-${tone}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}

export default Toast;
