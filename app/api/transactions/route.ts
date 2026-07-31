import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, Transaction } from '@/lib/types'

// GET /api/transactions?userId=xxx&limit=20
export async function GET(req: NextRequest) {
  try {
    const { db } = await import('@/lib/firebase-admin')
    if (!db) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const userId = req.nextUrl.searchParams.get('userId')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '50', 10)

    if (!userId) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'userId required' }, { status: 400 })
    }

    const snapshot = await db.collection('transactions')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get()

    const txns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction))

    return NextResponse.json<ApiResponse<Transaction[]>>({ success: true, data: txns })
  } catch (err) {
    console.error('[Transactions] GET error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
