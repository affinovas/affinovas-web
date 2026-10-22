// ========================================================
// AFFINOVAS HYBRID API SERVICE
// Connects to ASP.NET Core BE, with fallback state engine
// ========================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Pre-seeded Demo Data for Standalone / Client Execution
const INITIAL_USERS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@affinovas.com',
    password: 'admin123',
    name: 'Affinovas Admin',
    role: 'admin',
    referralCode: 'AFF-ADMIN',
    referredBy: null,
    grainsBalance: 5240000,
    cashbackBalance: 245000.0,
    upiId: 'treasury@affinovas',
    directAntsCount: 42,
    activeBranchDepth: 10,
    isActive: true,
    createdAt: '2026-10-01T00:00:00Z'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'ramu@affinovas.com',
    password: 'ramu123',
    name: 'Ramu AntLeader',
    role: 'member',
    referralCode: 'AFF-RAMU',
    referredBy: 'AFF-ADMIN',
    grainsBalance: 1840,
    cashbackBalance: 450.0,
    upiId: 'ramu@okhdfcbank',
    directAntsCount: 3,
    activeBranchDepth: 3,
    isActive: true,
    createdAt: '2026-10-10T12:00:00Z'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'somu@affinovas.com',
    password: 'somu123',
    name: 'Somu Builder',
    role: 'member',
    referralCode: 'AFF-SOMU',
    referredBy: 'AFF-RAMU',
    grainsBalance: 620,
    cashbackBalance: 120.0,
    upiId: 'somu@icici',
    directAntsCount: 5,
    activeBranchDepth: 3,
    isActive: true,
    createdAt: '2026-10-14T09:00:00Z'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'mani@affinovas.com',
    password: 'mani123',
    name: 'Mani Forager',
    role: 'member',
    referralCode: 'AFF-MANI',
    referredBy: 'AFF-RAMU',
    grainsBalance: 340,
    cashbackBalance: 85.0,
    upiId: 'mani@paytm',
    directAntsCount: 1,
    activeBranchDepth: 1,
    isActive: true,
    createdAt: '2026-10-21T08:15:00Z'
  }
]

const INITIAL_WITHDRAWALS = [
  {
    id: 'w-101',
    userId: '22222222-2222-2222-2222-222222222222',
    userEmail: 'ramu@affinovas.com',
    userName: 'Ramu AntLeader',
    amount: 450.0,
    upiId: 'ramu@okhdfcbank',
    status: 'Pending',
    utrNumber: null,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  },
  {
    id: 'w-100',
    userId: '44444444-4444-4444-4444-444444444444',
    userEmail: 'mani@affinovas.com',
    userName: 'Mani Forager',
    amount: 200.0,
    upiId: 'mani@paytm',
    status: 'Approved',
    utrNumber: 'UTR-992381044',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  }
]

const INITIAL_MERCHANTS = [
  { id: 'm-1', name: 'Flipkart', category: 'Electronics & Lifestyle', cashbackRate: 8.5, logo: '🛒', redirectUrl: 'https://flipkart.com', isActive: true, clicks: 420 },
  { id: 'm-2', name: 'Amazon', category: 'General Merchandise', cashbackRate: 7.0, logo: '📦', redirectUrl: 'https://amazon.in', isActive: true, clicks: 612 },
  { id: 'm-3', name: 'Myntra', category: 'Fashion Trends', cashbackRate: 10.0, logo: '👗', redirectUrl: 'https://myntra.com', isActive: true, clicks: 285 },
  { id: 'm-4', name: 'Swiggy & Instamart', category: 'Food & Groceries', cashbackRate: 5.0, logo: '🍔', redirectUrl: 'https://swiggy.com', isActive: true, clicks: 530 },
  { id: 'm-5', name: 'MakeMyTrip', category: 'Flights & Stays', cashbackRate: 12.0, logo: '✈️', redirectUrl: 'https://makemytrip.com', isActive: true, clicks: 142 },
  { id: 'm-6', name: 'Ajio', category: 'Trends & Luxury', cashbackRate: 9.0, logo: '✨', redirectUrl: 'https://ajio.com', isActive: true, clicks: 190 }
]

const INITIAL_SETTINGS = {
  entryFeeGrains: 123,
  directBonusGrains: 20,
  levelExpansionMultiplier: 5,
  maxLevelsPerBranch: 10,
  grainToInrRatio: 1.0,
  cashbackToGrainMultiplier: 1.5,
  registrationsOpen: true
}

// Local Storage Helpers
function getStore(key, defaultVal) {
  try {
    const raw = localStorage.getItem(`affinovas_${key}`)
    return raw ? JSON.parse(raw) : defaultVal
  } catch {
    return defaultVal
  }
}

