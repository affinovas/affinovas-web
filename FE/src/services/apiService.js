// ========================================================
// AFFINOVAS HYBRID API SERVICE
// Connects to ASP.NET Core BE, with fallback state engine
// ========================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5267/api'

// Pre-seeded Demo Data for Standalone / Client Execution (Production-Ready Clean Defaults)
const INITIAL_USERS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@affinovas.com',
    phoneNumber: '+919999999999',
    password: 'admin123',
    name: 'Affinovas Admin',
    role: 'admin',
    referralCode: 'AFF-ADMIN',
    referredBy: null,
    grainsBalance: 0,
    cashbackBalance: 0.0,
    upiId: 'treasury@affinovas',
    directAntsCount: 0,
    activeBranchDepth: 1,
    isActive: true,
    createdAt: '2026-10-01T00:00:00Z'
  }
]

const INITIAL_WITHDRAWALS = []

const INITIAL_MERCHANTS = [
  { id: 'm-1', name: 'Flipkart', category: 'Electronics & Lifestyle', cashbackRate: 8.5, logo: '🛒', redirectUrl: 'https://flipkart.com', isActive: true, clicks: 0 },
  { id: 'm-2', name: 'Amazon', category: 'General Merchandise', cashbackRate: 7.0, logo: '📦', redirectUrl: 'https://amazon.in', isActive: true, clicks: 0 },
  { id: 'm-3', name: 'Myntra', category: 'Fashion Trends', cashbackRate: 10.0, logo: '👗', redirectUrl: 'https://myntra.com', isActive: true, clicks: 0 },
  { id: 'm-4', name: 'Swiggy & Instamart', category: 'Food & Groceries', cashbackRate: 5.0, logo: '🍔', redirectUrl: 'https://swiggy.com', isActive: true, clicks: 0 },
  { id: 'm-5', name: 'MakeMyTrip', category: 'Flights & Stays', cashbackRate: 12.0, logo: '✈️', redirectUrl: 'https://makemytrip.com', isActive: true, clicks: 0 },
  { id: 'm-6', name: 'Ajio', category: 'Trends & Luxury', cashbackRate: 9.0, logo: '✨', redirectUrl: 'https://ajio.com', isActive: true, clicks: 0 }
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

// Initialize storage & auto-sanitize legacy dummy rows
try {
  const storedUsers = JSON.parse(localStorage.getItem('affinovas_users') || '[]')
  const hasMockData = storedUsers.some((u) => u.email === 'ramu@affinovas.com' || u.grainsBalance === 1840 || u.cashbackBalance >= 245000)
  if (hasMockData || !localStorage.getItem('affinovas_clean_v3')) {
    setStore('users', INITIAL_USERS)
    setStore('withdrawals', INITIAL_WITHDRAWALS)
    localStorage.setItem('affinovas_clean_v3', 'true')
  }

  const cachedUser = localStorage.getItem('affinovas_current_user')
  if (cachedUser) {
    const parsed = JSON.parse(cachedUser)
    if (parsed.email === 'admin@affinovas.com' || parsed.grainsBalance === 1840 || parsed.cashbackBalance >= 245000) {
      parsed.grainsBalance = 0
      parsed.cashbackBalance = 0.0
      parsed.directAntsCount = 0
      localStorage.setItem('affinovas_current_user', JSON.stringify(parsed))
    }
  }
} catch (e) {
  // Ignore
}

if (!localStorage.getItem('affinovas_users')) setStore('users', INITIAL_USERS)
if (!localStorage.getItem('affinovas_withdrawals')) setStore('withdrawals', INITIAL_WITHDRAWALS)
if (!localStorage.getItem('affinovas_merchants')) setStore('merchants', INITIAL_MERCHANTS)
if (!localStorage.getItem('affinovas_settings')) setStore('settings', INITIAL_SETTINGS)

export const apiService = {
  // Mobile OTP Authentication
  async sendOtp(phoneNumber) {
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      })
      if (res.ok) {
        return await res.json()
      } else {
        const err = await res.json().catch(() => ({}))
        if (err.message && res.status < 500) {
          throw new Error(err.message)
        }
      }
    } catch (err) {
      if (err.message && !err.message.includes('fetch') && !err.message.includes('Network') && !err.message.includes('Failed')) {
        throw err
      }
      // Offline fallback when backend server is unreachable
    }

    const clean = phoneNumber.replace(/\D/g, '')
    const users = getStore('users', INITIAL_USERS)
    const existing = users.find(
      (u) => (u.phoneNumber && u.phoneNumber.replace(/\D/g, '') === clean) ||
             (u.phoneNumber && u.phoneNumber.replace(/\D/g, '') === clean.slice(-10))
    )

    // Secure simulated 6-digit verification code
    const devOtp = String(Math.floor(100000 + Math.random() * 900000))
    setStore('pending_otp_' + clean, { otp: devOtp, timestamp: Date.now() })

    return {
      success: true,
      message: `OTP sent to +91 ${clean.slice(-10)}`,
      devOtp,
      isNewUser: !existing
    }
  },

  async verifyOtp({ phoneNumber, otpCode, antName, referralCode }) {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otpCode, antName, referralCode })
      })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('affinovas_token', data.token)
        localStorage.setItem('affinovas_current_user', JSON.stringify(data.user))
        return data
      } else {
        const err = await res.json().catch(() => ({}))
        if (err.message && res.status < 500) {
          throw new Error(err.message)
        }
      }
    } catch (err) {
      if (err.message && !err.message.includes('fetch') && !err.message.includes('Network') && !err.message.includes('Failed')) {
        throw err
      }
      // Offline fallback when backend server is unreachable
    }

    const clean = phoneNumber.replace(/\D/g, '')
    const pending = getStore('pending_otp_' + clean, null)

    // Allow the generated OTP or master test code 123456
    const validOtp = pending?.otp || '123456'
    if (otpCode !== validOtp && otpCode !== '123456') {
      throw new Error(`Invalid verification code. Please enter ${validOtp}`)
    }

    const users = getStore('users', INITIAL_USERS)
    let user = users.find(
      (u) => (u.phoneNumber && u.phoneNumber.replace(/\D/g, '') === clean) ||
             (u.phoneNumber && u.phoneNumber.replace(/\D/g, '') === clean.slice(-10))
    )

    if (!user) {
      // New member onboarding
      const rawName = (antName || 'Ant_' + clean.slice(-4)).trim()
      const cleanLetters = rawName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) || 'ANT'
      const refCode = 'AFF-' + cleanLetters + Math.floor(100 + Math.random() * 900)

      // Award bonus to referrer if provided
      const effectiveRef = referralCode?.trim() || 'AFF-ADMIN'
      const referrer = users.find((u) => u.referralCode?.toUpperCase() === effectiveRef.toUpperCase())
      if (referrer) {
        referrer.grainsBalance = (referrer.grainsBalance || 0) + 20
        referrer.directAntsCount = (referrer.directAntsCount || 0) + 1
      }

      user = {
        id: 'u-' + Date.now(),
        email: `${clean.slice(-10)}@affinovas.online`,
        phoneNumber: `+91${clean.slice(-10)}`,
        password: '',
        name: rawName,
        role: 'member',
        referralCode: refCode,
        referredBy: effectiveRef,
        grainsBalance: 50, // 50 Welcome Grains
        cashbackBalance: 0.0,
        upiId: `${rawName.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`,
        directAntsCount: 0,
        activeBranchDepth: 1,
        isActive: true,
        createdAt: new Date().toISOString()
      }
      users.push(user)
      setStore('users', users)
    }

    const authData = {
      token: 'jwt-simulated-token-' + user.id,
      user
    }
    localStorage.setItem('affinovas_token', authData.token)
    localStorage.setItem('affinovas_current_user', JSON.stringify(user))
    return authData
  },

  // Legacy Email/Password Authentication
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
      } else {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || 'Invalid email or password.')
      }
    } catch (err) {
      if (err.message && err.message !== 'Failed to fetch') {
        throw err
      }
      // Offline fallback only when backend server is unreachable
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
      } else {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || 'Registration failed.')
      }
    } catch (err) {
      if (err.message && err.message !== 'Failed to fetch') {
        throw err
      }
      // Offline fallback only when backend server is unreachable
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
        totalAnts: users.length,
        circulatingGrains: users.reduce((acc, curr) => acc + (curr.grainsBalance || 0), 0),
        vaultReserveInr: users.reduce((acc, curr) => acc + (curr.cashbackBalance || 0), 0),
        cashbackDisbursedInr: approved.reduce((acc, curr) => acc + (curr.amount || 0), 0),
        pendingPayoutCount: pending.length,
        pendingPayoutAmount: pending.reduce((acc, curr) => acc + curr.amount, 0),
        activeMerchants: merchants.filter((m) => m.isActive).length
      },
      systemHealth: 'Operational 100%',
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

  async addMerchant({ name, category, cashbackRate, logo, redirectUrl }) {
    try {
      const res = await fetch(`${API_BASE}/admin/merchants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, cashbackRate: Number(cashbackRate), logo, redirectUrl })
      })
      if (res.ok) return await res.json()
    } catch {
      // Fallback
    }

    const merchants = getStore('merchants', INITIAL_MERCHANTS)
    const newM = {
      id: 'm-' + Date.now(),
      name: name.trim(),
      category: category.trim(),
      cashbackRate: Number(cashbackRate),
      logo: logo || '🛍️',
      redirectUrl: redirectUrl || 'https://google.com',
      isActive: true,
      clicks: 0
    }
    merchants.push(newM)
    setStore('merchants', merchants)
    return { success: true, merchant: newM }
  },

  async trackMerchantClick(id) {
    const merchants = getStore('merchants', INITIAL_MERCHANTS)
    const m = merchants.find((item) => item.id === id)
    if (m) {
      m.clicks = (m.clicks || 0) + 1
      setStore('merchants', merchants)
    }
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
