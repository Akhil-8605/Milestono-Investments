import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded, transactionsStore } from '@/lib/store/data'
import { ApiResponse, Transaction } from '@/lib/types'

// GET /api/transactions?userId=xxx&limit=20
export async function GET(req: NextRequest) {
  try {
    ensureSeeded()
    const userId = req.nextUrl.searchParams.get('userId')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '50', 10)

    if (!userId) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'userId required' }, { status: 400 })
    }

    const txns = Array.from(transactionsStore.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return NextResponse.json<ApiResponse<Transaction[]>>({ success: true, data: txns })
  } catch (err) {
    console.error('[Transactions] GET error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