function setStore(key, val) {
  try {
    localStorage.setItem(`affinovas_${key}`, JSON.stringify(val))
  } catch (e) {
    console.error('Storage write error', e)
  }
}

// Initialize storage if missing
if (!localStorage.getItem('affinovas_users')) setStore('users', INITIAL_USERS)
if (!localStorage.getItem('affinovas_withdrawals')) setStore('withdrawals', INITIAL_WITHDRAWALS)
if (!localStorage.getItem('affinovas_merchants')) setStore('merchants', INITIAL_MERCHANTS)
if (!localStorage.getItem('affinovas_settings')) setStore('settings', INITIAL_SETTINGS)

export const apiService = {
  // Authentication
  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('affinovas_token', data.token)
        localStorage.setItem('affinovas_current_user', JSON.stringify(data.user))
        return data
      }
    } catch {
      // Fallback
    }

    const users = getStore('users', INITIAL_USERS)
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )

    if (!found) {
      throw new Error('Invalid email or password.')
    }
    if (!found.isActive) {
      throw new Error('This account is suspended. Contact Affinovas Administrator.')
    }

    const authData = {
      token: 'jwt-simulated-token-' + found.id,
      user: {
        id: found.id,
        email: found.email,
        name: found.name,
        role: found.role,
        referralCode: found.referralCode,
        grainsBalance: found.grainsBalance,
        cashbackBalance: found.cashbackBalance,
        upiId: found.upiId,
        directAntsCount: found.directAntsCount,
        activeBranchDepth: found.activeBranchDepth
      }
    }
    localStorage.setItem('affinovas_token', authData.token)
    localStorage.setItem('affinovas_current_user', JSON.stringify(authData.user))
    return authData
  },

  async register({ email, password, name, referralCode, upiId }) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName: name, referralCode, upiId })
      })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('affinovas_token', data.token)
        localStorage.setItem('affinovas_current_user', JSON.stringify(data.user))
        return data
      }
    } catch {
      // Fallback
    }

    const users = getStore('users', INITIAL_USERS)
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists.')
    }

    const cleanName = name.trim()
    const refCode = 'AFF-' + cleanName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) + Math.floor(100 + Math.random() * 900)

    const newUser = {
      id: 'u-' + Date.now(),
      email,
      password,
      name: cleanName,
      role: 'member',
      referralCode: refCode,
      referredBy: referralCode || 'AFF-ADMIN',
      grainsBalance: 50, // 50 Welcome Grains
      cashbackBalance: 0,
      upiId: upiId || `${cleanName.toLowerCase()}@upi`,
      directAntsCount: 0,
      activeBranchDepth: 1,
      isActive: true,
      createdAt: new Date().toISOString()
    }

    users.push(newUser)
    setStore('users', users)

    const authData = {
      token: 'jwt-simulated-token-' + newUser.id,
      user: newUser
    }
    localStorage.setItem('affinovas_token', authData.token)
    localStorage.setItem('affinovas_current_user', JSON.stringify(newUser))
    return authData
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem('affinovas_current_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  logout() {
    localStorage.removeItem('affinovas_token')
    localStorage.removeItem('affinovas_current_user')
  },

  // Member Actions
  async requestWithdrawal({ userId, userEmail, userName, amount, upiId }) {
    try {
      const res = await fetch(`${API_BASE}/user/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: userEmail, name: userName, amount, upiId })
      })
      if (res.ok) return await res.json()
    } catch {
      // Fallback
    }

    const withdrawals = getStore('withdrawals', INITIAL_WITHDRAWALS)
    const newEntry = {
      id: 'w-' + Date.now(),
      userId,
      userEmail,
      userName,
      amount: Number(amount),
      upiId,
      status: 'Pending',
      utrNumber: null,
      createdAt: new Date().toISOString()
    }

    withdrawals.unshift(newEntry)
    setStore('withdrawals', withdrawals)

    // Deduct user cashback balance in store
    const users = getStore('users', INITIAL_USERS)
    const user = users.find((u) => u.id === userId)
    if (user && user.cashbackBalance >= amount) {
      user.cashbackBalance -= Number(amount)
      setStore('users', users)
      localStorage.setItem('affinovas_current_user', JSON.stringify(user))
    }

    return {
      success: true,
      message: `✓ Payout request of ₹${amount} submitted to ${upiId}!`,
      withdrawal: newEntry
    }
  },

  // Admin Desk APIs
  async getAdminOverview() {
    try {
      const res = await fetch(`${API_BASE}/admin/overview`)
      if (res.ok) return await res.json()
    } catch {
      // Fallback
    }

    const users = getStore('users', INITIAL_USERS)
    const withdrawals = getStore('withdrawals', INITIAL_WITHDRAWALS)
    const merchants = getStore('merchants', INITIAL_MERCHANTS)
    const settings = getStore('settings', INITIAL_SETTINGS)

    const pending = withdrawals.filter((w) => w.status === 'Pending')
    const approved = withdrawals.filter((w) => w.status === 'Approved')

    return {
      kpis: {
        totalAnts: 18400 + users.length,
        circulatingGrains: 5240890,
        vaultReserveInr: 1420500.0,
        cashbackDisbursedInr: 2450320.0 + approved.reduce((acc, curr) => acc + curr.amount, 0),
        pendingPayoutCount: pending.length,
        pendingPayoutAmount: pending.reduce((acc, curr) => acc + curr.amount, 0),
        activeMerchants: merchants.filter((m) => m.isActive).length
      },
      systemHealth: 'Operational 99.98%',
      colonySettings: settings
    }
  },

  async getAdminMembers(search = '') {
    try {
      const res = await fetch(`${API_BASE}/admin/members?search=${encodeURIComponent(search)}`)
      if (res.ok) return await res.json()
    } catch {
      // Fallback
    }

    const users = getStore('users', INITIAL_USERS)
    if (!search) return users

    const query = search.toLowerCase()
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.referralCode.toLowerCase().includes(query)
    )
  },

  async toggleMemberStatus(userId) {
    try {
      const res = await fetch(`${API_BASE}/admin/members/${userId}/toggle-status`, { method: 'POST' })
      if (res.ok) return await res.json()
    } catch {
      // Fallback
    }

    const users = getStore('users', INITIAL_USERS)
    const user = users.find((u) => u.id === userId)
    if (user) {
      user.isActive = !user.isActive
      setStore('users', users)
      return { success: true, isActive: user.isActive }
    }
    throw new Error('User not found')
  },

  async getAdminWithdrawals() {
    try {
      const res = await fetch(`${API_BASE}/admin/withdrawals`)
      if (res.ok) return await res.json()
    } catch {
      // Fallback
    }

    return getStore('withdrawals', INITIAL_WITHDRAWALS)
  },

  async processWithdrawal(id, approved, utrNumber, note) {
    try {
      const res = await fetch(`${API_BASE}/admin/withdrawals/${id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, utrNumber, note })
      })
      if (res.ok) return await res.json()
    } catch {
      // Fallback
    }

    const withdrawals = getStore('withdrawals', INITIAL_WITHDRAWALS)
    const item = withdrawals.find((w) => w.id === id)
    if (item) {
      item.status = approved ? 'Approved' : 'Rejected'
      item.utrNumber = approved ? (utrNumber || `UTR-${Math.floor(100000000 + Math.random() * 900000000)}`) : null
      item.processedAt = new Date().toISOString()
      item.adminNote = note || (approved ? 'Verified & Dispatched to bank' : 'Rejected & Refunded')
      setStore('withdrawals', withdrawals)
      return { success: true, withdrawal: item }
    }
    throw new Error('Withdrawal request not found.')
  },

  async getMerchants() {
    try {
      const res = await fetch(`${API_BASE}/admin/merchants`)
      if (res.ok) return await res.json()
    } catch {
      // Fallback
    }
    return getStore('merchants', INITIAL_MERCHANTS)
  },

  async updateMerchantRate(id, newRate, isActive) {
    try {
      const res = await fetch(`${API_BASE}/admin/merchants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cashbackRate: newRate, isActive })
      })
      if (res.ok) return await res.json()
    } catch {
      // Fallback
    }

    const merchants = getStore('merchants', INITIAL_MERCHANTS)
    const m = merchants.find((item) => item.id === id)
    if (m) {
      if (newRate !== undefined) m.cashbackRate = Number(newRate)
      if (isActive !== undefined) m.isActive = Boolean(isActive)
      setStore('merchants', merchants)
      return { success: true, merchant: m }
    }
    throw new Error('Merchant not found.')
  },

  async getColonySettings() {
    try {
      const res = await fetch(`${API_BASE}/admin/settings`)
      if (res.ok) return await res.json()
    } catch {
      // Fallback
    }
    return getStore('settings', INITIAL_SETTINGS)
  },

  async updateColonySettings(newSettings) {
    try {
      const res = await fetch(`${API_BASE}/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      })
      if (res.ok) return await res.json()
    } catch {
      // Fallback
    }

    const current = getStore('settings', INITIAL_SETTINGS)
    const updated = { ...current, ...newSettings }
    setStore('settings', updated)
    return { success: true, settings: updated }
  }
}
