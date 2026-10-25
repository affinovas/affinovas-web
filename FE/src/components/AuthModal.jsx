import { useState, useEffect } from 'react'
import { apiService } from '../services/apiService'
import './AuthModal.css'

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onLoginSuccess, lang = 'ta', onLangChange, colonyConfig }) {
  const [mode, setMode] = useState(initialMode) // 'login' | 'register'
  const [identifier, setIdentifier] = useState('')
  const [antName, setAntName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [refCode, setRefCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const entryFee = colonyConfig?.entryFeeGrains ?? 123
  const maxDepth = colonyConfig?.maxLevelsPerBranch ?? 10
  const registrationsOpen = colonyConfig?.registrationsOpen ?? true

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
    if (mode === 'register' && !registrationsOpen) {
      setError(lang === 'ta' 
        ? 'புதிய காலனி பதிவுகள் தற்காலிகமாக நிர்வாகியால் நிறுத்தப்பட்டுள்ளன.'
        : 'New colony registrations are currently paused by the Master Administrator.')
      return
    }
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
      setError(err.message || (lang === 'ta' ? 'உள்நுழைவு தோல்வியடைந்தது. விவரங்களைச் சரிபார்க்கவும்.' : 'Authentication failed. Please check credentials.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Bar with Language Switcher and Close Button */}
        <div className="auth-modal-top-bar">
          <div className="auth-modal-lang-toggle">
            <button
              type="button"
              className={`auth-modal-lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => onLangChange?.('en')}
            >
              English
            </button>
            <button
              type="button"
              className={`auth-modal-lang-btn ${lang === 'ta' ? 'active' : ''}`}
              onClick={() => onLangChange?.('ta')}
            >
              தமிழ்
            </button>
          </div>
          <button className="auth-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="auth-header">
          <div className="auth-brand-badge">🐜</div>
          <h2 className="auth-title">
            {mode === 'login'
              ? lang === 'ta' ? 'காலனி உள்நுழைவு' : 'Colony Sign In'
              : lang === 'ta' ? 'புதிய எறும்பு பதிவு' : 'Join Affinovas Colony'}
          </h2>
          <p className="auth-sub">
            {mode === 'login'
              ? lang === 'ta'
                ? 'உங்கள் கணக்கில் உள்நுழைந்து தானியங்களை கண்காணிக்கவும்'
                : 'Access your Ant member profile or Master Admin command deck'
              : lang === 'ta'
                ? `${entryFee} தானியங்கள் நுழைவுக் கட்டணத்துடன் காலனியில் இணையுங்கள்`
                : `Unlock your ${maxDepth}-level referral branch with ${entryFee} grains entry`}
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
              <label className="auth-label">
                {lang === 'ta' ? 'எறும்பு பெயர் / பயனர் பெயர்' : 'Ant Name / Handle'}
              </label>
              <input
                type="text"
                className="auth-input"
                placeholder={lang === 'ta' ? 'எ.கா. Ant_Ramu' : 'e.g. Ant_Ramu'}
                value={antName}
                onChange={(e) => setAntName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-input-group">
            <label className="auth-label">
              {mode === 'register'
                ? lang === 'ta' ? 'மின்னஞ்சல் / கைபேசி எண்' : 'Email Address / Mobile'
                : lang === 'ta' ? 'மின்னஞ்சல் முகவரி' : 'Email Address'}
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
            <label className="auth-label">
              {lang === 'ta' ? 'கடவுச்சொல் (Password)' : 'Password'}
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label="Toggle password visibility"
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="auth-input-group">
              <div className="auth-ref-label-row">
                <label className="auth-label">
                  {lang === 'ta' ? 'பரிந்துரை குறியீடு (அழைத்த எறும்பு)' : 'Referral Code (Inviter Ant)'}
                </label>
                <span className="auth-ref-badge">{lang === 'ta' ? 'தானாக இணைக்கப்பட்டது' : 'Auto Applied'}</span>
              </div>
              <input
                type="text"
                className="auth-input"
                placeholder="e.g. AFF-RAMU"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
              />
              <p className="auth-entry-notice">
                {lang === 'ta'
                  ? `🪙 குறிப்பு: ${entryFee} தானியங்கள் காலனி நுழைவுக் கட்டணம் உங்களின் 10-நிலை கிளை மரத்தைத் திறக்கும்.`
                  : `🪙 Note: ${entryFee} grains colony joining fee unlocks your personal ${maxDepth}-level branch tree.`}
              </p>
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              lang === 'ta' ? 'சரிபார்க்கிறது...' : 'Authenticating...'
            ) : mode === 'login' ? (
              lang === 'ta' ? 'காலனி தளத்திற்குள் நுழையவும் →' : 'Enter Colony Portal →'
            ) : (
              lang === 'ta' ? `எறும்பு சுயவிவரத்தை இயக்கவும் (${entryFee} தானியங்கள்) →` : `Activate Ant Profile (${entryFee} Grains) →`
            )}
          </button>
        </form>

        <div className="auth-footer-text">
          {mode === 'login' ? (
            <span>
              {lang === 'ta' ? 'காலனிக்கு புதியவரா? ' : 'New to the colony? '}
              <button className="auth-switch-link" onClick={() => setMode('register')}>
                {lang === 'ta' ? 'புதிய எறும்பாக இணையுங்கள்' : 'Join as an Ant'}
              </button>
            </span>
          ) : (
            <span>
              {lang === 'ta' ? 'ஏற்கனவே எறும்பு உறுப்பினரா? ' : 'Already an ant member? '}
              <button className="auth-switch-link" onClick={() => setMode('login')}>
                {lang === 'ta' ? 'உள்நுழையவும்' : 'Sign In'}
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
