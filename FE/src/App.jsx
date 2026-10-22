import { useState, useEffect } from 'react'
import ColonyTreeVisualizer from './components/ColonyTreeVisualizer'
import ColonyShareCard from './components/ColonyShareCard'
import DailySpinWheel from './components/DailySpinWheel'
import AuthModal from './components/AuthModal'
import AdminDashboard from './components/AdminDashboard'
import PromptModal from './components/PromptModal'
import { ToastContainer, toast } from './components/Toast'
import { apiService } from './services/apiService'
import './App.css'

export default function App() {
  // Navigation: 'home' | 'colony' | 'cashback' | 'services' | 'vault' | 'admin'
  const [activeTab, setActiveTab] = useState('home')
  const [lang, setLang] = useState('ta') // 'ta' or 'en' for colony
  const [promptConfig, setPromptConfig] = useState(null)

  // Auth state & User Session
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login') // 'login' | 'register'
  const [currentUser, setCurrentUser] = useState(() => apiService.getCurrentUser() || {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Ramu AntLeader',
    email: 'ramu@affinovas.com',
    role: 'member',
    referralCode: 'AFF-RAMU',
    grainsBalance: 1840,
    cashbackBalance: 450.0,
    upiId: 'ramu@okhdfcbank'
  })

  // Ants & Grains state
  const [userGrains, setUserGrains] = useState(1840)
  const [cashbackBalance, setCashbackBalance] = useState(450)
  const [colonySubTab, setColonySubTab] = useState('tree') // 'tree' | 'explorer'
  const [directInvites, setDirectInvites] = useState(5)
  const [levelDepth, setLevelDepth] = useState(3)
  const [selectedBranch, setSelectedBranch] = useState('somu')
  const [antName, setAntName] = useState('Ant_Ramu')
  const [copied, setCopied] = useState(false)

  // Passbook Dynamic Transactions State
  const [passbookList, setPassbookList] = useState([
    { id: 'tx-1', date: '22 Oct, 05:40 AM', desc: 'Daily Grain Harvest Spin Prize', cat: 'Spin Wheel', amount: '+50 Grains 🌾', isGrains: true, status: 'Settled' },
    { id: 'tx-2', date: '21 Oct, 08:15 PM', desc: 'Direct Referral Bonus: Mani joined', cat: 'Colony Direct', amount: '+20 Grains 🌾', isGrains: true, status: 'Settled' },
    { id: 'tx-3', date: '20 Oct, 02:30 PM', desc: 'Flipkart Partner Shopping Cashback', cat: 'Cashback', amount: '+₹120.00', isGrains: false, status: 'Confirmed' },
    { id: 'tx-4', date: '18 Oct, 11:20 AM', desc: "Level 1 Bonus: Somu's 5 Ants Completed", cat: 'Branch Bonus', amount: '+100 Grains 🌾', isGrains: true, status: 'Settled' },
    { id: 'tx-5', date: '14 Oct, 09:00 AM', desc: 'Colony Mound Activation Entry Fee', cat: 'Entry Fee', amount: '-123 Grains 🌾', isGrains: true, isNegative: true, status: 'Active' }
  ])

  // Cashback state
  const [monthlySpend, setMonthlySpend] = useState(12000)
  const [avgCashbackRate, setAvgCashbackRate] = useState(8)
  const [convertedGrains, setConvertedGrains] = useState(0)

  // Auto-switch tab if URL contains ?tab= or ?ref=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get('tab')
    const refParam = params.get('ref')
    if (tabParam && ['home', 'colony', 'cashback', 'services', 'vault'].includes(tabParam)) {
      setActiveTab(tabParam)
    } else if (refParam) {
      setActiveTab('colony')
    }
  }, [])

  // 10-Level Table Data for Ants & Grains
  const levelTable = [
    { level: 1, ants: 5, bonus: 100 },
    { level: 2, ants: 25, bonus: 200 },
    { level: 3, ants: 125, bonus: 300 },
    { level: 4, ants: 625, bonus: 400 },
    { level: 5, ants: 3125, bonus: 500 },
    { level: 6, ants: 15625, bonus: 600 },
    { level: 7, ants: 78125, bonus: 700 },
    { level: 8, ants: 390625, bonus: 800 },
    { level: 9, ants: 1953125, bonus: 900 },
    { level: 10, ants: 9765625, bonus: 1000 },
  ]

  // Colony calculations
  const directGrains = directInvites * 20
  const levelBonusPerBranch = levelTable
    .slice(0, levelDepth)
    .reduce((sum, item) => sum + item.bonus, 0)
  const totalLevelGrains = levelBonusPerBranch * directInvites
  const totalHarvestGrains = directGrains + totalLevelGrains

  const branches = {
    somu: {
      name: 'Somu',
      status: 'Level 3 Active',
      activeLevel: 3,
      currentAnts: 155,
      earned: 20 + 100 + 200 + 300,
    },
    mani: {
      name: 'Mani',
      status: 'Level 1 Active',
      activeLevel: 1,
      currentAnts: 5,
      earned: 20 + 100,
    },
    kavi: {
      name: 'Kavi (New Invite)',
      status: 'Level 0 (Fresh Branch)',
      activeLevel: 0,
      currentAnts: 0,
      earned: 20,
    },
  }

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

  return (
    <div className="affinovas-app">
      {/* Multi-Portal Experience Switcher Ribbon */}
      <div className="role-switch-ribbon">
        <div className="role-switch-content">
          <span>🌐 Affinovas Multi-Portal System (Admin Side & User Side):</span>
          <div className="role-switch-buttons">
            <button
              className={`role-pill ${currentUser?.role !== 'admin' && activeTab !== 'admin' ? 'active-member' : ''}`}
              onClick={() => {
                apiService.login('ramu@affinovas.com', 'ramu123').then((d) => {
                  setCurrentUser(d.user)
                  setActiveTab('home')
                })
              }}
            >
              🐜 Member Portal (User Side: Ramu)
            </button>
            <button
              className={`role-pill ${currentUser?.role === 'admin' || activeTab === 'admin' ? 'active-admin' : ''}`}
              onClick={() => {
                apiService.login('admin@affinovas.com', 'admin123').then((d) => {
                  setCurrentUser(d.user)
                  setActiveTab('admin')
                })
              }}
            >
              👑 Operator Deck (Admin Side)
            </button>
          </div>
        </div>
      </div>

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

        {/* Ecosystem Module Switcher */}
        <nav className="module-switcher">
          <button
            className={`module-tab-btn ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            🏠 Hub
          </button>
          <button
            className={`module-tab-btn ${activeTab === 'colony' ? 'active' : ''}`}
            onClick={() => setActiveTab('colony')}
          >
            🐜 Ants & Grains
          </button>
          <button
            className={`module-tab-btn ${activeTab === 'cashback' ? 'active' : ''}`}
            onClick={() => setActiveTab('cashback')}
          >
            💸 Cashback & Deals
          </button>
          <button
            className={`module-tab-btn ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            ⚡ Digital Solutions
          </button>
          <button
            className={`module-tab-btn ${activeTab === 'vault' ? 'active' : ''}`}
            onClick={() => setActiveTab('vault')}
          >
            💼 Vault
          </button>

          {/* Operator Desk Tab */}
          <button
            className={`module-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            style={{
              color: activeTab === 'admin' ? 'var(--emerald-deep)' : '#047857',
              fontWeight: 900,
              border: '1px solid rgba(4, 120, 87, 0.3)',
              background: activeTab === 'admin' ? '#ffffff' : '#f0fdf4'
            }}
            onClick={() => {
              if (currentUser?.role !== 'admin') {
                apiService.login('admin@affinovas.com', 'admin123').then((d) => setCurrentUser(d.user))
              }
              setActiveTab('admin')
            }}
          >
            🛡️ Admin Desk
          </button>
        </nav>

        {/* Quick User / Wallet Indicator & Auth */}
        <div className="nav-right-actions">
          <div className="wallet-quick-badge" onClick={() => setActiveTab('vault')}>
            <span>🌾 {userGrains.toLocaleString()} Grains</span>
            <span style={{ opacity: 0.6 }}>|</span>
            <span style={{ color: 'var(--emerald-primary)', fontWeight: 800 }}>₹{cashbackBalance}</span>
          </div>

          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="wallet-quick-badge" style={{ borderColor: 'var(--champagne-gold)', color: 'var(--text-dark)' }}>
                <span>{currentUser.role === 'admin' ? '👑 Admin' : `🐜 ${currentUser.name}`}</span>
              </div>
              <button
                className="mini-lang-btn"
                style={{ padding: '0.4rem 0.7rem' }}
                onClick={() => {
                  apiService.logout()
                  setCurrentUser(null)
                }}
              >
                Logout
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
                onClick={() => setActiveTab('colony')}
              >
                <div>
                  <div className="pillar-icon-box">🐜</div>
                  <span className="pillar-badge">Colony Network</span>
                  <h3 className="pillar-title">Ants & Grains Colony</h3>
                  <p className="pillar-desc">
                    Our flagship referral ecosystem. Invite fellow ants, gather grains, and build
                    isolated 10-level branch trees multiplying at 5× speed.
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
                onClick={() => setActiveTab('cashback')}
              >
                <div>
                  <div className="pillar-icon-box">💸</div>
                  <span className="pillar-badge" style={{ color: 'var(--emerald-deep)', background: '#ecfdf5', borderColor: '#10b981' }}>
                    Instant Savings
                  </span>
                  <h3 className="pillar-title">Cashback & Smart Deals</h3>
                  <p className="pillar-desc">
                    Earn up to 25% instant cashback on partner shopping, travel, and recharges. Convert
                    cashback directly into colony grains or withdraw.
                  </p>
                </div>
                <div className="pillar-action-row">
                  <span className="pillar-highlight" style={{ color: 'var(--emerald-primary)' }}>Up to 25% Rebate</span>
                  <span className="pillar-btn">Explore Deals →</span>
                </div>
              </div>

              {/* Pillar 3: Digital Solutions */}
              <div
                className="pillar-card"
                style={{ '--card-accent': '#06b6d4' }}
                onClick={() => setActiveTab('services')}
              >
                <div>
                  <div className="pillar-icon-box">⚡</div>
                  <span className="pillar-badge" style={{ color: '#0369a1', background: '#f0f9ff', borderColor: '#38bdf8' }}>
                    Enterprise Tech
                  </span>
                  <h3 className="pillar-title">Digital & Cloud Engineering</h3>
                  <p className="pillar-desc">
                    High-throughput backends built on .NET Clean Architecture, fast-refresh SPA clients,
                    and intelligent automation platforms.
                  </p>
                </div>
                <div className="pillar-action-row">
                  <span className="pillar-highlight" style={{ color: '#0369a1' }}>.NET & Cloud Ready</span>
                  <span className="pillar-btn">View Services →</span>
                </div>
              </div>

              {/* Pillar 4: Unified Vault */}
              <div
                className="pillar-card"
                style={{ '--card-accent': '#8b5cf6' }}
                onClick={() => setActiveTab('vault')}
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

            {/* Ecosystem Stats Strip */}
            <div className="ecosystem-stats-strip">
              <div className="stat-item">
                <h3>18,400+</h3>
                <p>Active Ants in Colony</p>
              </div>
              <div className="stat-item">
                <h3>₹2.4M+</h3>
                <p>Cashback Distributed</p>
              </div>
              <div className="stat-item">
                <h3>5.2M+</h3>
                <p>Grains Harvested</p>
              </div>
              <div className="stat-item">
                <h3>99.98%</h3>
                <p>Platform Uptime</p>
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
                  ? 'Ants & Grains enbadhu oru referral-based colony system. Ovvoru member-um pudhu members-ai invite pannalaam. Direct referral bonus (20 grains) matrum ovvoru direct member-oda keezhayum thani 10-level branch growth!'
                  : 'A community-driven ant colony ecosystem. Invite friends with 20 grains direct bonus, and unlock independent 10-level branch charts that multiply by 5× at every stage.'}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="metrics-row">
              <div className="metric-card">
                <div className="metric-icon">🪙</div>
                <div className="metric-value">123</div>
                <div className="metric-label">{lang === 'ta' ? 'Joining / Entry Fee' : 'Colony Entry Fee'}</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">🤝</div>
                <div className="metric-value">+20</div>
                <div className="metric-label">{lang === 'ta' ? 'Direct Referral Bonus' : 'Direct Referral Bonus'}</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">📈</div>
                <div className="metric-value">5×</div>
                <div className="metric-label">{lang === 'ta' ? 'Level Growth Rate' : 'Level Expansion (5x)'}</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">🪺</div>
                <div className="metric-value">10</div>
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
                      max="10"
                      value={levelDepth}
                      onChange={(e) => setLevelDepth(Number(e.target.value))}
                      className="colony-slider"
                    />
                  </div>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {lang === 'ta'
                      ? '💡 Note: Ovvoru direct referral-ukkum thaniya oru 10-level chart irukkum. Unlimited direct referrals panna mudiyum!'
                      : '💡 Rule: Every direct referral gets their own isolated 10-level chart. Unlimited direct referrals are allowed!'}
                  </p>
                </div>

                <div className="calc-results">
                  <div className="calc-result-row">
                    <span>{lang === 'ta' ? 'Direct Referral Bonus (20 per ant)' : 'Direct Bonus (20 grains / ant)'}</span>
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

            {/* Feature 3: Daily Grain Spin Wheel & Ant Ranks */}
            <DailySpinWheel
              lang={lang}
              onGrainsWon={(won) => setUserGrains((prev) => prev + won)}
            />

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
              <ColonyTreeVisualizer lang={lang} />
            )}

            {/* Visual Branch Explorer Demo */}
            {colonySubTab === 'explorer' && (
              <div className="branch-explorer">
                <div className="explorer-header">
                  <h2>{lang === 'ta' ? '🐜 தனியான பிராஞ்ச் இயக்கம் (Ramu - Somu & Mani Example)' : '🐜 Independent Branch Isolation Explorer'}</h2>
                  <p>
                    {lang === 'ta'
                      ? 'Ramu invite panna Somu matrum Mani-ku thanithani 10-level charts eppadi work aagudhu endru paarunga:'
                      : 'See how Ramu’s direct invites (Somu and Mani) run independent 10-level charts simultaneously:'}
                  </p>
                </div>

                <div className="branch-tabs">
                  <button
                    className={`branch-tab-btn ${selectedBranch === 'somu' ? 'active' : ''}`}
                    onClick={() => setSelectedBranch('somu')}
                  >
                    🌿 Somu’s Branch (Level 3)
                  </button>
                  <button
                    className={`branch-tab-btn ${selectedBranch === 'mani' ? 'active' : ''}`}
                    onClick={() => setSelectedBranch('mani')}
                  >
                    🌿 Mani’s Branch (Level 1)
                  </button>
                  <button
                    className={`branch-tab-btn ${selectedBranch === 'kavi' ? 'active' : ''}`}
                    onClick={() => setSelectedBranch('kavi')}
                  >
                    🌱 Kavi’s Branch (Fresh)
                  </button>
                </div>

                <div className="branch-card-preview">
                  <div className="branch-meta-row">
                    <div className="branch-name">
                      <span>🐜 {branches[selectedBranch].name}</span>
                      <span className="branch-status-badge">{branches[selectedBranch].status}</span>
                    </div>
                    <div style={{ color: 'var(--champagne-gold)', fontWeight: 800 }}>
                      {lang === 'ta' ? 'Earned from this branch:' : 'Harvested:'} {branches[selectedBranch].earned} Grains 🌾
                    </div>
                  </div>

                  <div className="branch-levels-view">
                    {levelTable.map((lvl) => {
                      const isUnlocked = lvl.level <= branches[selectedBranch].activeLevel
                      const isCurrent = lvl.level === branches[selectedBranch].activeLevel
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
                      ? '🔒 Somu-oda branch Level 10 complete aanaal andha branch close aagum. Aana Mani-oda branch thodarndhu active-aa irukkum!'
                      : '🔒 When Somu’s branch reaches Level 10, only Somu’s chart closes. Mani’s branch continues operating independently!'}
                  </p>
                </div>
              </div>
            )}

            {/* 10-Level Table */}
            <div className="growth-table-section">
              <div className="section-title-wrap">
                <div className="section-tag">Colony Matrix</div>
                <h2 className="section-title">{lang === 'ta' ? '10-நிலை வளர்ச்சி அட்டவணை' : '10-Level Reward & Growth Chart'}</h2>
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
                          <span className="growth-badge">{row.level === 1 ? '5 Direct Base' : '5× Madangu'}</span>
                        </td>
                        <td style={{ color: 'var(--emerald-deep)', fontWeight: 800 }}>+{row.bonus} Grains 🌾</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rules Cards */}
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
                      ? 'Ovvoru pudhu ant-um colony-la join panna 123 grains entry fee pay pannanum. Idhan moolam avargaloda sontha referral network-ai start pannalaam.'
                      : 'Every ant contributes 123 grains as an entry fee to enter the colony and unlock their own referral network.'}
                  </p>
                </div>

                <div className="rule-box">
                  <div className="rule-num">2</div>
                  <h3 className="rule-title">{lang === 'ta' ? '🤝 Direct Referral Bonus' : '🤝 Direct Referral Bonus'}</h3>
                  <p className="rule-desc">
                    {lang === 'ta'
                      ? 'Oru ant pudhu member-ai direct-aa invite pannina, 20 grains direct bonus kidaikkum. Unlimited direct referrals panna mudiyum! (Eg: 5 friends = 100 grains).'
                      : 'Receive 20 grains immediately for every ant you directly invite. There is zero limit on direct referrals.'}
                  </p>
                </div>

                <div className="rule-box">
                  <div className="rule-num">3</div>
                  <h3 className="rule-title">{lang === 'ta' ? '🪺 Separate 10-Level Charts' : '🪺 Isolated 10-Level Trees'}</h3>
                  <p className="rule-desc">
                    {lang === 'ta'
                      ? 'Ovvoru direct referral-ukkum thanithaniyaana 10-level chart uruvaagum! Ramu Somu-vai invite pannina, Somu-ku thaniya oru chart, Mani-ku thaniya oru chart.'
                      : 'Each direct invite starts their own independent 10-level tree. Branches progress and pay out separately without interfering with each other.'}
                  </p>
                </div>

                <div className="rule-box">
                  <div className="rule-num">4</div>
                  <h3 className="rule-title">{lang === 'ta' ? '🌾 Ramu – Somu – 5 Friends Example' : '🌾 Financial Flow Example'}</h3>
                  <p className="rule-desc">
                    {lang === 'ta'
                      ? 'Somu 5 friends-ai invite pannina: Somu-ku 5 × 20 = 100 grains direct bonus. Ramu-ku Level 1 bonus = 100 grains. 5 friends entry = 615 grains. Total payout = 200 grains. Colony balance = 415 grains.'
                      : 'When 5 friends join under Somu, 615 grains are collected. Somu gets 100 grains direct, Ramu gets 100 grains Level 1, leaving 415 grains safely in reserve.'}
                  </p>
                </div>

                <div className="rule-box">
                  <div className="rule-num">5</div>
                  <h3 className="rule-title">{lang === 'ta' ? '🔒 Level 10 Completion Cap' : '🔒 Level 10 Cap & Closure'}</h3>
                  <p className="rule-desc">
                    {lang === 'ta'
                      ? 'Oru branch Level 10 complete panna piragu, andha branch close aagum. Matra active branches thodarndhu bonus kodukkum. Pudhu direct referrals pudhu chart-ai thodangum.'
                      : 'A branch gracefully retires after completing Level 10. All your other branches remain fully active, and new invites open new charts.'}
                  </p>
                </div>

                <div className="rule-box">
                  <div className="rule-num">6</div>
                  <h3 className="rule-title">{lang === 'ta' ? '📌 Quick Summary' : '📌 Core Formula'}</h3>
                  <p className="rule-desc">
                    {lang === 'ta'
                      ? '123 Grains entry • 20 Grains direct bonus • 5x level growth • 100-1000 grains level bonus • 10 levels maximum per branch.'
                      : '123 Grains entry • 20 Grains direct bonus • 5x multiplier • 100-1,000 grains bonus • 10-level ceiling per branch.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2: 1-Click Share & Digital QR Pass */}
            <ColonyShareCard lang={lang} />
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
                Withdraw as real cash or convert directly into Colony Grains at a 1.5× bonus multiplier!
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
                  <span>Convertible Colony Grains (1.5x)</span>
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

            {/* Popular Partners Grid */}
            <div>
              <div className="section-title-wrap">
                <div className="section-tag">Featured Merchant Deals</div>
                <h2 className="section-title">Popular Cashback Categories</h2>
              </div>

              <div className="merchants-grid">
                <div className="merchant-card">
                  <div className="merchant-info">
                    <div className="merchant-logo">📱</div>
                    <div>
                      <div className="merchant-name">Electronics & Gadgets</div>
                      <div className="merchant-cat">Laptops, Phones & Accessories</div>
                    </div>
                  </div>
                  <div className="merchant-cashback-rate">Up to 8%</div>
                </div>

                <div className="merchant-card">
                  <div className="merchant-info">
                    <div className="merchant-logo">✈️</div>
                    <div>
                      <div className="merchant-name">Travel & Flight Bookings</div>
                      <div className="merchant-cat">Hotels, Airlines & Holidays</div>
                    </div>
                  </div>
                  <div className="merchant-cashback-rate">Up to 12%</div>
                </div>

                <div className="merchant-card">
                  <div className="merchant-info">
                    <div className="merchant-logo">🛍️</div>
                    <div>
                      <div className="merchant-name">Fashion & Apparel</div>
                      <div className="merchant-cat">Top Brands & Footwear</div>
                    </div>
                  </div>
                  <div className="merchant-cashback-rate">Up to 15%</div>
                </div>

                <div className="merchant-card">
                  <div className="merchant-info">
                    <div className="merchant-logo">⚡</div>
                    <div>
                      <div className="merchant-name">Utility Bills & Recharges</div>
                      <div className="merchant-cat">Electricity, Mobile & Broadband</div>
                    </div>
                  </div>
                  <div className="merchant-cashback-rate">Flat 5%</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 4: DIGITAL & CLOUD SOLUTIONS                         */}
        {/* ======================================================== */}
        {activeTab === 'services' && (
          <section className="services-section">
            <div className="module-breadcrumb-bar">
              <button className="breadcrumb-back-btn" onClick={() => setActiveTab('home')}>
                ← Back to Affinovas Hub
              </button>
              <span style={{ fontSize: '0.85rem', color: '#0369a1', fontWeight: 800 }}>
                Enterprise Grade Solutions
              </span>
            </div>

            <div className="portal-hero">
              <div className="portal-pill" style={{ borderColor: 'rgba(2, 132, 199, 0.4)', color: '#0369a1' }}>
                <span>⚡ AFFINOVAS DIGITAL ENGINEERING</span>
              </div>
              <h1 className="hero-heading">
                Scalable Cloud Architectures. <br />
                <span className="gold-text" style={{ background: 'linear-gradient(135deg, var(--emerald-deep) 0%, #0284c7 50%, var(--champagne-gold) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Built for High Performance.
                </span>
              </h1>
              <p className="hero-description">
                The technical engine powering the entire Affinovas ecosystem. Clean architecture backends,
                ultra-fast distributed frontend applications, and custom digital transformation.
              </p>
            </div>

            <div className="services-grid">
              <div className="service-card">
                <div className="service-icon">🏗️</div>
                <h3 className="service-title">.NET Clean Architecture Backend</h3>
                <p className="service-desc">
                  Separated Domain, Application, Infrastructure, and API layers with high-performance
                  SQL connections, JWT token authorization, and microservice capabilities.
                </p>
              </div>

              <div className="service-card">
                <div className="service-icon">🌐</div>
                <h3 className="service-title">Edge Web Applications</h3>
                <p className="service-desc">
                  Decoupled React and modern Single Page Applications (SPA) distributed across global
                  edge networks with sub-millisecond static asset delivery and instant reload.
                </p>
              </div>

              <div className="service-card">
                <div className="service-icon">🔒</div>
                <h3 className="service-title">Cryptographic Security & Ledgers</h3>
                <p className="service-desc">
                  Tamper-resistant audit trails, granular user role permissions, zero-trust API policies,
                  and automated multi-tier transaction ledgers.
                </p>
              </div>

              <div className="service-card">
                <div className="service-icon">📊</div>
                <h3 className="service-title">Data Analytics & Pipeline Engine</h3>
                <p className="service-desc">
                  Real-time branch calculation algorithms, automatic level progression evaluation,
                  and scalable analytics dashboards for enterprise operators.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 5: UNIFIED MEMBER VAULT                              */}
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
                    1,840 🌾
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    ≈ ₹1,840 value in colony
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
                    3 Branches
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    160 total ants in network
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
                    const grainsWon = Math.floor(100 * 1.5)
                    setCashbackBalance((prev) => prev - 100)
                    setUserGrains((prev) => prev + grainsWon)
                    setPassbookList((prev) => [
                      {
                        id: 'tx-' + Date.now(),
                        date: 'Just now',
                        desc: 'Cashback Swapped → Grains (1.5× Multiplier)',
                        cat: 'Swap',
                        amount: `+${grainsWon} Grains 🌾`,
                        isGrains: true,
                        status: 'Settled'
                      },
                      ...prev
                    ])
                    toast.success(`Swapped ₹100 Cashback for +${grainsWon} Colony Grains (1.5× Multiplier applied)!`, 'Grains Multiplied 🌾')
                  }}
                >
                  🔄 Swap ₹100 Cashback → 150 Grains (1.5× Bonus)
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
                      {passbookList.map((tx) => (
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
                      ))}
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
          <AdminDashboard onExitAdmin={() => setActiveTab('home')} />
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
          setUserGrains(u.grains)
        }}
        lang={lang}
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
