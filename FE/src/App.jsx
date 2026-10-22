import { useState } from 'react'
import './App.css'

export default function App() {
  const [lang, setLang] = useState('ta') // 'en' or 'ta'
  const [directInvites, setDirectInvites] = useState(5)
  const [levelDepth, setLevelDepth] = useState(3)
  const [selectedBranch, setSelectedBranch] = useState('somu')
  const [antName, setAntName] = useState('Ant_Ramu')
  const [copied, setCopied] = useState(false)

  // 10-Level Table Data
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

  // Calculator Logic
  const directGrains = directInvites * 20
  const levelBonusPerBranch = levelTable
    .slice(0, levelDepth)
    .reduce((sum, item) => sum + item.bonus, 0)
  const totalLevelGrains = levelBonusPerBranch * directInvites
  const totalHarvestGrains = directGrains + totalLevelGrains

  // Branch demo profiles
  const branches = {
    somu: {
      name: 'Somu',
      status: 'Level 3 Active',
      activeLevel: 3,
      currentAnts: 155, // 5 + 25 + 125
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
    const link = `https://affinovas.online/colony?ref=${encodeURIComponent(antName || 'AntMember')}`
    navigator.clipboard?.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="colony-container">
      {/* Navbar */}
      <header className="colony-nav">
        <div className="brand-colony">
          <div className="ant-avatar">🐜</div>
          <span className="brand-title">
            Ants & Grains
            <span className="brand-tag">affinovas.online</span>
          </span>
        </div>

        <div className="nav-actions">
          {/* Language Toggle */}
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

          <a href="#calculator" className="nav-cta">
            {lang === 'ta' ? 'தானிய கால்குலேட்டர் 🌾' : 'Grain Calculator 🌾'}
          </a>
        </div>
      </header>

      <main className="colony-main">
        {/* Hero Section */}
        <section className="colony-hero">
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
              : 'A decentralized, community-driven ant colony ecosystem. Invite friends with 20 grains direct bonus, and unlock independent 10-level branch charts that multiply by 5× at every stage.'}
          </p>
        </section>

        {/* Quick Metrics Cards */}
        <section className="metrics-row">
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
        </section>

        {/* Interactive Calculator Section */}
        <section id="calculator" className="calculator-box">
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

              <p style={{ fontSize: '0.88rem', color: '#9e9585', lineHeight: 1.5 }}>
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
        </section>

        {/* Visual Branch Explorer Demo */}
        <section className="branch-explorer">
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
              <div style={{ color: '#fbbf24', fontWeight: 700 }}>
                {lang === 'ta' ? 'Earned from this branch:' : 'Harvested:'} {branches[selectedBranch].earned} Grains
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

            <p style={{ marginTop: '1.25rem', fontSize: '0.88rem', color: '#9e9585', textAlign: 'center' }}>
              {lang === 'ta'
                ? '🔒 Somu-oda branch Level 10 complete aanaal andha branch close aagum. Aana Mani-oda branch thodarndhu active-aa irukkum!'
                : '🔒 When Somu’s branch reaches Level 10, only Somu’s chart closes. Mani’s branch continues operating independently!'}
            </p>
          </div>
        </section>

        {/* 10-Level Growth Table */}
        <section className="growth-table-section">
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
                    <td style={{ fontWeight: 800, color: '#fff' }}>Level {row.level}</td>
                    <td style={{ color: '#fbbf24', fontWeight: 700 }}>{row.ants.toLocaleString()} Ants</td>
                    <td>
                      <span className="growth-badge">{row.level === 1 ? '5 Direct Base' : '5× Madangu'}</span>
                    </td>
                    <td style={{ color: '#34d399', fontWeight: 700 }}>+{row.bonus} Grains</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Rules & Transparency Breakdown */}
        <section className="rules-section">
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
        </section>

        {/* Referral Link Generator */}
        <section className="link-generator-card">
          <h2>{lang === 'ta' ? '🌾 உங்கள் நேரடி Referral Link-ஐ உருவாக்குங்கள்' : '🌾 Generate Your Ant Referral Link'}</h2>
          <p>
            {lang === 'ta'
              ? 'Ungal Ant ID / Name-ai enter panni link-ai copy pannunga. Friends-idam share panni 20 grains per direct invite earn pannunga!'
              : 'Enter your Ant handle to generate a custom invite URL. Share with fellow ants to harvest 20 grains per direct referral!'}
          </p>

          <div className="link-input-row">
            <input
              type="text"
              className="ant-id-input"
              value={antName}
              onChange={(e) => setAntName(e.target.value)}
              placeholder="Enter Ant Handle (e.g. Ant_Ramu)"
            />
            <button className="copy-btn" onClick={handleCopyLink}>
              {copied ? 'Copied! 🌾' : 'Copy Invite Link'}
            </button>
          </div>

          {copied && (
            <div className="copy-toast">
              ✓ Link copied to clipboard: https://affinovas.online/colony?ref={encodeURIComponent(antName || 'AntMember')}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="colony-footer">
        <p>
          🐜 Ants & Grains Colony System • Powered by{' '}
          <a href="https://affinovas.online" target="_blank" rel="noreferrer">
            affinovas.online
          </a>{' '}
          • Build your mound, harvest grains.
        </p>
      </footer>
    </div>
  )
}
