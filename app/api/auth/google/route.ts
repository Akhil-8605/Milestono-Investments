import { NextResponse } from 'next/server'

export async function GET() {
  const MILESTONO_API = process.env.BASE_URL || 'https://api.milestono.com'
  return NextResponse.redirect(`${MILESTONO_API}/api/investors/auth/google`)
}
