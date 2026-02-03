const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface User {
  id: string
  email: string
  name?: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  expiresIn: number
  user: User
  subscription?: {
    id: string
    planId: string
    status: string
    renewalDate: string
  }
}

export interface AuthState {
  token: string | null
  refreshToken: string | null
  user: User | null
  isAuthenticated: boolean
}

// Storage keys
const TOKEN_KEY = 'homelabvpn_token'
const REFRESH_TOKEN_KEY = 'homelabvpn_refresh_token'
const USER_KEY = 'homelabvpn_user'

// Get stored auth state
export function getAuthState(): AuthState {
  if (typeof window === 'undefined') {
    return { token: null, refreshToken: null, user: null, isAuthenticated: false }
  }

  const token = localStorage.getItem(TOKEN_KEY)
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  const userStr = localStorage.getItem(USER_KEY)
  const user = userStr ? JSON.parse(userStr) : null

  return {
    token,
    refreshToken,
    user,
    isAuthenticated: !!token,
  }
}

// Save auth state
export function setAuthState(auth: AuthResponse): void {
  localStorage.setItem(TOKEN_KEY, auth.token)
  localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken)
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user))
}

// Clear auth state
export function clearAuthState(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// Start Google OAuth flow
export async function startGoogleOAuth(): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/google/start`)
    const data = await response.json()

    if (data.redirectUrl) {
      // Store state for verification
      sessionStorage.setItem('oauth_state', data.state)
      // Redirect to Google
      window.location.href = data.redirectUrl
    }
  } catch (error) {
    console.error('Failed to start OAuth flow:', error)
    throw error
  }
}

// Complete Google OAuth
export async function completeGoogleOAuth(code: string, state: string): Promise<AuthResponse> {
  const storedState = sessionStorage.getItem('oauth_state')

  if (storedState !== state) {
    throw new Error('Invalid OAuth state')
  }

  sessionStorage.removeItem('oauth_state')

  const response = await fetch(`${API_URL}/api/v1/auth/google/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, state }),
  })

  if (!response.ok) {
    throw new Error('OAuth callback failed')
  }

  const auth: AuthResponse = await response.json()
  setAuthState(auth)
  return auth
}

// Refresh access token
export async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = getAuthState()

  if (!refreshToken) {
    return null
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      clearAuthState()
      return null
    }

    const data = await response.json()
    localStorage.setItem(TOKEN_KEY, data.token)
    return data.token
  } catch (error) {
    console.error('Failed to refresh token:', error)
    clearAuthState()
    return null
  }
}

// Logout
export async function logout(): Promise<void> {
  const { token } = getAuthState()

  if (token) {
    try {
      await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (error) {
      console.error('Logout request failed:', error)
    }
  }

  clearAuthState()
  window.location.href = '/'
}

// API request helper with auto-refresh
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let { token } = getAuthState()

  const makeRequest = async (authToken: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })
  }

  let response = await makeRequest(token)

  // If unauthorized, try refreshing token
  if (response.status === 401 && token) {
    token = await refreshAccessToken()
    if (token) {
      response = await makeRequest(token)
    }
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`)
  }

  return response.json()
}
