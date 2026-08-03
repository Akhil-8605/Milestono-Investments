import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export type NotificationType = 
  | 'property_rejected'
  | 'property_approved'
  | 'investor_inquiry'
  | 'investor_watchlisted'
  | 'developer_reply'
  | 'developer_message'
  | 'investment_received'
  | 'order_placed'
  | 'payment_successful'
  | 'neft_submitted'
  | 'neft_on_hold'
  | 'watchlist_alert'
  | 'transaction_approved'
  | 'transaction_rejected'
  | 'payout_approved'
  | 'payout_rejected'
  | 'general'

export interface AppNotification {
  id?: string
  userId: string
  role: 'developer' | 'investor' | 'admin'
  type: NotificationType
  title: string
  message: string
  read: boolean
  metadata?: any
  createdAt: any
}

export async function createNotification(
  userId: string,
  role: 'developer' | 'investor' | 'admin',
  type: NotificationType,
  title: string,
  message: string,
  metadata?: any
) {
  if (!userId) {
    console.warn('createNotification called with invalid or undefined userId. Skipping notification creation.', { role, type, title })
    return
  }

  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      role: role || 'investor',
      type: type || 'general',
      title: title || 'Notification',
      message: message || '',
      read: false,
      metadata: metadata || null,
      createdAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Failed to create notification', error)
  }
}
