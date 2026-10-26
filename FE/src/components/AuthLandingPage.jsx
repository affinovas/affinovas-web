import { useState } from 'react'
import { apiService } from '../services/apiService'
import { toast } from './Toast'
import './AuthLandingPage.css'

export default function AuthLandingPage({ onLoginSuccess, colonyConfig }) {
  // Authentication Mode: 'mobile-otp' | 'password-login' | 'admin-login'
  const [authMethod, setAuthMethod] = useState('mobile-otp')

  // Mobile OTP States
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpStep, setOtpStep] = useState('phone') // 'phone' | 'otp'
  const [otpCode, setOtpCode] = useState('')
  const [antName, setAntName] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [showNewUserPassword, setShowNewUserPassword] = useState(false)
  const [refCode, setRefCode] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('ref') || ''
  })
  const [isNewUser, setIsNewUser] = useState(false)

  // Member Password Login States
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [memberPassword, setMemberPassword] = useState('')
  const [showMemberPassword, setShowMemberPassword] = useState(false)

  // Admin Legacy Access States
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [showAdminPassword, setShowAdminPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const entryFee = colonyConfig?.entryFeeGrains ?? 123
  const directBonus = colonyConfig?.directBonusGrains ?? 20
  const maxLevels = colonyConfig?.maxLevelsPerBranch ?? 10

  // 1. Send OTP to Mobile
  const handleSendOtp = async (e) => {
    e?.preventDefault()
    setError('')
    const cleanDigits = phoneNumber.replace(/\D/g, '')
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }

    setLoading(true)
    try {
      const res = await apiService.sendOtp(cleanDigits)
      setIsNewUser(res.isNewUser)
      setOtpStep('otp')
      toast.success(res.message, 'OTP Dispatched')
      if (res.devOtp) {
        toast.info(`🔑 Verification Code: ${res.devOtp}`, 'SMS OTP Received', 12000)
        setOtpCode(res.devOtp) // Auto-fill for seamless user testing
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // 2. Verify OTP & Authenticate / Register
  const handleVerifyOtp = async (e) => {
    e?.preventDefault()
    setError('')
    if (otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code.')
      return
    }

    setLoading(true)
    try {
      const cleanDigits = phoneNumber.replace(/\D/g, '')
      const res = await apiService.verifyOtp({
        phoneNumber: cleanDigits,
        otpCode: otpCode.trim(),
        antName: isNewUser ? antName : undefined,
        referralCode: isNewUser ? refCode : undefined,
        password: isNewUser && newUserPassword.trim() ? newUserPassword.trim() : undefined
      })
      toast.success(
        isNewUser ? 'Welcome to Affinovas! Your ant profile is ready.' : 'Signed in successfully!',
        'Verified'
      )
      if (onLoginSuccess) {
        onLoginSuccess(res.user)
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // 3. Member Password Sign In (Phone / Username + Password)
  const handleMemberPasswordLogin = async (e) => {
    e?.preventDefault()
    setError('')
    if (!loginIdentifier.trim() || !memberPassword) {
      setError('Please enter your mobile number or username and password.')
      return
    }

    setLoading(true)
    try {
      const data = await apiService.login(loginIdentifier.trim(), memberPassword)
      toast.success(`Welcome back, ${data.user.name || 'Ant Member'}!`, 'Access Granted')
      if (onLoginSuccess) {
        onLoginSuccess(data.user)
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials or password.')
    } finally {
      setLoading(false)
    }
  }

  // 4. Admin / Desk Sign In
  const handleAdminLogin = async (e) => {
    e?.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiService.login(adminEmail, adminPassword)
      toast.success('Admin Desk Access Granted.', 'Authenticated')
      if (onLoginSuccess) {
        onLoginSuccess(data.user)
      }
    } catch (err) {
      setError(err.message || 'Admin authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-landing-root">
      {/* Background Ambience Elements */}
      <div className="auth-glow-orb orb-1" />
      <div className="auth-glow-orb orb-2" />
      <div className="auth-mesh-grid" />

      {/* Top Floating Branding */}
      <header className="auth-landing-nav">
        <div className="auth-brand">
          <div className="auth-brand-logo">A</div>
          <div>
            <span className="auth-brand-title">Affinovas</span>
            <span className="auth-brand-tag">affinovas.online</span>
          </div>
        </div>
        <div className="auth-nav-badge">
          <span className="auth-pulse-dot" />
          <span>Decentralized Ant & Grain Network</span>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="auth-landing-container">
        {/* Left Side: Creative Real Platform Showcase */}
        <div className="auth-intro-side">
          <div className="auth-intro-pill">
            <span>✨ VERIFIED MEMBERSHIP PORTAL</span>
          </div>

          <h1 className="auth-hero-title">
            Step Into the <br />
            <span className="auth-gradient-text">Affinovas Colony.</span>
          </h1>

          <p className="auth-hero-description">
            Sign up or log in with your mobile number to start gathering real grains, track your independent
            10-level branch trees, and unlock instant UPI cashback clearances.
          </p>

          {/* 3 Real Platform Pillars */}
          <div className="auth-features-list">
            <div className="auth-feature-card">
              <div className="auth-feature-icon ant-icon">🐜</div>
              <div className="auth-feature-content">
                <h4>Ants & Grains Network</h4>
                <p>Refer fellow ants with +{directBonus} grains direct bonus and expand across {maxLevels} independent chart levels.</p>
              </div>
            </div>

            <div className="auth-feature-card">
              <div className="auth-feature-icon cash-icon">💸</div>
              <div className="auth-feature-content">
                <h4>Partner Merchant Cashback</h4>
                <p>Real-time cashback on daily essentials and e-commerce, instantly swappable into colony grains.</p>
              </div>
            </div>

            <div className="auth-feature-card">
              <div className="auth-feature-icon vault-icon">💼</div>
              <div className="auth-feature-content">
                <h4>Unified Member Vault</h4>
                <p>Transparent UPI withdrawals with live clearance tracking and zero-fee internal asset swaps.</p>
              </div>
            </div>
          </div>

          {/* Real Platform Capability Strip (Clean, Authentic, Sponsor-Safe) */}
          <div className="auth-stat-strip">
            <div className="stat-pill">
              <strong>10-Level</strong> Transparent Tree Depth
            </div>
            <div className="stat-pill">
              <strong>Direct UPI</strong> Zero-Fee Payouts
            </div>
            <div className="stat-pill">
              <strong>Mobile OTP</strong> Instant Verification
            </div>
          </div>
        </div>

        {/* Right Side: High-End Glassmorphic Auth Form */}
        <div className="auth-card-side">
          <div className="auth-glass-card">
            {/* Header Switcher */}
            <div className="auth-method-switcher">
              <button
                type="button"
                className={`method-switch-btn ${authMethod === 'mobile-otp' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMethod('mobile-otp')
                  setError('')
                }}
              >
                📱 Mobile OTP
              </button>
              <button
                type="button"
                className={`method-switch-btn ${authMethod === 'password-login' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMethod('password-login')
                  setError('')
                }}
              >
                🔑 Password Login
              </button>
              <button
                type="button"
                className={`method-switch-btn ${authMethod === 'admin-login' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMethod('admin-login')
                  setError('')
                }}
              >
                🛡️ Operator Desk
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="auth-error-banner">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* FLOW 1: MOBILE OTP (PRIMARY) */}
            {authMethod === 'mobile-otp' && (
              <div className="mobile-otp-flow">
                <div className="auth-form-header">
                  <h2>{otpStep === 'phone' ? 'Enter Mobile Number' : 'Verify Mobile OTP'}</h2>
                  <p>
                    {otpStep === 'phone'
                      ? 'We will send a 6-digit verification code to your phone.'
                      : `Enter the 6-digit code sent to +91 ${phoneNumber}.`}
                  </p>
                </div>

                {otpStep === 'phone' ? (
                  <form onSubmit={handleSendOtp} className="auth-form-body">
                    <div className="auth-input-group">
                      <label htmlFor="auth-phone">Mobile Number</label>
                      <div className="auth-input-wrap phone-input-wrap">
                        <span className="phone-country-code">+91</span>
                        <input
                          id="auth-phone"
                          type="tel"
                          maxLength={10}
                          placeholder="98765 43210"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          required
                          autoFocus
                        />
                      </div>
                      <span className="input-hint">No password needed. An SMS OTP will be generated instantly.</span>
                    </div>

                    <button
                      type="submit"
                      className="auth-submit-btn"
                      disabled={loading || phoneNumber.replace(/\D/g, '').length < 10}
                    >
                      {loading ? 'Sending OTP...' : 'Get 6-Digit OTP Code →'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="auth-form-body">
                    {isNewUser && (
                      <>
                        <div className="new-user-welcome-chip">
                          🎉 New Member Detected! Complete your quick profile:
                        </div>

                        <div className="auth-input-group">
                          <label htmlFor="auth-new-name">Ant Handle / Your Name</label>
                          <div className="auth-input-wrap">
                            <span className="input-icon">🐜</span>
                            <input
                              id="auth-new-name"
                              type="text"
                              placeholder="e.g. Ant_Ramesh"
                              value={antName}
                              onChange={(e) => setAntName(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="auth-input-group">
                          <div className="label-with-badge">
                            <label htmlFor="auth-new-pwd">Set Account Password</label>
                            <span className="ref-tag">Recommended</span>
                          </div>
                          <div className="auth-input-wrap">
                            <span className="input-icon">🔒</span>
                            <input
                              id="auth-new-pwd"
                              type={showNewUserPassword ? 'text' : 'password'}
                              placeholder="Create a password (for quick login later)"
                              value={newUserPassword}
                              onChange={(e) => setNewUserPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              className="toggle-pwd-btn"
                              onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                            >
                              {showNewUserPassword ? '🙈' : '👁️'}
                            </button>
                          </div>
                          <span className="input-hint">Set a password now to sign in directly without waiting for OTPs.</span>
                        </div>

                        <div className="auth-input-group">
                          <div className="label-with-badge">
                            <label htmlFor="auth-new-ref">Referral Code (Inviter Ant)</label>
                            <span className="ref-tag">Optional</span>
                          </div>
                          <div className="auth-input-wrap">
                            <span className="input-icon">🤝</span>
                            <input
                              id="auth-new-ref"
                              type="text"
                              placeholder="e.g. AFF-ADMIN"
                              value={refCode}
                              onChange={(e) => setRefCode(e.target.value)}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="auth-input-group">
                      <div className="label-with-badge">
                        <label htmlFor="auth-otp">6-Digit Verification Code</label>
                        <button
                          type="button"
                          className="change-phone-link"
                          onClick={() => {
                            setOtpStep('phone')
                            setOtpCode('')
                            setError('')
                          }}
                        >
                          Change Number
                        </button>
                      </div>
                      <div className="auth-input-wrap">
                        <span className="input-icon">🔑</span>
                        <input
                          id="auth-otp"
                          type="text"
                          maxLength={6}
                          placeholder="123456"
                          className="otp-code-input"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="auth-submit-btn"
                      disabled={loading || otpCode.trim().length !== 6}
                    >
                      {loading
                        ? 'Verifying...'
                        : isNewUser
                        ? `Join Colony & Start Harvesting (${entryFee} Grains) →`
                        : 'Verify & Enter Colony →'}
                    </button>

                    <div className="resend-otp-row">
                      <span>Didn't receive the code?</span>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading}
                        className="resend-link-btn"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* FLOW 2: MEMBER PASSWORD LOGIN */}
            {authMethod === 'password-login' && (
              <div className="password-login-flow">
                <div className="auth-form-header">
                  <h2>🔑 Member Sign In</h2>
                  <p>Log in directly with your registered mobile number or username and password.</p>
                </div>

                <form onSubmit={handleMemberPasswordLogin} className="auth-form-body">
                  <div className="auth-input-group">
                    <label htmlFor="auth-member-id">Mobile Number or Username</label>
                    <div className="auth-input-wrap">
                      <span className="input-icon">🐜</span>
                      <input
                        id="auth-member-id"
                        type="text"
                        placeholder="e.g. 9876543210 or Ant_Ramesh"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <div className="label-with-badge">
                      <label htmlFor="auth-member-pwd">Account Password</label>
                      <button
                        type="button"
                        className="change-phone-link"
                        onClick={() => {
                          setAuthMethod('mobile-otp')
                          setError('')
                        }}
                      >
                        Use Mobile OTP instead
                      </button>
                    </div>
                    <div className="auth-input-wrap">
                      <span className="input-icon">🔒</span>
                      <input
                        id="auth-member-pwd"
                        type={showMemberPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={memberPassword}
                        onChange={(e) => setMemberPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="toggle-pwd-btn"
                        onClick={() => setShowMemberPassword(!showMemberPassword)}
                      >
                        {showMemberPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={loading || !loginIdentifier.trim() || !memberPassword}
                  >
                    {loading ? 'Authenticating...' : 'Sign In to Colony →'}
                  </button>

                  <div className="resend-otp-row">
                    <span>Don't have a password yet?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('mobile-otp')
                        setError('')
                      }}
                      className="resend-link-btn"
                    >
                      Sign In or Register with Mobile OTP
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* FLOW 3: ADMIN / OPERATOR DESK */}
            {authMethod === 'admin-login' && (
              <div className="admin-login-flow">
                <div className="auth-form-header">
                  <h2>🛡️ Operator Admin Access</h2>
                  <p>Master administrator console for payouts, member roster, and economics.</p>
                </div>

                <form onSubmit={handleAdminLogin} className="auth-form-body">
                  <div className="auth-input-group">
                    <label htmlFor="auth-admin-email">Admin Email</label>
                    <div className="auth-input-wrap">
                      <span className="input-icon">👑</span>
                      <input
                        id="auth-admin-email"
                        type="email"
                        placeholder="admin@affinovas.com"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label htmlFor="auth-admin-pwd">Admin Password</label>
                    <div className="auth-input-wrap">
                      <span className="input-icon">🔒</span>
                      <input
                        id="auth-admin-pwd"
                        type={showAdminPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="toggle-pwd-btn"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                      >
                        {showAdminPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="auth-submit-btn" disabled={loading}>
                    {loading ? 'Authenticating...' : 'Access Admin Command Deck →'}
                  </button>
                </form>
              </div>
            )}

            {/* Real Security Footer */}
            <div className="auth-card-footer">
              <span className="security-tag">🔒 End-to-End Encrypted Mobile Verification</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding Strip */}
      <footer className="auth-landing-footer">
        <span>© 2026 Affinovas Ecosystem. All rights reserved.</span>
        <span>Secured with .NET Clean Architecture & Decentralized Grains Vault</span>
      </footer>
    </div>
  )
}
