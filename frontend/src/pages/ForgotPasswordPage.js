import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Auth.css';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage('Password reset is ready for backend email integration. For now, use your registered password.');
  };

  return (
    <main className="auth-container">
      <section className="auth-card compact-card">
        <div className="auth-header">
          <span className="brand-mark">WA</span>
          <h1>Recover access</h1>
          <p>Enter your email to prepare a password reset request.</p>
        </div>
        {message ? <div className="success-message">{message}</div> : null}
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="form-group" htmlFor="email">
            <span>Email</span>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <button type="submit" className="auth-button">Continue</button>
        </form>
        <p className="auth-link">
          Remembered it? <Link to="/login">Back to login</Link>
        </p>
      </section>
    </main>
  );
}

export default ForgotPasswordPage;
