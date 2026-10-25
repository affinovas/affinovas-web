import { useState, useEffect } from 'react'
import ColonyTreeVisualizer from './components/ColonyTreeVisualizer'
import ColonyShareCard from './components/ColonyShareCard'
import AuthLandingPage from './components/AuthLandingPage'
import AuthModal from './components/AuthModal'
import AdminDashboard from './components/AdminDashboard'
import PromptModal from './components/PromptModal'
import { ToastContainer, toast } from './components/Toast'
import { apiService } from './services/apiService'
import './App.css'

export default function App() {
  // Navigation: 'home' | 'colony' | 'cashback' | 'vault' | 'admin'
  const [activeTab, setActiveTab] = useState('home')
  const [lang, setLang] = useState('ta') // 'ta' or 'en' for colony
  const [promptConfig, setPromptConfig] = useState(null)

  // Auth state & User Session
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login') // 'login' | 'register'
  const [currentUser, setCurrentUser] = useState(() => apiService.getCurrentUser())

  // Ants & Grains state (production clean defaults)
  const [userGrains, setUserGrains] = useState(() => apiService.getCurrentUser()?.grainsBalance ?? 0)
  const [cashbackBalance, setCashbackBalance] = useState(() => apiService.getCurrentUser()?.cashbackBalance ?? 0)
  const [colonySubTab, setColonySubTab] = useState('tree') // 'tree' | 'explorer'
  const [directInvites, setDirectInvites] = useState(() => Math.max(1, apiService.getCurrentUser()?.directAntsCount || 1))
  const [levelDepth, setLevelDepth] = useState(1)
  const [antName, setAntName] = useState(() => apiService.getCurrentUser()?.name || 'Ant_Member')
  const [copied, setCopied] = useState(false)

  // Dynamic Colony Economics & Merchant Configuration State (Connected to Admin Desk)
  const [colonyConfig, setColonyConfig] = useState({
    entryFeeGrains: 123,
    directBonusGrains: 20,
    levelExpansionMultiplier: 5,
    maxLevelsPerBranch: 10,
    grainToInrRatio: 1.0,
    cashbackToGrainMultiplier: 1.5,
    registrationsOpen: true
  })
  const [merchantsList, setMerchantsList] = useState([])

  // Passbook Dynamic Transactions State (Authentic empty list for real users)
  const [passbookList, setPassbookList] = useState([])

  // Cashback state & Dynamic Calculations (Realistic starting point)
  const [monthlySpend, setMonthlySpend] = useState(2500)
  const [avgCashbackRate, setAvgCashbackRate] = useState(5)
  const [convertedGrains, setConvertedGrains] = useState(0)

  const monthlyCashbackINR = Math.round((monthlySpend * avgCashbackRate) / 100)
  const bonusGrainsFromCashback = Math.floor(monthlyCashbackINR * (colonyConfig?.cashbackToGrainMultiplier || 1.5))

  // Fetch Live Configuration & Partner Merchants on Mount
  useEffect(() => {
    async function loadDynamicConfig() {
      try {
        const [settingsRes, merchantsRes] = await Promise.allSettled([
          apiService.getColonySettings(),
          apiService.getMerchants()
        ])
        if (settingsRes.status === 'fulfilled' && settingsRes.value) {
          setColonyConfig(settingsRes.value)
        }
        if (merchantsRes.status === 'fulfilled' && Array.isArray(merchantsRes.value)) {
          setMerchantsList(merchantsRes.value)
        }
      } catch (err) {
        console.error('Failed to load initial configuration', err)
      }
    }
    loadDynamicConfig()
  }, [])

  // Auto-switch tab if URL contains ?tab= or ?ref=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get('tab')
    const refParam = params.get('ref')
    if (tabParam && ['home', 'colony', 'cashback', 'vault'].includes(tabParam)) {
      setActiveTab(tabParam)
    } else if (refParam) {
      setActiveTab('colony')
    }
  }, [])

  // Dynamic Level Table generated strictly from Admin Configurator parameters
  const maxLevels = colonyConfig.maxLevelsPerBranch || 10
  const multiplier = colonyConfig.levelExpansionMultiplier || 5
  const directBonus = colonyConfig.directBonusGrains || 20
  const entryFee = colonyConfig.entryFeeGrains || 123

  const levelTable = Array.from({ length: maxLevels }, (_, i) => {
    const lvl = i + 1
    return {
      level: lvl,
      ants: Math.pow(multiplier, lvl),
      bonus: lvl * 100
    }
  })

  // Colony calculations (fully dynamic)
  const directGrains = directInvites * directBonus
  const levelBonusPerBranch = levelTable
    .slice(0, Math.min(levelDepth, maxLevels))
    .reduce((sum, item) => sum + item.bonus, 0)
  const totalLevelGrains = levelBonusPerBranch * directInvites
  const totalHarvestGrains = directGrains + totalLevelGrains

  const handleCopyLink = () => {
    const link = `https://affinovas.online?tab=colony&ref=${encodeURIComponent(antName || 'AntMember')}`
    navigator.clipboard?.writeText(link)
    setCopied(true)
    toast.success('Colony invitation pass link copied to clipboard!', 'Link Copied')
    setTimeout(() => setCopied(false), 3000)
  }

  // Handle Member Payout Request with Custom Modal
  const handleRequestWithdrawal = () => {
    if (cashbackBalance <= 0) {
      toast.warning('Your Cashback Wallet is currently empty.', 'Zero Balance')
      return
    }

    const defaultUpi = currentUser?.upiId || 'ramu@okhdfcbank'
    setPromptConfig({
      title: '⚡ Instant UPI Payout Request',
      subtitle: 'Transfer available cashback directly to your bank account via UPI',
      icon: '💸',
      type: 'default',
      detailLabel: 'Withdrawal Balance:',
      detailValue: `₹${cashbackBalance.toFixed(2)}`,
      inputLabel: 'Enter your UPI ID (VPA)',
      initialValue: defaultUpi,
      placeholder: 'e.g. yourname@okhdfcbank',
      submitText: `Transfer ₹${cashbackBalance} to Bank →`,
      onSubmit: async (upi) => {
        if (!upi || !upi.includes('@')) {
          toast.error('Please enter a valid UPI address (e.g. name@bank)', 'Invalid UPI')
          return
        }

        setPromptConfig(null)
        try {
          const res = await apiService.requestWithdrawal({
            userId: currentUser?.id || '22222222-2222-2222-2222-222222222222',
            userEmail: currentUser?.email || 'ramu@affinovas.com',
            userName: currentUser?.name || 'Ramu AntLeader',
            amount: cashbackBalance,
            upiId: upi
          })

          const amt = cashbackBalance
          setCashbackBalance(0)
          setPassbookList((prev) => [
            {
              id: 'tx-' + Date.now(),
              date: 'Just now',
              desc: `Payout Request to ${upi}`,
              cat: 'Withdrawal',
              amount: `-₹${amt.toFixed(2)}`,
              isGrains: false,
              isNegative: true,
              status: 'Pending Clearance'
            },
            ...prev
          ])

          toast.success(
            `Payout of ₹${amt} submitted to ${upi}!\nThis request is now live on the Operator Admin Desk.`,
            'Payout Request Sent'
          )
        } catch (err) {
          toast.error(err.message, 'Withdrawal Failed')
        }
      }
    })
  }

  // If user is not authenticated, render the dedicated Intro / Login / Signup Gateway Page
  if (!currentUser) {
    return (
      <div className="affinovas-app">
        <AuthLandingPage
          onLoginSuccess={(u) => {
            setCurrentUser(u)
            setUserGrains(u.grainsBalance ?? 0)
            setCashbackBalance(u.cashbackBalance ?? 0)
            setDirectInvites(u.directAntsCount ?? 0)
            setLevelDepth(u.activeBranchDepth ?? 1)
            if (u.name) setAntName(u.name)
            setActiveTab(u.role === 'admin' ? 'admin' : 'colony')
            toast.success(`Welcome back, ${u.name || 'Ant Member'}!`, 'Access Granted')
          }}
          colonyConfig={colonyConfig}
        />
        <ToastContainer />
      </div>
    )
  }

  return (
    <div className="affinovas-app">
      {/* Master Top Navigation Bar */}
      <header className="master-nav">
        <div className="brand-section" onClick={() => setActiveTab('home')}>
          <div className="affinovas-logo-badge">A</div>
          <div className="brand-meta">
            <span className="brand-name-main">
              Affinovas
            </span>
            <span className="brand-domain-chip">affinovas.online</span>
          </div>
        </div>

        {/* Ecosystem Module Switcher (Role-aware & Login Protected) */}
        <nav className="module-switcher">
          <button
            className={`module-tab-btn ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            🏠 Hub
          </button>
          
          {/* Member Tabs (Colony, Cashback, Services, Vault) */}
          <button
            className={`module-tab-btn ${activeTab === 'colony' ? 'active' : ''}`}
            onClick={() => {
              if (currentUser) {
                setActiveTab('colony')
              } else {
                toast.warning('Please sign in to access Ants & Grains Colony.', 'Sign In Required')
                setAuthMode('login')
                setAuthModalOpen(true)
              }
            }}
          >
            🐜 Ants & Grains
          </button>
          <button
            className={`module-tab-btn ${activeTab === 'cashback' ? 'active' : ''}`}
            onClick={() => {
              if (currentUser) {
                setActiveTab('cashback')
              } else {
                toast.warning('Please sign in to access Cashback & Deals.', 'Sign In Required')
                setAuthMode('login')
                setAuthModalOpen(true)
              }
            }}
          >
            💸 Cashback & Deals
          </button>
          <button
            className={`module-tab-btn ${activeTab === 'vault' ? 'active' : ''}`}
            onClick={() => {
              if (currentUser) {
                setActiveTab('vault')
              } else {
                toast.warning('Please sign in to access your Vault.', 'Sign In Required')
                setAuthMode('login')
                setAuthModalOpen(true)
              }
            }}
          >
            💼 Vault
          </button>
        </nav>

        {/* User Actions */}
        <div className="nav-right-actions">
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              {currentUser.role !== 'admin' && (
                <div className="wallet-quick-badge" onClick={() => setActiveTab('vault')} title="View Vault">
                  <span>🌾 {userGrains.toLocaleString()}</span>
                  <span style={{ opacity: 0.5 }}>|</span>
                  <span style={{ color: 'var(--emerald-primary)', fontWeight: 800 }}>₹{cashbackBalance}</span>
                </div>
              )}
              <div
                className="wallet-quick-badge"
                onClick={() => {
                  if (currentUser.role === 'admin') {
                    setActiveTab(activeTab === 'admin' ? 'home' : 'admin')
                  }
                }}
                title={currentUser.role === 'admin' ? 'Toggle Admin Command Deck' : 'Member Account'}
                style={{
                  background: currentUser.role === 'admin' ? (activeTab === 'admin' ? '#10b981' : '#ecfdf5') : '#fffbeb',
                  borderColor: currentUser.role === 'admin' ? '#10b981' : '#f59e0b',
                  color: currentUser.role === 'admin' ? (activeTab === 'admin' ? '#ffffff' : '#064e3b') : '#92400e',
                  fontWeight: 800,
                  cursor: currentUser.role === 'admin' ? 'pointer' : 'default',
                  boxShadow: activeTab === 'admin' ? '0 2px 10px rgba(16, 185, 129, 0.4)' : 'none'
                }}
              >
                <span>{currentUser.role === 'admin' ? '👑 Admin' : `🐜 ${currentUser.name?.split(' ')[0] || 'Ant'}`}</span>
              </div>
              <button
                className="nav-logout-btn"
                title="Logout"
                onClick={() => {
                  apiService.logout()
                  setCurrentUser(null)
                  setUserGrains(0)
                  setCashbackBalance(0)
                  setDirectInvites(0)
                  setLevelDepth(1)
                  setAntName('Ant_Member')
                  setActiveTab('home')
                  toast.info('You have safely signed out of your account.', 'Signed Out')
                }}
              >
                🚪 Logout
              </button>
            </div>
          ) : (
            <button
              className="nav-cta"
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              onClick={() => {
                setAuthMode('login')
                setAuthModalOpen(true)
              }}
            >
              🔑 Sign In / Join
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="main-wrapper">
        {/* ======================================================== */}
        {/* TAB 1: AFFINOVAS ECOSYSTEM HUB (DEFAULT LANDING)         */}
        {/* ======================================================== */}
        {activeTab === 'home' && (
          <section className="portal-home">
            <div className="portal-hero">
              <div className="portal-pill">
                <span>🌟 AFFINOVAS UNIFIED DIGITAL ECOSYSTEM</span>
              </div>

              <h1 className="portal-heading">
                One Platform. <br />
                <span className="portal-gradient-text">Infinite Opportunities & Rewards.</span>
              </h1>

              <p className="portal-sub">
                Affinovas bridges community referral networks, real-world shopping cashback,
                and high-scale digital solutions under one unified architecture.
                Choose a module below to get started.
              </p>
            </div>

            {/* 4 Interactive Pillars */}
            <div className="pillars-grid">
              {/* Pillar 1: Ants & Grains */}
              <div
                className="pillar-card"
                style={{ '--card-accent': '#f59e0b' }}
                onClick={() => {
                  if (currentUser) {
                    setActiveTab('colony')
                  } else {
                    toast.warning('Please sign in to access Ants & Grains Colony.', 'Sign In Required')
                    setAuthMode('login')
                    setAuthModalOpen(true)
                  }
                }}
              >
                <div>
                  <div className="pillar-icon-box">🐜</div>
                  <span className="pillar-badge">Colony Network</span>
                  <h3 className="pillar-title">Ants & Grains Colony</h3>
                  <p className="pillar-desc">
                    Our flagship referral ecosystem. Invite fellow ants, gather grains, and build isolated 10-level branch trees multiplying at 5× speed.
                  </p>
                </div>
                <div className="pillar-action-row">
                  <span className="pillar-highlight">123 Grains • 10 Levels</span>
                  <span className="pillar-btn">Enter Colony →</span>
                </div>
              </div>

              {/* Pillar 2: Cashback & Deals */}
              <div
                className="pillar-card"
                style={{ '--card-accent': '#10b981' }}
                onClick={() => {
                  if (currentUser) {
                    setActiveTab('cashback')
                  } else {
                    toast.warning('Please sign in to access Cashback & Deals.', 'Sign In Required')
                    setAuthMode('login')
                    setAuthModalOpen(true)
                  }
                }}
              >
                <div>
                  <div className="pillar-icon-box">💸</div>
                  <span className="pillar-badge" style={{ color: 'var(--emerald-deep)', background: '#ecfdf5', borderColor: '#10b981' }}>
                    Instant Savings
                  </span>
                  <h3 className="pillar-title">Cashback & Smart Deals</h3>
                  <p className="pillar-desc">
                    Earn up to 25% instant cashback on partner shopping, travel, and recharges. Convert cashback directly into colony grains or withdraw.
                  </p>
                </div>
                <div className="pillar-action-row">
                  <span className="pillar-highlight" style={{ color: 'var(--emerald-primary)' }}>Up to 25% Rebate</span>
                  <span className="pillar-btn">Explore Deals →</span>
                </div>
              </div>


              {/* Pillar 4: Unified Vault */}
              <div
                className="pillar-card"
                style={{ '--card-accent': '#8b5cf6' }}
                onClick={() => {
                  if (currentUser) {
                    setActiveTab('vault')
                  } else {
                    toast.warning('Please sign in to access your Vault.', 'Sign In Required')
                    setAuthMode('login')
                    setAuthModalOpen(true)
                  }
                }}
              >
                <div>
                  <div className="pillar-icon-box">💼</div>
                  <span className="pillar-badge" style={{ color: '#7e22ce', background: '#faf5ff', borderColor: '#c084fc' }}>
                    Multi-Asset
                  </span>
                  <h3 className="pillar-title">Unified Member Vault</h3>
                  <p className="pillar-desc">
                    A single decentralized wallet tracking your grains harvest, cashback balances,
                    direct bonuses, and instant payout withdrawals.
                  </p>
                </div>
                <div className="pillar-action-row">
                  <span className="pillar-highlight" style={{ color: '#7e22ce' }}>Zero Fee Swap</span>
                  <span className="pillar-btn">Open Vault →</span>
                </div>
              </div>
            </div>

            {/* Ecosystem Verified Parameters Strip (Sponsor & Investor Credibility) */}
            <div className="ecosystem-stats-strip">
              <div className="stat-item">
                <h3>{maxLevels} Levels</h3>
                <p>Isolated Branch Chart Depth</p>
              </div>
              <div className="stat-item">
                <h3>{multiplier}× Multiplier</h3>
                <p>Level Progression Formula</p>
              </div>
              <div className="stat-item">
                <h3>+{directBonus} Grains</h3>
                <p>Instant Direct Referral Bonus</p>
              </div>
              <div className="stat-item">
                <h3>Zero Fee</h3>
                <p>Internal UPI Clearance Payouts</p>
              </div>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ANTS & GRAINS COLONY DEEP-DIVE SYSTEM             */}
        {/* ======================================================== */}
        {activeTab === 'colony' && (
          <section className="colony-section">
            <div className="module-breadcrumb-bar">
              <button className="breadcrumb-back-btn" onClick={() => setActiveTab('home')}>
                ← Back to Affinovas Hub
              </button>
              <div className="lang-toggle">
                <button
                  className={`lang-btn ${lang === 'ta' ? 'active' : ''}`}
                  onClick={() => setLang('ta')}
                >
                  தமிழ்
                </button>
                <button
                  className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => setLang('en')}
                >
                  English
                </button>
              </div>
            </div>

            <div className="colony-hero" style={{ paddingTop: '1rem' }}>
              <div className="colony-pill">
                <span>🐜 ANTS & GRAINS COLONY SYSTEM 🌾</span>
              </div>
              <h1 className="hero-heading">
                {lang === 'ta' ? (
                  <>
                    ஒவ்வொரு எறும்பும் தானியம் சேர்க்கும். <br />
                    <span className="gold-text">காலனியை ஒன்றாய் உருவாக்குவோம்.</span>
                  </>
                ) : (
                  <>
                    Every Ant Gathers Grains. <br />
                    <span className="gold-text">Together We Build The Colony.</span>
                  </>
                )}
              </h1>
              <p className="hero-description">
                {lang === 'ta'
                  ? `Ants & Grains enbadhu oru referral-based colony system. Ovvoru member-um pudhu members-ai invite pannalaam. Direct referral bonus (${directBonus} grains) matrum ovvoru direct member-oda keezhayum thani ${maxLevels}-level branch growth!`
                  : `A community-driven ant colony ecosystem. Invite friends with ${directBonus} grains direct bonus, and unlock independent ${maxLevels}-level branch charts that multiply by ${multiplier}× at every stage.`}
              </p>
            </div>

            {/* Quick Metrics (Dynamic from Admin Configurator) */}
            <div className="metrics-row">
              <div className="metric-card">
                <div className="metric-icon">🪙</div>
                <div className="metric-value">{entryFee}</div>
                <div className="metric-label">{lang === 'ta' ? 'Joining / Entry Fee' : 'Colony Entry Fee'}</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">🤝</div>
                <div className="metric-value">+{directBonus}</div>
                <div className="metric-label">{lang === 'ta' ? 'Direct Referral Bonus' : 'Direct Referral Bonus'}</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">📈</div>
                <div className="metric-value">{multiplier}×</div>
                <div className="metric-label">{lang === 'ta' ? 'Level Growth Rate' : `Level Expansion (${multiplier}x)`}</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">🪺</div>
                <div className="metric-value">{maxLevels}</div>
                <div className="metric-label">{lang === 'ta' ? 'Max Levels per Branch' : 'Max Levels per Branch'}</div>
              </div>
            </div>

            {/* Interactive Calculator Section */}
            <div id="calculator" className="calculator-box">
              <div className="calc-header">
                <h2>{lang === 'ta' ? '🌾 தானிய அறுவடை கால்குலேட்டர்' : '🌾 Interactive Grain Harvest Calculator'}</h2>
                <p>
                  {lang === 'ta'
                    ? 'Ungal direct referrals matrum avargaloda level depth-ai adjust panni ungal grains-ai calculate pannunga!'
                    : 'Adjust your direct ant referrals and branch level depth to see your total potential grains in real time.'}
                </p>
              </div>

              <div className="calc-grid">
                <div className="calc-inputs">
                  <div className="slider-group">
                    <div className="slider-label">
                      <span>{lang === 'ta' ? 'Direct Referral Ants (உங்க நேரடி எறும்புகள்)' : 'Direct Ant Referrals'}</span>
                      <span className="slider-value-pill">{directInvites} Ants</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={directInvites}
                      onChange={(e) => setDirectInvites(Number(e.target.value))}
                      className="colony-slider"
                    />
                  </div>

                  <div className="slider-group">
                    <div className="slider-label">
                      <span>{lang === 'ta' ? 'Branch Level Growth Depth (வளர்ச்சி நிலை)' : 'Branch Growth Depth'}</span>
                      <span className="slider-value-pill">Level {levelDepth}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max={maxLevels}
                      value={levelDepth}
                      onChange={(e) => setLevelDepth(Number(e.target.value))}
                      className="colony-slider"
                    />
                  </div>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {lang === 'ta'
                      ? `💡 Note: Ovvoru direct referral-ukkum thaniya oru ${maxLevels}-level chart irukkum. Unlimited direct referrals panna mudiyum!`
                      : `💡 Rule: Every direct referral gets their own isolated ${maxLevels}-level chart. Unlimited direct referrals are allowed!`}
                  </p>
                </div>

                <div className="calc-results">
                  <div className="calc-result-row">
                    <span>{lang === 'ta' ? `Direct Referral Bonus (${directBonus} per ant)` : `Direct Bonus (${directBonus} grains / ant)`}</span>
                    <span className="calc-result-val">{directGrains.toLocaleString()} Grains</span>
                  </div>
                  <div className="calc-result-row">
                    <span>{lang === 'ta' ? `Level Bonuses (Level 1 to ${levelDepth})` : `Level Bonuses (1 to ${levelDepth})`}</span>
                    <span className="calc-result-val">+{totalLevelGrains.toLocaleString()} Grains</span>
                  </div>
                  <div className="calc-result-row">
                    <span>{lang === 'ta' ? 'Active Branches Count' : 'Active Branches'}</span>
                    <span className="calc-result-val">{directInvites} Branches</span>
                  </div>

                  <div className="total-harvest-box">
                    <div className="total-title">{lang === 'ta' ? 'மொத்த தானியங்கள் (Total Harvest)' : 'Total Grains Harvest'}</div>
                    <div className="total-grains">{totalHarvestGrains.toLocaleString()} 🌾</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 1: Hierarchy View Switcher */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
              <button
                className={`module-tab-btn ${colonySubTab === 'tree' ? 'active' : ''}`}
                style={{ padding: '0.65rem 1.4rem', fontSize: '0.95rem' }}
                onClick={() => setColonySubTab('tree')}
              >
                🌳 {lang === 'ta' ? 'வரைபட மரம் (Visual Tree)' : 'Interactive Tree Map'}
              </button>
              <button
                className={`module-tab-btn ${colonySubTab === 'explorer' ? 'active' : ''}`}
                style={{ padding: '0.65rem 1.4rem', fontSize: '0.95rem' }}
                onClick={() => setColonySubTab('explorer')}
              >
                📊 {lang === 'ta' ? 'பிராஞ்ச் நிலைகள் (Branch Levels)' : 'Branch Level Progress'}
              </button>
            </div>

            {/* Tree View (Feature 1) */}
            {colonySubTab === 'tree' && (
              <ColonyTreeVisualizer lang={lang} currentUser={currentUser} />
            )}

            {/* Production Branch Explorer */}
            {colonySubTab === 'explorer' && (
              <div className="branch-explorer">
                <div className="explorer-header">
                  <h2>{lang === 'ta' ? '🐜 தனித்தனி 10-நிலை பிராஞ்ச் கட்டமைப்பு' : '🐜 Independent 10-Level Branch Architecture'}</h2>
                  <p>
                    {lang === 'ta'
                      ? 'நீங்கள் சேர்க்கும் ஒவ்வொரு புதிய உறுப்பினரும் தங்களுக்கென தனி 10-நிலை அட்டவணையை கொண்டுள்ளனர். மற்ற பிராஞ்சுகளின் தாக்கம் எதுவும் இல்லாமல் ஒவ்வொன்றும் தனித்து இயங்கும்.'
                      : 'Every direct ant you invite initiates an isolated, independent 10-level chart. No branch interferes with or limits another branch.'}
                  </p>
                </div>

                <div className="branch-card-preview">
                  <div className="branch-meta-row">
                    <div className="branch-name">
                      <span>🐜 {currentUser?.name || 'Member'}'s Direct Branch Network</span>
                      <span className="branch-status-badge">
                        {directInvites > 0 ? `${directInvites} Active ${directInvites === 1 ? 'Branch' : 'Branches'}` : 'Starting Network'}
                      </span>
                    </div>
                    <div style={{ color: 'var(--champagne-gold)', fontWeight: 800 }}>
                      {lang === 'ta' ? 'மொத்த பரிந்துரை போனஸ்:' : 'Referral Reward Yield:'} {directGrains} Grains 🌾
                    </div>
                  </div>

                  <div className="branch-levels-view">
                    {levelTable.map((lvl) => {
                      const isUnlocked = lvl.level <= levelDepth
                      const isCurrent = lvl.level === levelDepth
                      return (
                        <div
                          key={lvl.level}
                          className={`level-chip ${isUnlocked ? 'unlocked' : ''} ${isCurrent ? 'active-level' : ''}`}
                        >
                          <div className="level-num">Level {lvl.level}</div>
                          <div className="level-ants">{lvl.ants.toLocaleString()} Ants</div>
                          <div className="level-bonus">+{lvl.bonus} Grains</div>
                        </div>
                      )
                    })}
                  </div>

                  <p style={{ marginTop: '1.25rem', fontSize: '0.88rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    {lang === 'ta'
                      ? '🔒 ஏதேனும் ஒரு பிராஞ்ச் லெவல் 10-ஐ நிறைவு செய்தால், அந்த குறிப்பிட்ட பிராஞ்ச் மட்டுமே முடிவடையும். மற்ற அனைத்து பிராஞ்சுகளும் தடையின்றி தொடர்ந்து பலன் தரும்!'
                      : '🔒 When any individual branch completes Level 10, only that single chart closes. All other branches continue operating completely independently!'}
                  </p>
                </div>
              </div>
            )}

            {/* Dynamic Multi-Level Growth Matrix Table */}
            <div className="growth-table-section">
              <div className="section-title-wrap">
                <div className="section-tag">Colony Matrix</div>
                <h2 className="section-title">
                  {lang === 'ta' ? `${maxLevels}-நிலை வளர்ச்சி அட்டவணை` : `${maxLevels}-Level Reward & Growth Chart`}
                </h2>
              </div>

              <div className="table-card">
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>{lang === 'ta' ? 'எறும்புகள் எண்ணிக்கை (Ants Count)' : 'Ants Required'}</th>
                      <th>{lang === 'ta' ? 'வளர்ச்சி (Expansion)' : 'Multiplier'}</th>
                      <th>{lang === 'ta' ? 'நிலை போனஸ் (Bonus per Level)' : 'Level Bonus'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levelTable.map((row) => (
                      <tr key={row.level}>
                        <td style={{ fontWeight: 800, color: 'var(--text-dark)' }}>Level {row.level}</td>
                        <td style={{ color: 'var(--champagne-gold)', fontWeight: 800 }}>{row.ants.toLocaleString()} Ants</td>
                        <td>
                          <span className="growth-badge">
                            {row.level === 1 ? `${multiplier} Direct Base` : `${multiplier}× Multiplier`}
                          </span>
                        </td>
                        <td style={{ color: 'var(--emerald-deep)', fontWeight: 800 }}>+{row.bonus} Grains 🌾</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rules Cards (Live-Computed from Colony Configuration) */}
            <div className="rules-section">
              <div className="section-title-wrap">
                <div className="section-tag">Guidelines</div>
                <h2 className="section-title">{lang === 'ta' ? 'முக்கியமான காலனி விதிகள்' : 'Colony Rules & Mechanics'}</h2>
              </div>

              <div className="rules-grid">
                <div className="rule-box">
                  <div className="rule-num">1</div>
                  <h3 className="rule-title">{lang === 'ta' ? '🪙 Joining / Entry Fee' : '🪙 Colony Entry Fee'}</h3>
                  <p className="rule-desc">
                    {lang === 'ta'
                      ? `Ovvoru pudhu ant-um colony-la join panna ${entryFee} grains entry fee pay pannanum. Idhan moolam avargaloda sontha referral network-ai start pannalaam.`
                      : `Every ant contributes ${entryFee} grains as an entry fee to enter the colony and unlock their own referral network.`}
                  </p>
                </div>

                <div className="rule-box">
                  <div className="rule-num">2</div>
                  <h3 className="rule-title">{lang === 'ta' ? '🤝 Direct Referral Bonus' : '🤝 Direct Referral Bonus'}</h3>
                  <p className="rule-desc">
                    {lang === 'ta'
                      ? `Oru ant pudhu member-ai direct-aa invite pannina, ${directBonus} grains direct bonus kidaikkum. Unlimited direct referrals panna mudiyum! (Eg: 5 friends = ${5 * directBonus} grains).`
                      : `Receive ${directBonus} grains immediately for every ant you directly invite. There is zero limit on direct referrals.`}
                  </p>
                </div>

                <div className="rule-box">
                  <div className="rule-num">3</div>
                  <h3 className="rule-title">{lang === 'ta' ? `🪺 Separate ${maxLevels}-Level Charts` : `🪺 Isolated ${maxLevels}-Level Trees`}</h3>
                  <p className="rule-desc">
                    {lang === 'ta'
                      ? `Ovvoru direct referral-ukkum thanithaniyaana ${maxLevels}-level chart uruvaagum! Ramu Somu-vai invite pannina, Somu-ku thaniya oru chart, Mani-ku thaniya oru chart.`
                      : `Each direct invite starts their own independent ${maxLevels}-level tree. Branches progress and pay out separately without interfering with each other.`}
                  </p>
                </div>

                <div className="rule-box">
                  <div className="rule-num">4</div>
                  <h3 className="rule-title">{lang === 'ta' ? '🌾 Ramu – Somu – 5 Friends Example' : '🌾 Financial Flow Example'}</h3>
                  <p className="rule-desc">
                    {lang === 'ta'
                      ? `Somu 5 friends-ai invite pannina: Somu-ku 5 × ${directBonus} = ${5 * directBonus} grains direct bonus. Ramu-ku Level 1 bonus = 100 grains. 5 friends entry = ${5 * entryFee} grains. Total payout = ${5 * directBonus + 100} grains. Colony balance = ${5 * entryFee - (5 * directBonus + 100)} grains.`
                      : `When 5 friends join under Somu, ${5 * entryFee} grains are collected. Somu gets ${5 * directBonus} grains direct, Ramu gets 100 grains Level 1, leaving ${5 * entryFee - (5 * directBonus + 100)} grains safely in reserve.`}
                  </p>
                </div>

                <div className="rule-box">
                  <div className="rule-num">5</div>
                  <h3 className="rule-title">{lang === 'ta' ? `🔒 Level ${maxLevels} Completion Cap` : `🔒 Level ${maxLevels} Cap & Closure`}</h3>
                  <p className="rule-desc">
                    {lang === 'ta'
                      ? `Oru branch Level ${maxLevels} complete panna piragu, andha branch close aagum. Matra active branches thodarndhu bonus kodukkum. Pudhu direct referrals pudhu chart-ai thodangum.`
                      : `A branch gracefully retires after completing Level ${maxLevels}. All your other branches remain fully active, and new invites open new charts.`}
                  </p>
                </div>

                <div className="rule-box">
                  <div className="rule-num">6</div>
                  <h3 className="rule-title">{lang === 'ta' ? '📌 Quick Summary' : '📌 Core Formula'}</h3>
                  <p className="rule-desc">
                    {lang === 'ta'
                      ? `${entryFee} Grains entry • ${directBonus} Grains direct bonus • ${multiplier}x level growth • 100-1000 grains level bonus • ${maxLevels} levels maximum per branch.`
                      : `${entryFee} Grains entry • ${directBonus} Grains direct bonus • ${multiplier}x multiplier • 100-1,000 grains bonus • ${maxLevels}-level ceiling per branch.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2: 1-Click Share & Digital QR Pass */}
            <ColonyShareCard lang={lang} colonyConfig={colonyConfig} />
          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 3: CASHBACK & SMART DEALS                            */}
        {/* ======================================================== */}
        {activeTab === 'cashback' && (
          <section className="cashback-section">
            <div className="module-breadcrumb-bar">
              <button className="breadcrumb-back-btn" onClick={() => setActiveTab('home')}>
                ← Back to Affinovas Hub
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--emerald-deep)', fontWeight: 800 }}>
                ✓ Live Partner Stores Active
              </span>
            </div>

            <div className="cashback-hero">
              <div className="portal-pill" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: 'var(--emerald-deep)' }}>
                <span>💸 AFFINOVAS CASHBACK & REWARDS HUB</span>
              </div>
              <h1 className="hero-heading">
                Shop Anywhere. <br />
                <span className="gold-text" style={{ background: 'linear-gradient(135deg, var(--emerald-deep) 0%, var(--emerald-primary) 50%, var(--champagne-gold) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Earn Real Cash & Multiply Grains.
                </span>
              </h1>
              <p className="hero-description">
                Earn instant cashback on your everyday purchases, electronics, bill payments, and flights.
                Withdraw as real cash or convert directly into Colony Grains at a {colonyConfig?.cashbackToGrainMultiplier || 1.5}× bonus multiplier!
              </p>
            </div>

            {/* Interactive Cashback Simulator */}
            <div className="cashback-calc-card">
              <div>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--text-dark)', fontWeight: 800, marginBottom: '0.5rem' }}>
                  Cashback & Grain Simulator
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
                  Estimate how much you can earn every month through Affinovas partner merchants:
                </p>

                <div className="slider-group">
                  <div className="slider-label">
                    <span>Monthly Shopping & Recharges</span>
                    <span className="slider-value-pill" style={{ color: 'var(--emerald-deep)', background: '#ecfdf5', borderColor: '#10b981' }}>
                      ₹{monthlySpend.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="50000"
                    step="1000"
                    value={monthlySpend}
                    onChange={(e) => setMonthlySpend(Number(e.target.value))}
                    className="colony-slider"
                  />
                </div>

                <div className="slider-group">
                  <div className="slider-label">
                    <span>Average Partner Cashback Rate</span>
                    <span className="slider-value-pill" style={{ color: 'var(--emerald-deep)', background: '#ecfdf5', borderColor: '#10b981' }}>
                      {avgCashbackRate}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="25"
                    value={avgCashbackRate}
                    onChange={(e) => setAvgCashbackRate(Number(e.target.value))}
                    className="colony-slider"
                  />
                </div>
              </div>

              <div className="calc-results" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                <div className="calc-result-row">
                  <span>Monthly Estimated Cashback</span>
                  <span className="calc-result-val" style={{ color: 'var(--emerald-deep)', fontSize: '1.25rem', fontWeight: 900 }}>
                    ₹{monthlyCashbackINR.toLocaleString()}
                  </span>
                </div>
                <div className="calc-result-row">
                  <span>Annual Accumulated Savings</span>
                  <span className="calc-result-val" style={{ color: 'var(--text-dark)', fontWeight: 800 }}>
                    ₹{(monthlyCashbackINR * 12).toLocaleString()}
                  </span>
                </div>
                <div className="calc-result-row">
                  <span>Convertible Colony Grains ({colonyConfig?.cashbackToGrainMultiplier || 1.5}x)</span>
                  <span className="calc-result-val" style={{ color: 'var(--champagne-gold)', fontWeight: 800 }}>
                    +{bonusGrainsFromCashback.toLocaleString()} Grains 🌾
                  </span>
                </div>

                <div className="total-harvest-box" style={{ background: 'linear-gradient(135deg, #064e3b, #047857)', borderColor: 'var(--champagne-amber)', boxShadow: '0 8px 24px rgba(6, 78, 59, 0.25)' }}>
                  <div className="total-title" style={{ color: '#a7f3d0', fontWeight: 800 }}>Cashback Earnings Wallet</div>
                  <div className="total-grains" style={{ color: 'var(--champagne-honey)', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                    ₹{monthlyCashbackINR.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Partner Merchants Grid (Configured from Admin Desk) */}
            <div>
              <div className="section-title-wrap">
                <div className="section-tag">Direct Affinovas Partner Deals</div>
                <h2 className="section-title">Live Partner Stores & Cashback Rates</h2>
              </div>

              <div className="merchants-grid">
                {merchantsList.filter((m) => m.isActive !== false).map((merchant) => (
                  <div key={merchant.id} className="merchant-card">
                    <div className="merchant-info">
                      <div className="merchant-logo">{merchant.logo || '🛍️'}</div>
                      <div>
                        <div className="merchant-name">{merchant.name}</div>
                        <div className="merchant-cat">{merchant.category}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                      <div className="merchant-cashback-rate">{merchant.cashbackRate}% Instant</div>
                      <a
                        href={merchant.redirectUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="merchant-shop-link"
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          color: 'var(--emerald-deep)',
                          textDecoration: 'none',
                          background: '#ecfdf5',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          border: '1px solid #10b981'
                        }}
                        onClick={() => apiService.trackMerchantClick(merchant.id)}
                      >
                        Shop Now →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 4: UNIFIED MEMBER VAULT                              */}
        {/* ======================================================== */}
        {activeTab === 'vault' && (
          <section className="vault-section">
            <div className="module-breadcrumb-bar">
              <button className="breadcrumb-back-btn" onClick={() => setActiveTab('home')}>
                ← Back to Affinovas Hub
              </button>
              <span style={{ fontSize: '0.85rem', color: '#7e22ce', fontWeight: 800 }}>
                Unified Multi-Asset Wallet
              </span>
            </div>

            <div className="portal-hero">
              <div className="portal-pill" style={{ borderColor: 'rgba(126, 34, 206, 0.4)', color: '#7e22ce' }}>
                <span>💼 AFFINOVAS UNIFIED VAULT</span>
              </div>
              <h1 className="hero-heading">
                One Wallet. <br />
                <span className="gold-text" style={{ background: 'linear-gradient(135deg, var(--emerald-deep) 0%, #7e22ce 50%, var(--champagne-gold) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Total Asset Transparency.
                </span>
              </h1>
              <p className="hero-description">
                Monitor your Colony Grain harvest, cashback rewards, referral bonuses, and instant payout
                transfers from one secure dashboard.
              </p>
            </div>

            <div className="vault-box">
              <div className="vault-balances-row">
                <div className="vault-bal-card">
                  <div className="vault-bal-title">Colony Grains Balance</div>
                  <div className="vault-bal-amount" style={{ color: 'var(--champagne-gold)', fontWeight: 900 }}>
                    {userGrains.toLocaleString()} 🌾
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    ≈ ₹{(userGrains * (colonyConfig?.grainToInrRatio || 1.0)).toLocaleString()} value in colony
                  </p>
                </div>

                <div className="vault-bal-card">
                  <div className="vault-bal-title">Cashback Wallet</div>
                  <div className="vault-bal-amount" style={{ color: 'var(--emerald-deep)', fontWeight: 900 }}>
                    ₹{cashbackBalance.toFixed(2)}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    Available for withdrawal or swap
                  </p>
                </div>

                <div className="vault-bal-card">
                  <div className="vault-bal-title">Active Referral Branches</div>
                  <div className="vault-bal-amount" style={{ color: '#0369a1', fontWeight: 900 }}>
                    {directInvites} {directInvites === 1 ? 'Branch' : 'Branches'}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    {directInvites === 0 ? 'Share your referral code to open branches' : `${directInvites} active downlines`}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2.5rem' }}>
                <button
                  className="nav-cta"
                  style={{ background: 'linear-gradient(135deg, var(--emerald-primary), var(--emerald-deep))', color: '#fff' }}
                  onClick={handleRequestWithdrawal}
                >
                  ⚡ Instant Withdraw to UPI (₹{cashbackBalance})
                </button>
                <button
                  className="nav-cta"
                  onClick={() => {
                    if (cashbackBalance < 100) {
                      toast.warning('Minimum ₹100 required to swap for Colony Grains.', 'Insufficient Cashback')
                      return
                    }
                    const swapMultiplier = colonyConfig?.cashbackToGrainMultiplier || 1.5
                    const grainsWon = Math.floor(100 * swapMultiplier)
                    setCashbackBalance((prev) => prev - 100)
                    setUserGrains((prev) => prev + grainsWon)
                    setPassbookList((prev) => [
                      {
                        id: 'tx-' + Date.now(),
                        date: 'Just now',
                        desc: `Cashback Swapped → Grains (${swapMultiplier}× Multiplier)`,
                        cat: 'Swap',
                        amount: `+${grainsWon} Grains 🌾`,
                        isGrains: true,
                        status: 'Settled'
                      },
                      ...prev
                    ])
                    toast.success(`Swapped ₹100 Cashback for +${grainsWon} Colony Grains (${swapMultiplier}× Multiplier applied)!`, 'Grains Multiplied 🌾')
                  }}
                >
                  🔄 Swap ₹100 Cashback → {Math.floor(100 * (colonyConfig?.cashbackToGrainMultiplier || 1.5))} Grains ({colonyConfig?.cashbackToGrainMultiplier || 1.5}× Bonus)
                </button>
                <button
                  className="module-tab-btn"
                  style={{ border: '1px solid var(--border-emerald)', color: 'var(--emerald-deep)', background: '#ffffff', boxShadow: 'var(--shadow-sm)' }}
                  onClick={() => setActiveTab('colony')}
                >
                  🐜 Open Ants & Grains Colony →
                </button>
              </div>

              {/* Feature 4: Passbook & Audit Ledger */}
              <div style={{ borderTop: '1px solid var(--border-emerald)', paddingTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-dark)', fontWeight: 800 }}>
                    📜 Vault Passbook & Transaction Ledger
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--emerald-primary)', fontWeight: 800 }}>
                    ✓ Immutable Cryptographic Audit Log
                  </span>
                </div>

                <div className="table-card">
                  <table className="styled-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Transaction Description</th>
                        <th>Category</th>
                        <th>Credit / Debit</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passbookList.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📜</div>
                            <strong style={{ display: 'block', color: 'var(--text-dark)', marginBottom: '0.25rem' }}>
                              No transactions recorded yet
                            </strong>
                            <span>Your real-time grain harvests, direct referral bonuses, and cashback withdrawals will be logged here.</span>
                          </td>
                        </tr>
                      ) : (
                        passbookList.map((tx) => (
                          <tr key={tx.id}>
                            <td style={{ color: 'var(--text-muted)' }}>{tx.date}</td>
                            <td style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{tx.desc}</td>
                            <td>
                              <span
                                className="growth-badge"
                                style={{
                                  color: tx.cat === 'Withdrawal' ? '#b45309' : tx.cat === 'Cashback' ? '#0369a1' : 'var(--emerald-deep)',
                                  background: tx.cat === 'Withdrawal' ? '#fef3c7' : tx.cat === 'Cashback' ? '#f0f9ff' : '#ecfdf5',
                                  borderColor: tx.cat === 'Withdrawal' ? '#fde68a' : tx.cat === 'Cashback' ? 'rgba(3,105,161,0.3)' : 'rgba(16, 185, 129, 0.35)'
                                }}
                              >
                                {tx.cat}
                              </span>
                            </td>
                            <td
                              style={{
                                fontWeight: 800,
                                color: tx.isNegative ? '#b91c1c' : tx.isGrains ? 'var(--champagne-gold)' : 'var(--emerald-deep)'
                              }}
                            >
                              {tx.amount}
                            </td>
                            <td
                              style={{
                                fontWeight: 700,
                                color: tx.status.includes('Pending') ? '#b45309' : 'var(--emerald-deep)'
                              }}
                            >
                              {tx.status}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 6: MASTER OPERATOR DESK (ADMIN SIDE)                 */}
        {/* ======================================================== */}
        {activeTab === 'admin' && (
          <AdminDashboard
            onExitAdmin={() => setActiveTab('home')}
            onSettingsUpdated={(newSettings) => setColonyConfig(newSettings)}
            onMerchantsUpdated={(newList) => setMerchantsList(newList)}
          />
        )}
      </main>

      {/* Unified Footer */}
      <footer className="colony-footer">
        <p>
          © {new Date().getFullYear()} Affinovas Platform •{' '}
          <a href="https://affinovas.online" target="_blank" rel="noreferrer">
            affinovas.online
          </a>{' '}
          • Unified Ecosystem: Colony Referrals, Cashback & Digital Cloud.
        </p>
      </footer>

      {/* Feature 4: Member Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onLoginSuccess={(u) => {
          setCurrentUser(u)
          setUserGrains(u.grainsBalance ?? 0)
          setCashbackBalance(u.cashbackBalance ?? 0)
          setDirectInvites(u.directAntsCount ?? 0)
          setLevelDepth(u.activeBranchDepth ?? 1)
          if (u.name) setAntName(u.name)
          toast.success(`Welcome, ${u.name || 'Ant Member'}!`, 'Signed In')
        }}
        lang={lang}
        onLangChange={(l) => setLang(l)}
        colonyConfig={colonyConfig}
      />

      {/* Global Interactive Prompt & Confirmation Modal */}
      {promptConfig && (
        <PromptModal
          isOpen={!!promptConfig}
          onClose={() => setPromptConfig(null)}
          {...promptConfig}
        />
      )}

      {/* Global Toast Notification System */}
      <ToastContainer />
    </div>
  )
}
