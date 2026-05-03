import React, { useEffect, useState } from 'react';
import { getInitials } from '../../utils/formatters';

function Avatar({ user, size = 'md', isOnline = false, className = '' }) {
  const src = user?.profilePicture;
  const name = user?.username || user?.email || 'User';
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  return (
    <div className={`avatar avatar-${size} ${className}`} aria-label={name}>
      {src && !imageFailed ? (
        <img src={src} alt={name} onError={() => setImageFailed(true)} />
      ) : (
        <span>{getInitials(name)}</span>
      )}
      <i className={`presence-dot ${isOnline ? 'online' : ''}`} />
    </div>
  );
}

export default Avatar;
