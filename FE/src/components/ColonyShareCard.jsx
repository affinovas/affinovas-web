import { useState } from 'react'
import './ColonyShareCard.css'

export default function ColonyShareCard({ lang = 'ta', colonyConfig }) {
  const [antHandle, setAntHandle] = useState('Ant_Ramu')
  const [shareLang, setShareLang] = useState(lang)
  const [copied, setCopied] = useState(false)

  const entryFee = colonyConfig?.entryFeeGrains ?? 123
  const directBonus = colonyConfig?.directBonusGrains ?? 20
  const maxDepth = colonyConfig?.maxLevelsPerBranch ?? 10

  const referralLink = `https://affinovas.online?tab=colony&ref=${encodeURIComponent(antHandle.trim() || 'AntFounder')}`

  const shareText =
    shareLang === 'ta'
      ? `🐜🌾 வணக்கம்! நான் Affinovas Ants & Grains காலனியில் சேர்ந்து தானியம் சேர்த்து வருகிறேன்.\n\n🪙 Joining: ${entryFee} grains\n🤝 நேரடி போனஸ்: +${directBonus} grains\n🪺 தனி ${maxDepth}-நிலை பிராஞ்ச் வளர்ச்சி!\n\nநீங்களும் என் காலனி பிராஞ்சில் இணைந்து தானியம் அறுவடை செய்ய வாருங்கள்:\n👉 ${referralLink}`
      : `🐜🌾 Hey! I am harvesting grains in the Affinovas Ants & Grains Colony.\n\n🪙 Joining: ${entryFee} grains\n🤝 Direct Bonus: +${directBonus} grains\n🪺 Independent ${maxDepth}-level branch trees!\n\nJoin my branch and let's grow the mound together:\n👉 ${referralLink}`

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(referralLink)}&bgcolor=24-18-12&color=251-191-36&margin=10`

  const handleCopy = () => {
    navigator.clipboard?.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank')
  }

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank')
  }

  return (
    <div className="share-card-container">
      <div className="share-card-header">
        <div className="share-icon-wrap">📲</div>
        <div>
          <h2 className="share-card-title">
            {lang === 'ta' ? '🌾 1-கிளிக் பகிர்வு & QR குறியீடு அட்டை' : '🌾 1-Click Share & Colony Invite Pass'}
          </h2>
          <p className="share-card-sub">
            {lang === 'ta'
              ? 'வாட்ஸ்அப், டெலிகிராம் அல்லது QR குறியீடு மூலம் நண்பர்களை உடனடியாக உங்க பிராஞ்சில் இணையுங்கள்!'
              : 'Share your personal ant referral link directly to WhatsApp, Telegram, or scan the QR pass.'}
          </p>
        </div>
      </div>

      <div className="share-card-grid">
        {/* Left: Input, Link & Social Buttons */}
        <div className="share-form-col">
          <div className="input-field-group">
            <label className="field-label">
              {lang === 'ta' ? 'உங்க Ant ID / பெயர்:' : 'Your Ant Handle / ID:'}
            </label>
            <div className="handle-input-wrap">
              <span className="handle-prefix">🐜</span>
              <input
                type="text"
                className="handle-input"
                value={antHandle}
                onChange={(e) => setAntHandle(e.target.value)}
                placeholder="e.g. Ant_Ramu"
              />
            </div>
          </div>

          <div className="link-preview-box">
            <span className="link-url-text">{referralLink}</span>
            <button className="copy-link-btn" onClick={handleCopy}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          {copied && (
            <div className="copied-alert">
              ✓ {lang === 'ta' ? 'Referral Link நகலெடுக்கப்பட்டது!' : 'Invite link copied to clipboard!'}
            </div>
          )}

          {/* Social Share Buttons */}
          <div className="social-actions-row">
            <button className="social-btn whatsapp-btn" onClick={handleWhatsApp}>
              <span className="social-icon">💬</span>
              <span>WhatsApp Share</span>
            </button>
            <button className="social-btn telegram-btn" onClick={handleTelegram}>
              <span className="social-icon">✈️</span>
              <span>Telegram Share</span>
            </button>
          </div>

          <div className="share-message-preview">
            <div className="msg-preview-header">
              <span>{lang === 'ta' ? 'பகிர்வு செய்தி மாதிரி:' : 'Auto-Formatted Message Preview:'}</span>
              <div className="preview-lang-switch">
                <button
                  className={`mini-lang-btn ${shareLang === 'ta' ? 'active' : ''}`}
                  onClick={() => setShareLang('ta')}
                >
                  தமிழ்
                </button>
                <button
                  className={`mini-lang-btn ${shareLang === 'en' ? 'active' : ''}`}
                  onClick={() => setShareLang('en')}
                >
                  English
                </button>
              </div>
            </div>
            <pre className="msg-text-box">{shareText}</pre>
          </div>
        </div>

        {/* Right: Digital QR Invite Pass */}
        <div className="qr-pass-col">
          <div className="digital-pass-card">
            <div className="pass-top">
              <div className="pass-brand">
                <span>🐜 Ants & Grains</span>
                <span className="pass-pill">Official Pass</span>
              </div>
              <div className="pass-member-id">{antHandle || 'AntMember'}</div>
            </div>

            <div className="pass-qr-frame">
              <img
                src={qrCodeUrl}
                alt="Colony Referral QR Code"
                className="qr-img"
                loading="lazy"
              />
              <span className="qr-scan-label">Scan to Join Branch</span>
            </div>

            <div className="pass-bottom">
              <div className="pass-stat">
                <span className="pass-stat-lbl">Direct Bonus</span>
                <span className="pass-stat-val">+20 Grains</span>
              </div>
              <div className="pass-stat">
                <span className="pass-stat-lbl">Entry Fee</span>
                <span className="pass-stat-val">123 Grains</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
