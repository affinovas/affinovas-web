import React, { useState, useEffect } from 'react'
import { apiService } from '../services/apiService'
import PromptModal from './PromptModal'
import { toast } from './Toast'
import './AdminDashboard.css'

const DEFAULT_OVERVIEW = {
  kpis: {
    totalAnts: 0,
    circulatingGrains: 0,
    vaultReserveInr: 0,
    cashbackDisbursedInr: 0,
    pendingPayoutCount: 0,
    pendingPayoutAmount: 0,
    activeMerchants: 6
  }
}

const DEFAULT_SETTINGS = {
  entryFeeGrains: 123,
  directBonusGrains: 20,
  levelExpansionMultiplier: 5,
  maxLevelsPerBranch: 10,
  grainToInrRatio: 1.0,
  cashbackToGrainMultiplier: 1.5,
  registrationsOpen: true
}

export default function AdminDashboard({ onExitAdmin, onSettingsUpdated, onMerchantsUpdated }) {
  const [activeTab, setActiveTab] = useState('withdrawals')
  const [overview, setOverview] = useState(DEFAULT_OVERVIEW)
  const [members, setMembers] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [merchants, setMerchants] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [searchMember, setSearchMember] = useState('')
  const [loading, setLoading] = useState(false)
  const [promptConfig, setPromptConfig] = useState(null)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      const results = await Promise.allSettled([
        apiService.getAdminOverview(),
        apiService.getAdminMembers(),
        apiService.getAdminWithdrawals(),
        apiService.getMerchants(),
        apiService.getColonySettings()
      ])

      if (results[0].status === 'fulfilled' && results[0].value) setOverview(results[0].value)
      if (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) setMembers(results[1].value)
      if (results[2].status === 'fulfilled' && Array.isArray(results[2].value)) setWithdrawals(results[2].value)
      if (results[3].status === 'fulfilled' && Array.isArray(results[3].value)) {
        setMerchants(results[3].value)
        onMerchantsUpdated?.(results[3].value)
      }
      if (results[4].status === 'fulfilled' && results[4].value) {
        setSettings(results[4].value)
        onSettingsUpdated?.(results[4].value)
      }
    } catch (err) {
      console.error('Failed to load admin data', err)
    }
  }

  // Handle Payout Approval with Custom Modal
  const handleApproveWithdrawal = (id, amount, upiId, userName) => {
    const defaultUtr = `UTR-${Date.now().toString().slice(-8)}`
    setPromptConfig({
      title: '⚡ Approve Banking Transfer',
      subtitle: `Clear payout for ${userName}`,
      icon: '🏦',
      type: 'default',
      detailLabel: 'Transfer Amount & Destination:',
      detailValue: `₹${Number(amount).toFixed(2)} → ${upiId}`,
      inputLabel: 'Banking UTR / Transaction Reference Number',
      initialValue: defaultUtr,
      placeholder: 'e.g. UTR-98234821',
      submitText: '✓ Approve & Mark Paid',
      onSubmit: async (utr) => {
        setPromptConfig(null)
        try {
          await apiService.processWithdrawal(id, true, utr, 'Dispatched via Banking UPI Gateway')
          toast.success(`Withdrawal of ₹${amount} marked as PAID!\nUTR: ${utr}`, 'Payout Settled')
          loadAllData()
        } catch (e) {
          toast.error(e.message, 'Approval Failed')
        }
      }
    })
  }

  // Handle Payout Rejection with Custom Modal
  const handleRejectWithdrawal = (id, amount, userName) => {
    setPromptConfig({
      title: '✕ Reject Payout Request',
      subtitle: `Amount will be refunded back to ${userName}'s wallet`,
      icon: '⚠️',
      type: 'danger',
      detailLabel: 'Refund Amount:',
      detailValue: `₹${Number(amount).toFixed(2)}`,
      inputLabel: 'Reason for Rejection',
      initialValue: 'Invalid UPI ID or KYC verification required',
      placeholder: 'Enter reason...',
      submitText: '✕ Reject & Refund',
      onSubmit: async (reason) => {
        setPromptConfig(null)
        try {
          await apiService.processWithdrawal(id, false, null, reason)
          toast.warning(`Withdrawal of ₹${amount} rejected.\nReason: ${reason}`, 'Payout Refunded')
          loadAllData()
        } catch (e) {
          toast.error(e.message, 'Rejection Failed')
        }
      }
    })
  }

  // Handle Member Status Toggle
  const handleToggleMember = async (userId, currentName) => {
    try {
      const res = await apiService.toggleMemberStatus(userId)
      if (res.isActive) {
        toast.success(`Ant member "${currentName}" is now Active.`, 'Member Activated')
      } else {
        toast.warning(`Ant member "${currentName}" has been Suspended.`, 'Member Suspended')
      }
      loadAllData()
    } catch (e) {
      toast.error(e.message, 'Action Failed')
    }
  }

  // Handle Merchant Cashback Update with Custom Modal
  const handleUpdateMerchantRate = (id, name, currentRate) => {
    setPromptConfig({
      title: `🛍️ Update Cashback Rate`,
      subtitle: `Configure instant rebate percentage for ${name}`,
      icon: '🏷️',
      type: 'info',
      detailLabel: 'Current Store:',
      detailValue: `${name} (Current: ${currentRate}%)`,
      inputLabel: 'New Cashback Percentage (%)',
      initialValue: String(currentRate),
      placeholder: 'e.g. 9.5',
      inputType: 'number',
      submitText: 'Save New Rate',
      onSubmit: async (newRate) => {
        if (isNaN(newRate) || Number(newRate) < 0) {
          toast.error('Please enter a valid percentage rate', 'Invalid Input')
          return
        }
        setPromptConfig(null)
        try {
          await apiService.updateMerchantRate(id, Number(newRate))
          toast.success(`Updated ${name} cashback rebate to ${newRate}%!`, 'Rates Updated')
          const updatedMerchants = await apiService.getMerchants()
          setMerchants(updatedMerchants)
          onMerchantsUpdated?.(updatedMerchants)
          loadAllData()
        } catch (e) {
          toast.error(e.message, 'Update Failed')
        }
      }
    })
  }

  // Handle Toggle Merchant Active Status
  const handleToggleMerchant = async (id, name, newActive) => {
    try {
      await apiService.updateMerchantRate(id, undefined, newActive)
      toast.info(`Partner ${name} is now ${newActive ? 'Active' : 'Disabled'}.`, 'Merchant Status Changed')
      const updatedMerchants = await apiService.getMerchants()
      setMerchants(updatedMerchants)
      onMerchantsUpdated?.(updatedMerchants)
      loadAllData()
    } catch (e) {
      toast.error(e.message, 'Update Failed')
    }
  }

  // Handle Colony Settings Save
  const handleSaveSettings = async (e) => {
    e.preventDefault()
    try {
      await apiService.updateColonySettings(settings)
      toast.success('Colony Economics & Compensation Engine rules applied!', 'Settings Saved')
      onSettingsUpdated?.(settings)
      loadAllData()
    } catch (e) {
      toast.error(e.message, 'Save Failed')
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
      </div>

      {/* KPI Cards Strip (100% Real Authentic Data) */}
      <div className="admin-kpis-grid">
        <div className="admin-kpi-card highlight">
          <div className="admin-kpi-label">Registered Colony Ants</div>
          <div className="admin-kpi-val">{members.length.toLocaleString()}</div>
          <div className="admin-kpi-sub" style={{ color: '#a7f3d0' }}>Real verified database members</div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Circulating Grains</div>
          <div className="admin-kpi-val" style={{ color: 'var(--champagne-gold)' }}>
            {(members.reduce((acc, m) => acc + (Number(m.grainsBalance) || 0), 0)).toLocaleString()} 🌾
          </div>
          <div className="admin-kpi-sub">Total member grain assets</div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Partner Merchants</div>
          <div className="admin-kpi-val" style={{ color: 'var(--emerald-deep)' }}>
            {merchants.length} Brands
          </div>
          <div className="admin-kpi-sub">Active cashback integrations</div>
        </div>

        <div className={`admin-kpi-card ${pendingWithdrawalsCount > 0 ? 'alert' : ''}`}>
          <div className="admin-kpi-label">Pending Payout Queue</div>
          <div className="admin-kpi-val">
            {pendingWithdrawalsCount} Requests
          </div>
          <div className="admin-kpi-sub">
            ₹{(withdrawals || []).filter((w) => w.status === 'Pending').reduce((acc, c) => acc + (Number(c.amount) || 0), 0).toLocaleString()} awaiting clearance
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Cashback Disbursed</div>
          <div className="admin-kpi-val" style={{ color: 'var(--emerald-primary)' }}>
            ₹{(withdrawals || []).filter((w) => w.status === 'Approved').reduce((acc, c) => acc + (Number(c.amount) || 0), 0).toLocaleString()}
          </div>
          <div className="admin-kpi-sub">Cleared partner payouts</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="admin-tabs-bar">
        <button
          id="admin-tab-withdrawals"
          type="button"
          className={`admin-tab-btn ${activeTab === 'withdrawals' ? 'active' : ''}`}
          onClick={() => setActiveTab('withdrawals')}
        >
          ⚡ Payout Clearance Desk {pendingWithdrawalsCount > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '10px', padding: '0.1rem 0.5rem', fontSize: '0.75rem' }}>{pendingWithdrawalsCount}</span>}
        </button>
        <button
          id="admin-tab-members"
          type="button"
          className={`admin-tab-btn ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          🐜 Member Colony Roster ({members.length})
        </button>
        <button
          id="admin-tab-merchants"
          type="button"
          className={`admin-tab-btn ${activeTab === 'merchants' ? 'active' : ''}`}
          onClick={() => setActiveTab('merchants')}
        >
          🛍️ Merchant Rates & Cashback ({merchants.length})
        </button>
        <button
          id="admin-tab-economics"
          type="button"
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
                              onClick={() => handleApproveWithdrawal(w.id, w.amount, w.upiId, w.userName)}
                            >
                              ✓ Approve & Pay
                            </button>
                            <button
                              className="admin-btn admin-btn-reject"
                              onClick={() => handleRejectWithdrawal(w.id, w.amount, w.userName)}
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
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          className="admin-btn admin-btn-toggle"
                          onClick={() => handleUpdateMerchantRate(m.id, m.name, m.cashbackRate)}
                        >
                          ✏️ Edit Rate
                        </button>
                        <button
                          className={`admin-btn ${m.isActive ? 'admin-btn-reject' : 'admin-btn-approve'}`}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => handleToggleMerchant(m.id, m.name, !m.isActive)}
                        >
                          {m.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </div>
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

      {/* Custom Prompt & Confirmation Modal */}
      {promptConfig && (
        <PromptModal
          isOpen={!!promptConfig}
          onClose={() => setPromptConfig(null)}
          {...promptConfig}
        />
      )}
    </section>
  )
}
