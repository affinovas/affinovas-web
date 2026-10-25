import { useState, useMemo } from 'react'
import './ColonyTreeVisualizer.css'

export default function ColonyTreeVisualizer({ lang = 'ta', currentUser }) {
  const userName = currentUser?.name || 'Your Account'
  const userGrains = currentUser?.grainsBalance ?? 0
  const userDownline = currentUser?.directAntsCount ?? 0
  const refCode = currentUser?.referralCode || 'AFF-MEMBER'

  // Construct production tree dynamically from current authentic user session
  const treeData = useMemo(() => {
    return {
      id: 'ant-root',
      name: userName,
      role: currentUser?.role === 'admin' ? 'Colony Administrator' : 'Colony Founder',
      totalDownline: userDownline,
      grainsEarned: userGrains,
      referralCode: refCode,
      joinDate: currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Active Member',
      branches: [] // Real downlines dynamically attached here
    }
  }, [currentUser, userName, userGrains, userDownline, refCode])

  const [expandedBranch, setExpandedBranch] = useState(null)
  const [selectedNode, setSelectedNode] = useState({
    id: 'ant-root',
    name: userName,
    role: currentUser?.role === 'admin' ? 'Colony Administrator' : 'Colony Founder',
    level: 1,
    totalDownline: userDownline,
    grainsEarned: userGrains,
    status: 'Active',
    joinDate: currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Active Member',
    branchesCount: userDownline
  })

  const handleSelectRoot = () => {
    setSelectedNode({
      id: 'ant-root',
      name: treeData.name,
      role: treeData.role,
      level: 1,
      totalDownline: treeData.totalDownline,
      grainsEarned: treeData.grainsEarned,
      status: 'Active',
      joinDate: treeData.joinDate,
      branchesCount: treeData.branches.length
    })
  }

  const handleSelectBranch = (branch) => {
    setExpandedBranch(branch.id)
    setSelectedNode({
      id: branch.id,
      name: branch.name,
      role: branch.role,
      level: branch.level,
      totalDownline: branch.antsCount,
      grainsEarned: branch.grainsContributed,
      status: branch.status,
      joinDate: branch.joinDate,
      isBranch: true
    })
  }

  const currentBranchObj = treeData.branches.find((b) => b.id === expandedBranch)

  return (
    <div className="tree-visualizer-container">
      <div className="tree-header-row">
        <div>
          <h2 className="tree-title">
            {lang === 'ta' ? '🌳 காலனி மர வரைபடம் (Interactive Colony Tree)' : '🌳 Interactive Colony Hierarchy Tree'}
          </h2>
          <p className="tree-subtitle">
            {lang === 'ta'
              ? 'நோடுகளை கிளிக் செய்து உங்க நேரடி பிராஞ்சுகள் மற்றும் கீழ்மட்ட எறும்புகளின் விபரங்களை நேரலையாக பார்க்கவும்.'
              : 'Click any ant node to expand their sub-colony and inspect their level progression in real-time.'}
          </p>
        </div>

        <div className="tree-stats-badge">
          <span>🌾 Active Branches: <strong>{treeData.branches.length}</strong></span>
          <span>👥 Downlines: <strong>{treeData.totalDownline}</strong></span>
        </div>
      </div>

      <div className="tree-layout-grid">
        {/* Left: Interactive Graphical Tree */}
        <div className="tree-canvas-panel">
          {/* Level 0: Founder (You) */}
          <div className="tree-level-row">
            <div
              className={`tree-node root-node ${selectedNode?.id === 'ant-root' ? 'selected' : ''}`}
              onClick={handleSelectRoot}
            >
              <div className="node-crown">👑</div>
              <div className="node-avatar">🐜</div>
              <div className="node-info">
                <span className="node-name">{treeData.name}</span>
                <span className="node-tag">{treeData.role}</span>
              </div>
              <div className="node-pill">{treeData.branches.length} Direct Branches</div>
            </div>
          </div>

          {/* SVG Connector Stem */}
          <div className="tree-connector-stem">
            <div className="stem-line"></div>
            <div className="stem-glow-dot"></div>
          </div>

          {/* Level 1: Direct Referral Branches */}
          {treeData.branches.length > 0 ? (
            <div className="tree-level-row branches-row">
              {treeData.branches.map((b) => (
                <div
                  key={b.id}
                  className={`tree-node branch-node ${expandedBranch === b.id ? 'expanded' : ''} ${selectedNode?.id === b.id ? 'selected' : ''}`}
                  onClick={() => handleSelectBranch(b)}
                >
                  <div className="node-badge-level">Lvl {b.level}</div>
                  <div className="node-avatar">{b.avatar}</div>
                  <div className="node-info">
                    <span className="node-name">{b.name}</span>
                    <span className="node-tag">{b.role}</span>
                  </div>
                  <div className="node-stat-pill">
                    {b.antsCount} Ants • +{b.grainsContributed} 🌾
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '18px',
                border: '1px dashed rgba(255, 255, 255, 0.2)',
                margin: '1.25rem auto 0',
                maxWidth: '480px'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.65rem' }}>🌱</div>
              <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.4rem', fontWeight: 700 }}>
                {lang === 'ta' ? 'கிளை நெட்வொர்க் தொடக்கப் புள்ளி' : 'Colony Tree Starting Node'}
              </h4>
              <p style={{ color: 'rgba(255, 255, 255, 0.72)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                {lang === 'ta'
                  ? `உங்களின் குறிப்புக் குறியீடு (${refCode}) வழியே புதிய உறுப்பினர்களை அழைக்கவும். உறுப்பினர்கள் சேரும்போது உங்கள் மரத்தில் நேரடி கிளைகளாகத் தோன்றுவர்!`
                  : `Your colony tree starts with you! When ants register with your invite pass (${refCode}), their live branch nodes will dynamically connect here.`}
              </p>
            </div>
          )}

          {/* Level 2 Sub-Downline View for Currently Expanded Branch */}
          {currentBranchObj && currentBranchObj.downlineLevel1?.length > 0 && (
            <div className="sub-tree-wrapper">
              <div className="sub-tree-indicator">
                <span>↳ {currentBranchObj.name}'s Level 1 Sub-Mound</span>
                <span className="sub-tree-badge">5× Multiplier Active</span>
              </div>

              <div className="tree-level-row sub-nodes-row">
                {currentBranchObj.downlineLevel1.map((sub) => (
                  <div key={sub.id} className="tree-node sub-node">
                    <div className="node-avatar-sm">🐜</div>
                    <div className="node-name-sm">{sub.name}</div>
                    <div className="node-ants-sm">{sub.antsCount} ants</div>
                    <div className="node-grains-sm">+{sub.grains} 🌾</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Ant Inspector Panel */}
        <div className="node-inspector-panel">
          <div className="inspector-header">
            <span className="inspector-tag">Ant Inspector</span>
            <span className="inspector-status-pill">{selectedNode?.status || 'Active'}</span>
          </div>

          <div className="inspector-profile">
            <div className="inspector-avatar">🐜</div>
            <div>
              <h3 className="inspector-name">{selectedNode?.name}</h3>
              <p className="inspector-role">{selectedNode?.role}</p>
            </div>
          </div>

          <div className="inspector-metrics-grid">
            <div className="inspector-metric-card">
              <div className="metric-title">{lang === 'ta' ? 'தானியங்கள் (Grains)' : 'Grains Harvested'}</div>
              <div className="metric-val">{selectedNode?.grainsEarned?.toLocaleString()} 🌾</div>
            </div>

            <div className="inspector-metric-card">
              <div className="metric-title">{lang === 'ta' ? 'கீழ்நிலை எறும்புகள்' : 'Downline Ants'}</div>
              <div className="metric-val">{selectedNode?.totalDownline || 0} Ants</div>
            </div>

            <div className="inspector-metric-card">
              <div className="metric-title">{lang === 'ta' ? 'தற்போதைய நிலை' : 'Active Level'}</div>
              <div className="metric-val">Level {selectedNode?.level ?? 1} / 10</div>
            </div>

            <div className="inspector-metric-card">
              <div className="metric-title">{lang === 'ta' ? 'இணைந்த தேதி' : 'Joined On'}</div>
              <div className="metric-val" style={{ fontSize: '1rem', color: '#fff' }}>
                {selectedNode?.joinDate}
              </div>
            </div>
          </div>

          {/* Level 10 Progress Meter */}
          <div className="branch-progress-meter">
            <div className="meter-header">
              <span>{lang === 'ta' ? 'பிராஞ்ச் நிலை முன்னேற்றம்' : '10-Level Chart Progress'}</span>
              <span>{((selectedNode?.level || 1) / 10) * 100}%</span>
            </div>
            <div className="meter-track">
              <div
                className="meter-fill"
                style={{ width: `${Math.max(10, ((selectedNode?.level || 1) / 10) * 100)}%` }}
              ></div>
            </div>
            <p className="meter-footnote">
              {lang === 'ta'
                ? '🔒 Level 10 அடையும் போது இக்கிளை முழுமை பெற்று நிறைவடையும்.'
                : '🔒 Closes gracefully upon completing Level 10.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
