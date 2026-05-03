import React from 'react';

function TypingIndicator({ name }) {
  return (
    <div className="typing-indicator" role="status" aria-live="polite">
      <span>{name ? `${name} is typing` : 'Typing'}</span>
      <i />
      <i />
      <i />
    </div>
  );
}

export default TypingIndicator;
