// ─── USER & AUTH ────────────────────────────────────────────────────────────
export type UserRole = 'investor' | 'developer' | 'admin'

export interface BaseUser {
  id: string
  email: string
  name: string
  phone?: string
  mobile?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export type User = BaseUser

export interface Investor extends BaseUser {
  role: 'investor'
  kycVerified: boolean
  portfolio?: Portfolio
  watchlist?: string[]
}

export interface Developer extends BaseUser {
  role: 'developer'
  companyName: string
  developerId: string // Ticker for developer
  website?: string
  verified: boolean
}

export interface Portfolio {
  totalInvested: number
  currentValue: number
  returns: number
  returnPercentage: number
  dayChange: number
  dayChangePct: number
}

export interface LoginResponse {
  token: string
  firebaseToken?: string
  user: Investor | Developer | BaseUser // Admin falls back to BaseUser
  expiresAt: number
}

// ─── PROPERTY ───────────────────────────────────────────────────────────────
export type PropertyType = 'residential' | 'commercial' | 'industrial' | 'mixed'
export type PropertyStatus = 'active' | 'inactive' | 'delisted' | 'coming_soon' | 'pending_approval' | 'rejected' | 'on_hold'

export interface PricePoint {
  date: Date
  price: number
}

export interface PropertyMarketData {
  currentPrice: number
  prevDayPrice: number
  change: number
  changePct: number
  weekHigh: number
  weekLow: number
  yearHigh: number
  yearLow: number
  volume: number        // units traded today
  marketCap: number     // totalUnits × currentPrice
  priceHistory: PricePoint[]
}

export interface RentalData {
  expectedYield: number     // % annual
  occupancyRate: number     // %
  rentalIncome: number      // ₹ annual (whole property)
}

export interface Property {
  globalId?: any
  priceHistory?: any
  specifications?: any
  unitsSold: number
  unitsOnHold?: number
  watchlistCount?: number
  id: string
  symbol: string              // e.g. "PRSN" — 4-letter stock-style ticker
  name: string
  type: PropertyType
  description?: string
  amenities?: string[]
  location: any
  address: string
  city: string
  state: string
  pincode: string
  totalUnits: number
  unitsAvailable: number
  unitPrice: number           // base/face value per unit
  marketData: PropertyMarketData
  rentalData: RentalData
  expectedYield: number
  occupancyRate: number
  status: PropertyStatus
  documents: {
    termsUrl?: string
    prospectusUrl?: string
    riskDisclosureUrl?: string
  }
  images?: string[]
  developerId: string         // Reference to developer
  basicDetails?: any
  investmentInfo?: any
  developerInfo?: any
  legalVerification?: any
  media?: any
  totalValue?: number
  adminMessage?: string | null
  viewCount: number
  listedAt: Date
  lastUpdated: Date
  createdAt?: any
  updatedAt?: any
}

// ─── APPRECIATION & PRICING ────────────────────────────────────────────────
export interface AppreciationSchedule {
  id: string
  propertyId: string
  percentage: number
  targetDate: Date
  basePrice: number
  targetPrice: number
  status: 'pending' | 'completed'
  createdAt: Date
  createdBy: string // Admin ID
}

// ─── INQUIRIES ─────────────────────────────────────────────────────────────
export interface Inquiry {
  id: string
  propertyId: string
  propertyTickerId: string
  developerId: string
  investorId: string
  investorName?: string
  message: string
  status: 'new' | 'read' | 'replied'
  createdAt: Date
}

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────
export type { NotificationType, AppNotification } from '../notifications'


// ─── INVESTMENT ─────────────────────────────────────────────────────────────
export type InvestmentStatus = 'active' | 'sold' | 'stopped'

export interface Investment {
  id: string
  userId: string
  propertyId: string
  property?: Property         // populated on fetch
  unitsOwned: number
  unitPrice: number           // entry price per unit
  amountInvested: number
  currentValue: number
  returns: number
  returnPercentage: number
  dayChange: number
  dayChangePct: number
  stopLossPrice?: number
  targetPrice?: number
  purchasedAt: Date
  status: InvestmentStatus
  [key: string]: any
}

// ─── TRANSACTION ─────────────────────────────────────────────────────────────
export type TransactionType = 'buy' | 'sell' | 'dividend'
export type TransactionStatus = 'pending' | 'pending_admin_approval' | 'pending_neft' | 'completed' | 'failed'

// ─── PAYOUTS ─────────────────────────────────────────────────────────────────
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'rejected'

export interface PayoutRequest {
  id: string
  developerId: string
  amountRequested: number
  platformFee: number // 2%
  gst: number // 3%
  netAmount: number
  status: PayoutStatus
  transactionIds: string[] // which completed transactions this payout covers
  bankDetails?: {
    accountName: string
    accountNumber: string
    ifscCode: string
    bankName: string
  }
  adminNotes?: string
  createdAt: Date
  updatedAt?: Date
}

export interface Transaction {
  id: string
  userId: string
  propertyId: string
  investorName?: string
  investorPhoto?: any
  propertyName?: string
  propertySymbol?: string
  type: TransactionType
  units: number
  unitPrice: number
  baseAmount: number
  gst: number
  totalAmount: number
  paymentMethod?: 'razorpay_direct' | 'neft_with_token'
  tokenAmountPaid?: number
  razorpayOrderId?: string
  razorpayPaymentId?: string
  neftDetails?: {
    utrNumber: string
    ifsc: string
    bankName: string
    proofImages: string[]
  }
  verifiedByAdmin?: boolean
  status: TransactionStatus
  timestamp: Date
  [key: string]: any
}

// ─── PRICE ALERT ─────────────────────────────────────────────────────────────
export type AlertType = 'above' | 'below'

export interface PriceAlert {
  id: string
  userId: string
  propertyId: string
  propertyName?: string
  propertySymbol?: string
  alertType: AlertType
  targetPrice: number
  currentPrice?: number
  triggered: boolean
  triggeredAt?: Date
  createdAt: Date
}

// ─── API ─────────────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface OrderBook {
  bids: Array<{ price: number; quantity: number }>
  asks: Array<{ price: number; quantity: number }>
}
