import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, LoginResponse } from '@/lib/types'

const MILESTONO_API = process.env.BASE_URL || 'https://api.milestono.com:6005'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Call the external Milestono auth API via isolated investor routes
    let externalRes: Response
    try {
      externalRes = await fetch(`${MILESTONO_API}/api/investors/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(20000),
      })
    } catch (fetchErr) {
      console.warn('[Auth] External API unreachable:', fetchErr)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Authentication service unavailable' },
        { status: 503 }
      )
    }

    if (!externalRes.ok) {
      const errData = await externalRes.json().catch(() => ({}))
      return NextResponse.json<ApiResponse>(
        { success: false, error: errData?.error || 'Invalid credentials' },
        { status: externalRes.status }
      )
    }

    const data: LoginResponse = await externalRes.json()

    // Set httpOnly auth cookie
    const response = NextResponse.json<ApiResponse<LoginResponse>>({
      success: true,
      data,
    })

    response.cookies.set('milestono_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24h
      path: '/',
    })

    return response
  } catch (err) {
    console.error('[Auth] Login error:', err)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Authentication service unavailable' },
      { status: 500 }
    )
  }
}


