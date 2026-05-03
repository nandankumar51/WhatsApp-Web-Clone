import React, { useRef, useState } from 'react';
import '../styles/MessageInput.css';

function MessageInput({ onSendMessage, onTypingStart, onTypingStop, chatPreferences }) {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const typingTimerRef = useRef(null);

  const sendCurrentMessage = () => {
    if (message.trim() || attachment) {
      onSendMessage({
        text: message.trim(),
        attachments: attachment ? [attachment] : [],
      });
      setMessage('');
      setAttachment(null);
      onTypingStop?.();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendCurrentMessage();
  };

  const handleKeyDown = (event) => {
    if (chatPreferences?.enterToSend && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendCurrentMessage();
    }
  };

  const handleMessageChange = (event) => {
    setMessage(event.target.value);
    onTypingStart?.();
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => onTypingStop?.(), 900);
  };

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        url: reader.result,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="message-composer">
      {attachment && chatPreferences?.mediaPreview !== false ? (
        <div className="composer-preview">
          {attachment.type.startsWith('image/') ? <img src={attachment.url} alt={attachment.name} /> : null}
          <span>{attachment.name}</span>
          <button type="button" onClick={() => setAttachment(null)}>Remove</button>
        </div>
      ) : null}

      <form className="message-input-form" onSubmit={handleSubmit}>
        <button type="button" className="composer-icon" title="Emoji">:)</button>
        <label className="composer-icon" title="Attach file">
          +
          <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleAttachmentChange} />
        </label>
        <textarea
          rows="1"
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="message-input"
        />
        <button type="submit" className="send-button" disabled={!message.trim() && !attachment}>
          Send
        </button>
      </form>
    </div>
  );
}

export default MessageInput;
