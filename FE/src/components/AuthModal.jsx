import { useState, useEffect } from 'react'
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

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      const user = {
        name: mode === 'register' ? antName || 'Ant_NewMember' : identifier || 'Ant_Ramu',
        id: `ANT_${Math.floor(1000 + Math.random() * 9000)}`,
        grains: mode === 'register' ? 20 : 1840,
        cashback: mode === 'register' ? 0 : 450,
      }
      if (onLoginSuccess) {
        onLoginSuccess(user)
      }
      onClose()
    }, 900)
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>✕</button>

        <div className="auth-header">
          <div className="auth-brand-badge">🐜</div>
          <h2 className="auth-title">
            {mode === 'login'
              ? lang === 'ta' ? 'காலனி உள்நுழைவு' : 'Member Colony Login'
              : lang === 'ta' ? 'புதிய எறும்பு பதிவு' : 'Join Affinovas Colony'}
          </h2>
          <p className="auth-sub">
            {mode === 'login'
              ? lang === 'ta'
                ? 'உங்கள் கணக்கில் உள்நுழைந்து தானியங்களை கண்காணிக்கவும்'
                : 'Access your ant profile, branch networks & wallet'
              : lang === 'ta'
                ? '123 தானியங்கள் நுழைவுக் கட்டணத்துடன் காலனியில் இணையுங்கள்'
                : 'Unlock your 10-level referral branch with 123 grains entry'}
          </p>
        </div>

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
              {mode === 'register' ? 'Mobile Number / Email' : 'Ant Handle or Mobile'}
            </label>
            <input
              type="text"
              className="auth-input"
              placeholder={mode === 'register' ? '+91 98765 43210' : 'Enter Ant ID / Mobile'}
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
                placeholder="e.g. ANT_FOUNDER"
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
              'Enter Colony →'
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
