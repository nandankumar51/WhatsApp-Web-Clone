import React from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/ui/EmptyState';
import '../styles/ChatPage.css';

function NotFoundPage() {
  return (
    <main className="full-page-state">
      <EmptyState
        icon="404"
        title="This screen is not available"
        description="The route you opened does not exist in this messaging workspace."
      />
      <Link className="primary-action standalone-link" to="/">Return home</Link>
    </main>
  );
}

export default NotFoundPage;
