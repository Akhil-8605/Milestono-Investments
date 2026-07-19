import { Portfolio, Investment } from '@/lib/types'

/**
 * Calculate current portfolio value based on investments
 */
export function calculatePortfolioValue(investments: Investment[]): Portfolio {
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amountInvested, 0)
  const currentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0)
  const returns = currentValue - totalInvested
  const returnPercentage = totalInvested > 0 ? (returns / totalInvested) * 100 : 0

  return {
    totalInvested,
    currentValue,
    returns,
    returnPercentage,
    dayChange: 0,
    dayChangePct: 0,
  }
}

/**
 * Calculate unit value with GST
 */
export function calculateUnitCost(unitPrice: number, gstRate: number = 0.05): number {
  return unitPrice * (1 + gstRate)
}

/**
 * Calculate total investment amount
 */
export function calculateTotalInvestment(
  unitsToInvest: number,
  unitPrice: number,
  gstRate: number = 0.05
): {
  baseAmount: number
  gst: number
  total: number
} {
  const baseAmount = unitsToInvest * unitPrice
  const gst = baseAmount * gstRate
  const total = baseAmount + gst

  return {
    baseAmount,
    gst,
    total,
  }
}

/**
 * Calculate profit/loss
 */
export function calculateProfitLoss(
  currentPrice: number,
  entryPrice: number,
  units: number
): {
  profitLoss: number
  profitLossPercentage: number
} {
  const profitLoss = (currentPrice - entryPrice) * units
  const profitLossPercentage = entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0

  return {
    profitLoss,
    profitLossPercentage,
  }
}

/**
 * Calculate expected yield
 */
export function calculateExpectedYield(
  rentalIncome: number,
  propertyValue: number
): number {
  return propertyValue > 0 ? (rentalIncome / propertyValue) * 100 : 0
}

/**
 * Calculate yield with occupancy impact
 */
export function calculateEffectiveYield(
  baseYield: number,
  occupancyRate: number
): number {
  return baseYield * (occupancyRate / 100)
}

/**
 * Format currency (INR)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}
