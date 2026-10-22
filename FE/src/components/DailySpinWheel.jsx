import { useState, useEffect } from 'react'
import { toast } from './Toast'
import './DailySpinWheel.css'

export default function DailySpinWheel({ lang = 'ta', onGrainsWon }) {
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [wonPrize, setWonPrize] = useState(null)
  const [hasSpunToday, setHasSpunToday] = useState(false)

  // 8 Wheel segments
  const segments = [
    { label: '5 Grains', value: 5, color: '#f59e0b' },
    { label: '10 Grains', value: 10, color: '#d97706' },
    { label: '20 Grains', value: 20, color: '#b45309' },
    { label: '15 Grains', value: 15, color: '#f59e0b' },
    { label: '🌟 50 Jackpot', value: 50, color: '#10b981' },
    { label: '8 Grains', value: 8, color: '#d97706' },
    { label: '25 Grains', value: 25, color: '#b45309' },
    { label: '12 Grains', value: 12, color: '#f59e0b' },
  ]

  // Ranks
  const ranks = [
    { name: 'Worker Ant', icon: '🪵', req: '1-4 Direct Ants', unlocked: true },
    { name: 'Scout Ant', icon: '🔍', req: '5 Direct Ants (Lvl 1)', unlocked: true },
    { name: 'Soldier Ant', icon: '🛡️', req: '155 Ants (Lvl 3)', unlocked: true, current: true },
    { name: 'Mound Architect', icon: '🏛️', req: '3,905 Ants (Lvl 5)', unlocked: false },
    { name: 'Colony Queen / King', icon: '👑', req: 'Level 8+ Elite', unlocked: false },
  ]

  const handleSpin = () => {
    if (spinning || hasSpunToday) return

    setSpinning(true)
    setWonPrize(null)

    // Random segment index
    const randomIndex = Math.floor(Math.random() * segments.length)
    const segmentDegree = 360 / segments.length
    const targetDegree = 360 * 5 + (360 - randomIndex * segmentDegree - segmentDegree / 2)

    setRotation((prev) => prev + targetDegree)

    setTimeout(() => {
      const prize = segments[randomIndex]
      setWonPrize(prize)
      setSpinning(false)
      setHasSpunToday(true)
      toast.success(`You harvested +${prize.value} Colony Grains from the daily wheel!`, '🌾 Wheel Harvest Won')
      if (onGrainsWon) {
        onGrainsWon(prize.value)
      }
    }, 4000)
  }

  const handleResetForDemo = () => {
    setHasSpunToday(false)
    setWonPrize(null)
  }

  return (
    <div className="spin-wheel-container">
      <div className="spin-wheel-header">
        <div className="spin-icon-badge">🎰</div>
        <div>
          <h2 className="spin-section-title">
            {lang === 'ta' ? '🌾 தினசரி தானிய சுழல் சக்கரம் & அந்தஸ்து' : '🌾 Daily Grain Spin Wheel & Ant Ranks'}
          </h2>
          <p className="spin-section-sub">
            {lang === 'ta'
              ? 'ஒவ்வொரு 24 மணி நேரத்திற்கும் இலவசமாக சுழற்றி 5 முதல் 50 போனஸ் தானியங்களை வெல்லுங்கள்!'
              : 'Spin once every 24 hours to harvest between 5 to 50 free bonus grains for your colony vault!'}
          </p>
        </div>
      </div>

      <div className="spin-main-grid">
        {/* Left: Interactive Wheel */}
        <div className="wheel-col">
          <div className="wheel-stage">
            {/* Pointer Pin at Top */}
            <div className="wheel-pointer">▼</div>

            {/* Rotating Wheel Disk */}
            <div
              className={`wheel-disk ${spinning ? 'is-spinning' : ''}`}
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              {segments.map((seg, idx) => {
                const angle = idx * (360 / segments.length)
                return (
                  <div
                    key={idx}
                    className="wheel-slice"
                    style={{
                      transform: `rotate(${angle}deg)`,
                      background: idx % 2 === 0 ? 'rgba(245, 158, 11, 0.22)' : 'rgba(33, 27, 20, 0.95)',
                    }}
                  >
                    <span className="slice-text">{seg.label}</span>
                  </div>
                )
              })}
            </div>

            {/* Center Spin Hub Button */}
            <button
              className={`wheel-center-hub ${spinning ? 'disabled' : ''}`}
              onClick={handleSpin}
              disabled={spinning || hasSpunToday}
            >
              {spinning ? '🌾' : hasSpunToday ? 'Done' : 'SPIN'}
            </button>
          </div>

          {/* Result Alert / Reset Button */}
          {wonPrize && (
            <div className="spin-won-celebration">
              🎉 {lang === 'ta' ? 'வாழ்த்துக்கள்!' : 'Congratulations!'} You won{' '}
              <strong>+{wonPrize.value} Grains!</strong> 🌾
            </div>
          )}

          {hasSpunToday && (
            <div className="next-spin-timer-box">
              <span>Next free spin unlocks in 23h 58m</span>
              <button className="demo-reset-btn" onClick={handleResetForDemo}>
                ↺ Spin Again (Demo Mode)
              </button>
            </div>
          )}
        </div>

        {/* Right: Ant Ranks & Progression */}
        <div className="ranks-col">
          <div className="ranks-card">
            <div className="ranks-header">
              <span className="ranks-tag">Colony Hierarchy</span>
              <span className="current-rank-chip">Current: 🛡️ Soldier Ant</span>
            </div>

            <p className="ranks-description">
              {lang === 'ta'
                ? 'உங்கள் பிராஞ்சுகள் மற்றும் நேரடி எறும்புகள் அதிகரிக்கும் போது உங்க அந்தஸ்து உயரும்:'
                : 'As your direct invites and branch networks multiply, your colony rank advances:'}
            </p>

            <div className="ranks-timeline">
              {ranks.map((r, i) => (
                <div
                  key={i}
                  className={`rank-tier-item ${r.unlocked ? 'unlocked' : 'locked'} ${r.current ? 'current-tier' : ''}`}
                >
                  <div className="rank-tier-icon">{r.icon}</div>
                  <div className="rank-tier-details">
                    <div className="rank-tier-name">
                      <span>{r.name}</span>
                      {r.current && <span className="active-pill">Active</span>}
                    </div>
                    <div className="rank-tier-req">{r.req}</div>
                  </div>
                  <div className="rank-tier-status">
                    {r.unlocked ? '✓ Unlocked' : '🔒 Locked'}
                  </div>
                </div>
              ))}
            </div>

            <div className="rank-next-milestone">
              <div className="milestone-label">
                <span>Next: Mound Architect (Lvl 5)</span>
                <span>38% Progress</span>
              </div>
              <div className="milestone-bar">
                <div className="milestone-fill" style={{ width: '38%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
