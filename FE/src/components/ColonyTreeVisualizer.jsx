import { useState } from 'react'
import './ColonyTreeVisualizer.css'

export default function ColonyTreeVisualizer({ lang = 'ta' }) {
  // Tree state: which branch is expanded and which node is selected for inspection
  const [expandedBranch, setExpandedBranch] = useState('somu') // 'somu' | 'mani' | 'kavi'
  const [selectedNode, setSelectedNode] = useState({
    id: 'ant-root',
    name: 'You (Ramu)',
    role: 'Colony Founder',
    level: 3,
    totalDownline: 160,
    grainsEarned: 1840,
    status: 'Active',
    joinDate: '12 Oct 2026',
    branchesCount: 3,
  })

  // Simulated tree structure
  const treeData = {
    id: 'ant-root',
    name: 'You (Ramu)',
    role: 'Colony Founder',
    totalDownline: 160,
    grainsEarned: 1840,
    branches: [
      {
        id: 'somu',
        name: 'Somu',
        avatar: '🐜',
        role: 'Direct Branch #1',
        level: 3,
        antsCount: 155,
        grainsContributed: 620,
        status: 'Level 3 Active',
        joinDate: '14 Oct 2026',
        downlineLevel1: [
          { id: 's1', name: 'Anand', antsCount: 25, level: 2, grains: 220 },
          { id: 's2', name: 'Balu', antsCount: 25, level: 2, grains: 220 },
          { id: 's3', name: 'Chandru', antsCount: 5, level: 1, grains: 100 },
          { id: 's4', name: 'Dinesh', antsCount: 5, level: 1, grains: 100 },
          { id: 's5', name: 'Ezhil', antsCount: 5, level: 1, grains: 100 },
        ],
      },
      {
        id: 'mani',
        name: 'Mani',
        avatar: '🐜',
        role: 'Direct Branch #2',
        level: 1,
        antsCount: 5,
        grainsContributed: 120,
        status: 'Level 1 Active',
        joinDate: '18 Oct 2026',
        downlineLevel1: [
          { id: 'm1', name: 'Gopal', antsCount: 0, level: 0, grains: 20 },
          { id: 'm2', name: 'Hari', antsCount: 0, level: 0, grains: 20 },
          { id: 'm3', name: 'Inba', antsCount: 0, level: 0, grains: 20 },
          { id: 'm4', name: 'Jagan', antsCount: 0, level: 0, grains: 20 },
          { id: 'm5', name: 'Kumar', antsCount: 0, level: 0, grains: 20 },
        ],
      },
      {
        id: 'kavi',
        name: 'Kavi',
        avatar: '🌱',
        role: 'Direct Branch #3',
        level: 0,
        antsCount: 0,
        grainsContributed: 20,
        status: 'Fresh Branch',
        joinDate: '21 Oct 2026',
        downlineLevel1: [],
      },
    ],
  }

  const handleSelectRoot = () => {
    setSelectedNode({
      id: treeData.id,
      name: treeData.name,
      role: treeData.role,
      level: 3,
      totalDownline: treeData.totalDownline,
      grainsEarned: treeData.grainsEarned,
      status: 'Active',
      joinDate: '12 Oct 2026',
      branchesCount: treeData.branches.length,
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
      isBranch: true,
    })
  }

  const handleSelectSubNode = (subNode, parentName) => {
    setSelectedNode({
      id: subNode.id,
      name: subNode.name,
      role: `Downline under ${parentName}`,
      level: subNode.level,
      totalDownline: subNode.antsCount,
      grainsEarned: subNode.grains,
      status: subNode.level > 0 ? `Level ${subNode.level} Active` : 'Member',
      joinDate: '20 Oct 2026',
      isSubNode: true,
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
          <span>👥 Total Ants: <strong>{treeData.totalDownline}</strong></span>
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
                <span className="node-tag">Founder</span>
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

          {/* Level 2 Sub-Downline View for Currently Expanded Branch */}
          {currentBranchObj && currentBranchObj.downlineLevel1.length > 0 && (
            <div className="sub-tree-wrapper">
              <div className="sub-tree-indicator">
                <span>↳ {currentBranchObj.name}'s Level 1 Sub-Mound (5 Ants)</span>
                <span className="sub-tree-badge">5× Multiplier Active</span>
              </div>

              <div className="tree-level-row sub-nodes-row">
                {currentBranchObj.downlineLevel1.map((sub) => (
                  <div
                    key={sub.id}
                    className={`tree-node sub-node ${selectedNode?.id === sub.id ? 'selected' : ''}`}
                    onClick={() => handleSelectSubNode(sub, currentBranchObj.name)}
                  >
                    <div className="node-avatar-sm">🐜</div>
                    <div className="node-name-sm">{sub.name}</div>
                    <div className="node-ants-sm">{sub.antsCount} ants</div>
                    <div className="node-grains-sm">+{sub.grains} 🌾</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentBranchObj && currentBranchObj.downlineLevel1.length === 0 && (
            <div className="empty-sub-branch">
              <p>🌱 {currentBranchObj.name} is a fresh invite! Once they invite their 5 friends, their Level 1 will appear here.</p>
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
              <div className="metric-val">Level {selectedNode?.level ?? 0} / 10</div>
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
              <span>{((selectedNode?.level || 0) / 10) * 100}%</span>
            </div>
            <div className="meter-track">
              <div
                className="meter-fill"
                style={{ width: `${Math.max(5, ((selectedNode?.level || 0) / 10) * 100)}%` }}
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
