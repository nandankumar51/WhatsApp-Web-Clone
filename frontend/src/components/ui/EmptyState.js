import React from 'react';

function EmptyState({ icon = '✦', title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">{icon}</div>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {actionLabel ? (
        <button type="button" className="primary-action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default EmptyState;
