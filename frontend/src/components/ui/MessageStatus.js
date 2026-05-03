import React from 'react';

function MessageStatus({ status = 'sent' }) {
  const label = {
    sending: 'Sending',
    sent: 'Sent',
    delivered: 'Delivered',
    read: 'Read',
  }[status] || 'Sent';

  return (
    <span className={`message-status status-${status}`} aria-label={label} title={label}>
      {status === 'sending' ? '…' : '✓✓'}
    </span>
  );
}

export default MessageStatus;
