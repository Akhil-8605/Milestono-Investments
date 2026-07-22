// ─── USER & AUTH ────────────────────────────────────────────────────────────
export type UserRole = 'investor' | 'developer' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: UserRole
  premium: boolean
  subscriptionTier?: 'free' | 'pro' | 'enterprise'
  kycVerified: boolean
  portfolio?: Portfolio
  watchlist?: string[]
  createdAt: Date
  updatedAt: Date
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
  user: User
  expiresAt: number
}

// ─── PROPERTY ───────────────────────────────────────────────────────────────
export type PropertyType = 'residential' | 'commercial' | 'industrial' | 'mixed'
export type PropertyStatus = 'active' | 'inactive' | 'delisted' | 'coming_soon'

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
  id: string
  symbol: string              // e.g. "PRSN" — 4-letter stock-style ticker
  name: string
  type: PropertyType
  description?: string
  amenities?: string[]
  location: string
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
  createdBy: string
  listedAt: Date
  lastUpdated: Date
}

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
}

// ─── TRANSACTION ─────────────────────────────────────────────────────────────
export type TransactionType = 'buy' | 'sell' | 'dividend'
export type TransactionStatus = 'pending' | 'completed' | 'failed'

export interface Transaction {
  id: string
  userId: string
  propertyId: string
  propertyName?: string
  propertySymbol?: string
  type: TransactionType
  units: number
  unitPrice: number
  baseAmount: number
  gst: number
  totalAmount: number
  razorpayOrderId?: string
  razorpayPaymentId?: string
  status: TransactionStatus
  timestamp: Date
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
