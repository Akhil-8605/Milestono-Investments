import { MOCK_USERS, authTokenKey, userKey } from '@/lib/auth/constants'

// Mock API service for authentication
export async function mockLogin(email: string, password: string) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Find user by email
  const user = Object.values(MOCK_USERS).find((u) => u.email === email)

  if (!user) {
    throw new Error('User not found')
  }

  // Mock token generation
  const token = `mock_token_${Date.now()}`
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

  return {
    token,
    user,
    expiresAt,
  }
}

export function saveAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(authTokenKey, token)
  }
}

export function saveUser(user: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(userKey, JSON.stringify(user))
  }
}

export function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(authTokenKey)
  }
  return null
}

export function getUser() {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem(userKey)
    return user ? JSON.parse(user) : null
  }
  return null
}

export function isAuthenticated() {
  return getAuthToken() !== null
}
