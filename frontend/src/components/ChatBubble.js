import React from 'react';
import MessageStatus from './ui/MessageStatus';
import { formatMessageTime } from '../utils/formatters';

function highlightText(text, query) {
  if (!query?.trim()) return text;

  const safeQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${safeQuery})`, 'gi'));

  return parts.map((part, index) => (
    part.toLowerCase() === query.trim().toLowerCase()
      ? <mark key={`${part}-${index}`}>{part}</mark>
      : part
  ));
}

const ChatBubble = React.forwardRef(function ChatBubble({
  message,
  isSent,
  searchQuery = '',
  isActiveSearchMatch = false,
}, ref) {
  const attachments = message.attachments || [];

  return (
    <div
      ref={ref}
      className={`message ${isSent ? 'sent' : 'received'} ${isActiveSearchMatch ? 'active-search-match' : ''}`}
    >
      <div className="message-content">
        {attachments.length > 0 ? (
          <div className="attachment-stack">
            {attachments.map((attachment, index) => (
              <a
                key={`${attachment.name}-${index}`}
                className={`attachment-card ${attachment.type?.startsWith('image/') ? 'image-card' : ''}`}
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
              >
                {attachment.type?.startsWith('image/') ? (
                  <img src={attachment.url} alt={attachment.name || 'Attachment'} />
                ) : (
                  <span className="attachment-icon">↗</span>
                )}
                <span className="attachment-name">{attachment.name || 'Attachment'}</span>
              </a>
            ))}
          </div>
        ) : null}

        {message.text ? <p>{highlightText(message.text, searchQuery)}</p> : null}

        <span className="message-meta">
          {formatMessageTime(message.createdAt)}
          {isSent ? <MessageStatus status={message.status || 'sent'} /> : null}
        </span>
      </div>
    </div>
  );
});

export default ChatBubble;
