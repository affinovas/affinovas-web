import React, { useState, useEffect } from 'react'
import { apiService } from '../services/apiService'
import './AdminDashboard.css'

export default function AdminDashboard({ onExitAdmin }) {
  const [activeTab, setActiveTab] = useState('withdrawals')
  const [overview, setOverview] = useState(null)
  const [members, setMembers] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [merchants, setMerchants] = useState([])
  const [settings, setSettings] = useState(null)
  const [searchMember, setSearchMember] = useState('')
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [ovData, memData, withData, merchData, settsData] = await Promise.all([
        apiService.getAdminOverview(),
        apiService.getAdminMembers(),
        apiService.getAdminWithdrawals(),
        apiService.getMerchants(),
        apiService.getColonySettings()
      ])
      setOverview(ovData)
      setMembers(memData)
      setWithdrawals(withData)
      setMerchants(merchData)
      setSettings(settsData)
    } catch (err) {
      console.error('Failed to load admin data', err)
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (msg) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 4000)
  }

  // Handle Payout Approval
  const handleApproveWithdrawal = async (id, amount, upiId) => {
    const defaultUtr = `UTR-${Date.now().toString().slice(-8)}`
    const utr = prompt(`Confirm banking transfer of ₹${amount} to ${upiId}.\nEnter UTR / Ref Number:`, defaultUtr)
    if (!utr) return

    try {
      await apiService.processWithdrawal(id, true, utr, 'Dispatched via Banking UPI Gateway')
      showNotification(`✓ Withdrawal of ₹${amount} marked as PAID with ${utr}!`)
      loadAllData()
    } catch (e) {
      alert(e.message)
    }
  }

  // Handle Payout Rejection
  const handleRejectWithdrawal = async (id, amount) => {
    const reason = prompt(`Enter reason for rejecting ₹${amount} withdrawal:`, 'Invalid UPI account or KYC mismatch')
    if (!reason) return

    try {
      await apiService.processWithdrawal(id, false, null, reason)
      showNotification(`Withdrawal request rejected. Funds returned to member wallet.`)
      loadAllData()
    } catch (e) {
      alert(e.message)
    }
  }

  // Handle Member Status Toggle
  const handleToggleMember = async (userId, currentName) => {
    try {
      const res = await apiService.toggleMemberStatus(userId)
      showNotification(`Ant member "${currentName}" is now ${res.isActive ? 'Active' : 'Suspended'}`)
      loadAllData()
    } catch (e) {
      alert(e.message)
    }
  }

  // Handle Merchant Cashback Update
  const handleUpdateMerchantRate = async (id, name, currentRate) => {
    const newRate = prompt(`Enter new cashback % for ${name}:`, currentRate)
    if (newRate === null || isNaN(newRate)) return

    try {
      await apiService.updateMerchantRate(id, Number(newRate))
      showNotification(`✓ Updated ${name} cashback rate to ${newRate}%!`)
      loadAllData()
    } catch (e) {
      alert(e.message)
    }
  }

  // Handle Colony Settings Save
  const handleSaveSettings = async (e) => {
    e.preventDefault()
    try {
      await apiService.updateColonySettings(settings)
      showNotification('✓ Colony Economics & Rules updated successfully!')
      loadAllData()
    } catch (e) {
      alert(e.message)
    }
  }

  const filteredMembers = members.filter((m) =>
    m.name?.toLowerCase().includes(searchMember.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchMember.toLowerCase()) ||
    m.referralCode?.toLowerCase().includes(searchMember.toLowerCase())
  )

  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'Pending').length

  return (
    <section className="admin-desk-container">
      {/* Admin Header */}
      <div className="admin-desk-header">
        <div className="admin-badge-strip">
          <div className="admin-icon-box">🛡️</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h2 className="admin-title">Operator Command Deck</h2>
              <span className="admin-mode-pill">👑 Master Administrator</span>
            </div>
            <p className="admin-sub">
              Full control over user accounts, UPI payout clearances, cashback rates, and colony harvest economics.
            </p>
          </div>
        </div>

        <button
          className="admin-btn admin-btn-toggle"
          style={{ padding: '0.7rem 1.4rem', fontWeight: 800, background: '#ffffff' }}
          onClick={onExitAdmin}
        >
          ← Switch to User / Member View
        </button>
      </div>

      {notice && (
        <div style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#064e3b', padding: '0.85rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} style={{ background: 'transparent', fontWeight: 900, color: '#064e3b' }}>✕</button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="admin-kpis-grid">
        <div className="admin-kpi-card highlight">
          <div className="admin-kpi-label">Active Ants in Colony</div>
          <div className="admin-kpi-val">{overview?.kpis?.totalAnts?.toLocaleString() || '18,442'}</div>
          <div className="admin-kpi-sub" style={{ color: '#a7f3d0' }}>+128 joined today</div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Circulating Grains</div>
          <div className="admin-kpi-val" style={{ color: 'var(--champagne-gold)' }}>
            {(overview?.kpis?.circulatingGrains / 1000000).toFixed(2)}M 🌾
          </div>
          <div className="admin-kpi-sub">Total member grain assets</div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Vault Reserves (INR)</div>
          <div className="admin-kpi-val" style={{ color: 'var(--emerald-deep)' }}>
            ₹{overview?.kpis?.vaultReserveInr?.toLocaleString() || '14,20,500'}
          </div>
          <div className="admin-kpi-sub">Liquid payout liquidity pool</div>
        </div>

        <div className={`admin-kpi-card ${pendingWithdrawalsCount > 0 ? 'alert' : ''}`}>
          <div className="admin-kpi-label">Pending Payout Queue</div>
          <div className="admin-kpi-val">
            {pendingWithdrawalsCount} Requests
          </div>
          <div className="admin-kpi-sub">
            ₹{withdrawals.filter((w) => w.status === 'Pending').reduce((acc, c) => acc + c.amount, 0).toLocaleString()} awaiting clearance
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Cashback Disbursed</div>
          <div className="admin-kpi-val" style={{ color: 'var(--emerald-primary)' }}>
            ₹{(overview?.kpis?.cashbackDisbursedInr / 100000).toFixed(2)}L
          </div>
          <div className="admin-kpi-sub">Lifetime affiliate partner rewards</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="admin-tabs-bar">
        <button
          className={`admin-tab-btn ${activeTab === 'withdrawals' ? 'active' : ''}`}
          onClick={() => setActiveTab('withdrawals')}
        >
          ⚡ Payout Clearance Desk {pendingWithdrawalsCount > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '10px', padding: '0.1rem 0.5rem', fontSize: '0.75rem' }}>{pendingWithdrawalsCount}</span>}
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          🐜 Member Colony Roster ({members.length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'merchants' ? 'active' : ''}`}
          onClick={() => setActiveTab('merchants')}
        >
          🛍️ Merchant Rates & Cashback ({merchants.length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'economics' ? 'active' : ''}`}
          onClick={() => setActiveTab('economics')}
        >
          ⚙️ Colony Economics & Formula Rules
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: PAYOUT & WITHDRAWAL CLEARANCE DESK            */}
      {/* ======================================================== */}
      {activeTab === 'withdrawals' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                Member UPI Withdrawal Approvals
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Review requests submitted from the User Member Vault. Approvals immediately update user passbooks with banking UTR tags.
              </p>
            </div>
            <button className="admin-btn admin-btn-toggle" onClick={loadAllData}>
              🔄 Refresh Queue
            </button>
          </div>

          <div className="table-card">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Request Time</th>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>UPI ID</th>
                  <th>Status</th>
                  <th>Banking UTR</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No withdrawal requests in queue.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(w.createdAt).toLocaleDateString()} {new Date(w.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text-dark)', display: 'block' }}>{w.userName}</strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{w.userEmail}</span>
                      </td>
                      <td style={{ fontWeight: 900, color: 'var(--emerald-deep)', fontSize: '1.1rem' }}>
                        ₹{Number(w.amount).toFixed(2)}
                      </td>
                      <td>
                        <code style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--text-dark)', fontWeight: 700 }}>
                          {w.upiId}
                        </code>
                      </td>
                      <td>
                        {w.status === 'Pending' && <span className="payout-badge-pending">⏳ Pending Clearance</span>}
                        {w.status === 'Approved' && <span className="payout-badge-approved">✓ Settled & Paid</span>}
                        {w.status === 'Rejected' && <span className="payout-badge-rejected">✕ Rejected</span>}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {w.utrNumber ? (
                          <span style={{ fontWeight: 700, color: 'var(--emerald-primary)' }}>{w.utrNumber}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        {w.status === 'Pending' ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="admin-btn admin-btn-approve"
                              onClick={() => handleApproveWithdrawal(w.id, w.amount, w.upiId)}
                            >
                              ✓ Approve & Pay
                            </button>
                            <button
                              className="admin-btn admin-btn-reject"
                              onClick={() => handleRejectWithdrawal(w.id, w.amount)}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Completed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: MEMBER COLONY ROSTER                          */}
      {/* ======================================================== */}
      {activeTab === 'members' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                Registered Colony Ants
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Inspect referral linkages, grain holdings, and individual branch levels.
              </p>
            </div>
            <div className="admin-search-bar" style={{ marginBottom: 0 }}>
              <input
                type="text"
                placeholder="Search by name, email, or referral code..."
                className="admin-search-input"
                style={{ width: '320px' }}
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
              />
            </div>
          </div>

          <div className="table-card">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Ant Member</th>
                  <th>Referral Code</th>
                  <th>Sponsor / Upline</th>
                  <th>Grains Harvested</th>
                  <th>Direct Ants</th>
                  <th>Branch Depth</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong style={{ color: 'var(--text-dark)' }}>{m.name}</strong>
                      <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.email}</span>
                    </td>
                    <td>
                      <span className="growth-badge" style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#b45309' }}>
                        {m.referralCode}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {m.referredBy || 'Organic (Root)'}
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--champagne-gold)' }}>
                      {m.grainsBalance?.toLocaleString()} 🌾
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--emerald-deep)' }}>
                      {m.directAntsCount || 0} Ants
                    </td>
                    <td>
                      <span className="growth-badge">
                        Level {m.activeBranchDepth || 1}
                      </span>
                    </td>
                    <td>
                      {m.isActive ? (
                        <span style={{ color: '#047857', fontWeight: 800, fontSize: '0.82rem' }}>● Active</span>
                      ) : (
                        <span style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.82rem' }}>● Suspended</span>
                      )}
                    </td>
                    <td>
                      {m.role !== 'admin' && (
                        <button
                          className={`admin-btn ${m.isActive ? 'admin-btn-reject' : 'admin-btn-approve'}`}
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                          onClick={() => handleToggleMember(m.id, m.name)}
                        >
                          {m.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: MERCHANTS & CASHBACK RATES                    */}
      {/* ======================================================== */}
      {activeTab === 'merchants' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                Partner Merchant Cashback Configuration
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Adjust instant cashback rebates visible in the member Cashback Portal. Changes reflect immediately.
              </p>
            </div>
          </div>

          <div className="table-card">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Merchant</th>
                  <th>Category</th>
                  <th>Cashback Rebate (%)</th>
                  <th>Total Member Clicks</th>
                  <th>Partner Link Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.6rem' }}>{m.logo}</span>
                        <div>
                          <strong style={{ color: 'var(--text-dark)', fontSize: '1rem' }}>{m.name}</strong>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.redirectUrl}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{m.category}</td>
                    <td>
                      <span style={{ background: '#ecfdf5', color: 'var(--emerald-deep)', fontWeight: 900, padding: '0.35rem 0.8rem', borderRadius: '8px', border: '1px solid #10b981', fontSize: '1.05rem' }}>
                        {m.cashbackRate}%
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
                      {m.clicks || 0} clicks
                    </td>
                    <td>
                      <span style={{ color: m.isActive ? '#047857' : '#94a3b8', fontWeight: 800 }}>
                        {m.isActive ? '✓ Active & Displayed' : '✕ Disabled'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-btn admin-btn-toggle"
                        onClick={() => handleUpdateMerchantRate(m.id, m.name, m.cashbackRate)}
                      >
                        ✏️ Edit Rate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 4: COLONY ECONOMICS & FORMULA CONFIGURATOR       */}
      {/* ======================================================== */}
      {activeTab === 'economics' && settings && (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-dark)' }}>
              Colony Economics & Compensation Engine
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Fine-tune the mathematical parameters governing Entry fees, Direct referral rewards, and Level multipliers.
            </p>
          </div>

          <form onSubmit={handleSaveSettings}>
            <div className="admin-settings-grid">
              <div className="admin-input-card">
                <label>Colony Entry Fee (Grains)</label>
                <input
                  type="number"
                  value={settings.entryFeeGrains}
                  onChange={(e) => setSettings({ ...settings, entryFeeGrains: Number(e.target.value) })}
                />
                <span className="admin-input-desc">Default 123 grains required to open an active mound.</span>
              </div>

              <div className="admin-input-card">
                <label>Direct Referral Bonus (Grains)</label>
                <input
                  type="number"
                  value={settings.directBonusGrains}
                  onChange={(e) => setSettings({ ...settings, directBonusGrains: Number(e.target.value) })}
                />
                <span className="admin-input-desc">Grains credited instantly to sponsor ant upon invitation (default: 20).</span>
              </div>

              <div className="admin-input-card">
                <label>Level Expansion Multiplier</label>
                <input
                  type="number"
                  value={settings.levelExpansionMultiplier}
                  onChange={(e) => setSettings({ ...settings, levelExpansionMultiplier: Number(e.target.value) })}
                />
                <span className="admin-input-desc">Branch growth multiplier per tier (default: 5x).</span>
              </div>

              <div className="admin-input-card">
                <label>Max Isolated Branch Depth</label>
                <input
                  type="number"
                  value={settings.maxLevelsPerBranch}
                  onChange={(e) => setSettings({ ...settings, maxLevelsPerBranch: Number(e.target.value) })}
                />
                <span className="admin-input-desc">Max levels before branch completes and closes (default: 10 levels).</span>
              </div>

              <div className="admin-input-card">
                <label>Cashback → Grains Multiplier Bonus</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.cashbackToGrainMultiplier}
                  onChange={(e) => setSettings({ ...settings, cashbackToGrainMultiplier: Number(e.target.value) })}
                />
                <span className="admin-input-desc">Bonus multiplier when converting wallet cash to grains (default: 1.5x).</span>
              </div>

              <div className="admin-input-card">
                <label>New Colony Registrations</label>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className={`admin-btn ${settings.registrationsOpen ? 'admin-btn-approve' : 'admin-btn-toggle'}`}
                    onClick={() => setSettings({ ...settings, registrationsOpen: true })}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className={`admin-btn ${!settings.registrationsOpen ? 'admin-btn-reject' : 'admin-btn-toggle'}`}
                    onClick={() => setSettings({ ...settings, registrationsOpen: false })}
                  >
                    Paused
                  </button>
                </div>
                <span className="admin-input-desc">Toggle whole-network signup gate.</span>
              </div>
            </div>

            <button
              type="submit"
              className="nav-cta"
              style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
            >
              💾 Save & Apply Colony Economics
            </button>
          </form>
        </div>
      )}
    </section>
  )
}
