import { useState, useEffect } from 'react'
import { apiService } from '../services/apiService'
import './AuthModal.css'

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onLoginSuccess, lang = 'ta' }) {
  const [mode, setMode] = useState(initialMode) // 'login' | 'register'
  const [identifier, setIdentifier] = useState('')
  const [antName, setAntName] = useState('')
  const [password, setPassword] = useState('')
  const [refCode, setRefCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setMode(initialMode)
    const params = new URLSearchParams(window.location.search)
    const urlRef = params.get('ref')
    if (urlRef) {
      setRefCode(urlRef)
    }
  }, [initialMode, isOpen])

  if (!isOpen) return null

  const handleQuickFill = (email, pwd) => {
    setIdentifier(email)
    setPassword(pwd)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const data = await apiService.login(identifier, password)
        if (onLoginSuccess) {
          onLoginSuccess(data.user)
        }
        onClose()
      } else {
        const data = await apiService.register({
          email: identifier,
          password,
          name: antName || 'Ant_Member',
          referralCode: refCode
        })
        if (onLoginSuccess) {
          onLoginSuccess(data.user)
        }
        onClose()
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>✕</button>

        <div className="auth-header">
          <div className="auth-brand-badge">🐜</div>
          <h2 className="auth-title">
            {mode === 'login'
              ? lang === 'ta' ? 'காலனி உள்நுழைவு' : 'Member & Admin Login'
              : lang === 'ta' ? 'புதிய எறும்பு பதிவு' : 'Join Affinovas Colony'}
          </h2>
          <p className="auth-sub">
            {mode === 'login'
              ? lang === 'ta'
                ? 'உங்கள் கணக்கில் உள்நுழைந்து தானியங்களை கண்காணிக்கவும்'
                : 'Access your Ant member profile or Master Admin command deck'
              : lang === 'ta'
                ? '123 தானியங்கள் நுழைவுக் கட்டணத்துடன் காலனியில் இணையுங்கள்'
                : 'Unlock your 10-level referral branch with 123 grains entry'}
          </p>
        </div>

        {/* Quick Demo Fill Pills */}
        {mode === 'login' && (
          <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '0.75rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
              ⚡ Quick Test Credentials:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@affinovas.com', 'admin123')}
                style={{ padding: '0.35rem 0.7rem', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, color: '#064e3b', cursor: 'pointer' }}
              >
                👑 Master Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('ramu@affinovas.com', 'ramu123')}
                style={{ padding: '0.35rem 0.7rem', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, color: '#b45309', cursor: 'pointer' }}
              >
                🐜 Member (Ramu)
              </button>
            </div>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="auth-mode-tabs">
          <button
            type="button"
            className={`auth-mode-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            {lang === 'ta' ? 'உள்நுழைவு (Sign In)' : 'Sign In'}
          </button>
          <button
            type="button"
            className={`auth-mode-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            {lang === 'ta' ? 'புதிய பதிவு (Register)' : 'New Ant Register'}
          </button>
        </div>

        {error && <div className="auth-error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="auth-input-group">
              <label className="auth-label">Ant Name / Handle</label>
              <input
                type="text"
                className="auth-input"
                placeholder="e.g. Ant_Ramu"
                value={antName}
                onChange={(e) => setAntName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-input-group">
            <label className="auth-label">
              {mode === 'register' ? 'Email / Mobile' : 'Email Address'}
            </label>
            <input
              type="text"
              className="auth-input"
              placeholder="e.g. ramu@affinovas.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <input
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="auth-input-group">
              <div className="auth-ref-label-row">
                <label className="auth-label">Referral Code (Inviter Ant)</label>
                <span className="auth-ref-badge">Auto Applied</span>
              </div>
              <input
                type="text"
                className="auth-input"
                placeholder="e.g. AFF-RAMU"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
              />
              <p className="auth-entry-notice">
                🪙 Note: 123 grains colony joining fee unlocks your personal 10-level branch tree.
              </p>
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              'Authenticating...'
            ) : mode === 'login' ? (
              'Enter Colony Portal →'
            ) : (
              'Activate Ant Profile (123 Grains) →'
            )}
          </button>
        </form>

        <div className="auth-footer-text">
          {mode === 'login' ? (
            <span>
              New to the colony?{' '}
              <button className="auth-switch-link" onClick={() => setMode('register')}>
                Join as an Ant
              </button>
            </span>
          ) : (
            <span>
              Already an ant member?{' '}
              <button className="auth-switch-link" onClick={() => setMode('login')}>
                Sign In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
