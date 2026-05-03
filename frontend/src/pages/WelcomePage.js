import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Auth.css';

function WelcomePage() {
  return (
    <main className="auth-container onboarding">
      <section className="auth-hero-panel">
        <span className="hero-kicker">Private messaging, reimagined</span>
        <h1>Chat beautifully with the people who matter.</h1>
        <p>
          A polished WhatsApp-inspired MVP with realtime chats, rich presence, and a premium
          mobile-first interface.
        </p>
        <div className="hero-actions">
          <Link className="auth-button hero-button" to="/register">Create account</Link>
          <Link className="ghost-button" to="/login">Sign in</Link>
        </div>
      </section>

      <section className="phone-preview" aria-label="Messaging app preview">
        <div className="preview-header">
          <span className="preview-avatar">A</span>
          <span>
            <strong>Abhishek</strong>
            <small>online now</small>
          </span>
        </div>
        <div className="preview-bubble received">Hey, did you finish the UI polish?</div>
        <div className="preview-bubble sent">Almost. It feels much more premium now.</div>
        <div className="preview-typing"><i /><i /><i /></div>
      </section>
    </main>
  );
}

export default WelcomePage;
