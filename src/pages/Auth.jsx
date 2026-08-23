import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn, signUp } from '../utils/auth';

const DEMO = { email: 'demo@travel.com', password: 'demo123' };

export default function Auth({ onAuth }) {
  const [tab,      setTab]      = useState('signin');  // 'signin' | 'signup'
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);


  function switchTab(newTab) {
    if (newTab === tab) return;
    setTab(newTab);
    setError('');
    // Clear only password on tab switch (keep email for convenience)
    setPassword('');
    if (newTab === 'signin') setName('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 300)); // tiny delay for UX feel
    const result = tab === 'signin'
      ? signIn(email, password)
      : signUp(name, email, password);
    setLoading(false);
    if (result.error) { setError(result.error); }
    else               { onAuth(result.user); }
  }

  function fillDemo() {
    setEmail(DEMO.email);
    setPassword(DEMO.password);
    setError('');
  }

  return (
    <div className="tl-auth-root">
      {/* Background blobs */}
      <div className="tl-auth-blob tl-auth-blob-1" />
      <div className="tl-auth-blob tl-auth-blob-2" />
      <div className="tl-auth-blob tl-auth-blob-3" />

      <motion.div
        className="tl-auth-card"
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <div className="tl-auth-logo">
          <span className="tl-auth-logo-icon">✈️</span>
          <div>
            <div className="tl-auth-logo-title">TravelList</div>
            <div className="tl-auth-logo-sub">Your personal travel bucket list</div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="tl-auth-tabs">
          <button
            className={`tl-auth-tab ${tab === 'signin' ? 'active' : ''}`}
            onClick={() => switchTab('signin')}
          >Sign In</button>
          <button
            className={`tl-auth-tab ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => switchTab('signup')}
          >Sign Up</button>
          <div className="tl-auth-tab-indicator" style={{ left: tab === 'signin' ? 4 : '50%' }} />
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.form
            key={tab}
            className="tl-auth-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: tab === 'signin' ? -16 : 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: tab === 'signin' ? 16 : -16 }}
            transition={{ duration: 0.22 }}
          >
            {tab === 'signup' && (
              <div className="tl-auth-field">
                <label className="tl-auth-label">Your Name</label>
                <input
                  className="tl-auth-input"
                  type="text"
                  placeholder="e.g. Pranit"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            <div className="tl-auth-field">
              <label className="tl-auth-label">Email</label>
              <input
                className="tl-auth-input"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus={tab === 'signin'}
              />
            </div>

            <div className="tl-auth-field">
              <label className="tl-auth-label">Password</label>
              <input
                className="tl-auth-input"
                type="password"
                placeholder={tab === 'signup' ? 'Min. 6 characters' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <motion.div
                className="tl-auth-error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                ⚠️ {error}
              </motion.div>
            )}

            <motion.button
              className="tl-auth-submit"
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {loading
                ? <span className="tl-auth-spinner" />
                : tab === 'signin' ? '✈️ Sign In' : '🗺️ Create Account'}
            </motion.button>
          </motion.form>
        </AnimatePresence>

        {/* Demo badge */}
        <div className="tl-auth-demo">
          <span>Try it instantly →</span>
          <button className="tl-auth-demo-btn" onClick={fillDemo} type="button">
            Use Demo Account
          </button>
        </div>

        {/* Pills */}
        <div className="tl-auth-pills">
          {['✈️ Trips', '📍 Spots', '📸 Photos', '₹ Expenses', '📄 PDF'].map(p => (
            <span key={p} className="tl-auth-pill">{p}</span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
