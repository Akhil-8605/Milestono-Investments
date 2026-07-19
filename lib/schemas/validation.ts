import { z } from 'zod'

// Auth Validation
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// Investment Validation
export const InvestmentSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  units: z.number().int().positive('Units must be positive'),
})

export const PriceAlertSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  alertType: z.enum(['above', 'below']),
  targetPrice: z.number().positive('Target price must be positive'),
})

export const StopLossSchema = z.object({
  investmentId: z.string().min(1, 'Investment is required'),
  stopLossPrice: z.number().positive('Stop loss price must be positive'),
})

export const TargetGainsSchema = z.object({
  investmentId: z.string().min(1, 'Investment is required'),
  targetPrice: z.number().positive('Target price must be positive'),
})

// Property Validation (Developer)
export const PropertySchema = z.object({
  name: z.string().min(3, 'Property name must be at least 3 characters'),
  location: z.string().min(2, 'Location is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{5,6}$/, 'Invalid pincode'),
  totalUnits: z.number().int().positive('Total units must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  expectedYield: z.number().min(0).max(100, 'Yield must be between 0-100%'),
  occupancyRate: z.number().min(0).max(100, 'Occupancy must be between 0-100%'),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type InvestmentInput = z.infer<typeof InvestmentSchema>
export type PriceAlertInput = z.infer<typeof PriceAlertSchema>
export type PropertyInput = z.infer<typeof PropertySchema>
