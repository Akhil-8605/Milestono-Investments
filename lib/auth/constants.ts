// Mock auth context for development
// In production, this would integrate with api.milestono.com/

export interface AuthContextType {
  user: any
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  userRole: 'investor' | 'developer' | 'admin' | null
}

export const MOCK_USERS = {
  investor: {
    id: 'user-investor-1',
    email: 'investor@milestono.com',
    name: 'Rajesh Kumar',
    role: 'investor',
    premium: false,
    kycVerified: true,
    subscriptionTier: 'free',
  },
  developer: {
    id: 'user-dev-1',
    email: 'developer@milestono.com',
    name: 'Priya Sharma',
    role: 'developer',
    premium: true,
    kycVerified: true,
    subscriptionTier: 'pro',
  },
  admin: {
    id: 'user-admin-1',
    email: 'admin@milestono.com',
    name: 'Admin User',
    role: 'admin',
    premium: true,
    kycVerified: true,
    subscriptionTier: 'enterprise',
  },
}

// Mock token storage
export const authTokenKey = 'milestono_auth_token'
export const userKey = 'milestono_user'
