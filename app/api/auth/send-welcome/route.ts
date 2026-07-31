import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const { email, name, role } = await req.json()

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({ success: true, message: 'SMTP credentials missing, skipped email' })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const investorContent = `
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
        Thank you for registering with <strong>Milestono Investments</strong> — India's premier fractional real estate exchange. Your onboarding is now complete!
      </p>
      <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #0ea5e9; margin-bottom: 24px;">
        <h3 style="color: #0f172a; font-size: 16px; margin-top: 0;">How to Start Investing:</h3>
        <ul style="color: #475569; font-size: 13px; line-height: 1.6; padding-left: 16px; margin-bottom: 0;">
          <li><strong>Browse Properties:</strong> Explore Grade-A commercial and residential properties on our platform.</li>
          <li><strong>Fractional Ownership:</strong> Invest starting from as low as ₹35,000 in prime real estate.</li>
          <li><strong>Earn Yields:</strong> Enjoy monthly rental yields directly credited to your bank account.</li>
          <li><strong>Liquidate Anytime:</strong> Trade your fractional tokens on our exchange for seamless liquidity.</li>
        </ul>
      </div>
      <p style="color: #0ea5e9; font-size: 14px; font-weight: 600; text-align: center; margin-bottom: 24px;">
        <a href="https://investments.milestono.com/investor/dashboard" style="color: #0ea5e9; text-decoration: none;">Go to your Investor Dashboard</a>
      </p>
    `

    const developerContent = `
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
        Thank you for registering your company with <strong>Milestono Investments</strong>. Your developer profile has been successfully activated!
      </p>
      <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #8b5cf6; margin-bottom: 24px;">
        <h3 style="color: #0f172a; font-size: 16px; margin-top: 0;">Next Steps for Developers:</h3>
        <ul style="color: #475569; font-size: 13px; line-height: 1.6; padding-left: 16px; margin-bottom: 0;">
          <li><strong>List Properties:</strong> Submit your commercial or residential projects for tokenization.</li>
          <li><strong>Raise Capital:</strong> Access our network of verified investors to raise fractional capital efficiently.</li>
          <li><strong>Manage Yields:</strong> Disburse rental yields and track property performance seamlessly.</li>
          <li><strong>Expand Reach:</strong> Gain visibility and credibility by listing on a SEBI & RERA compliant platform.</li>
        </ul>
      </div>
      <p style="color: #8b5cf6; font-size: 14px; font-weight: 600; text-align: center; margin-bottom: 24px;">
        <a href="https://investments.milestono.com/developer/dashboard" style="color: #8b5cf6; text-decoration: none;">Go to your Developer Dashboard</a>
      </p>
    `

    const bodyContent = role === 'developer' ? developerContent : investorContent

    transporter.sendMail({
      from: `"Milestono Investments" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to Milestono Investments!',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
          <div style="margin-bottom: 24px; text-align: center;">
            <h1 style="color: #0ea5e9; font-size: 28px; font-weight: 800; margin: 0;">Milestono Investments</h1>
          </div>
          <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-bottom: 12px;">Welcome,  ${name || 'User'}! 👋</h2>
          ${bodyContent}
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">If you did not request this email, please ignore it.</p>
        </div>
      `
    })

    return NextResponse.json({ success: true, message: 'Welcome email sent successfully' })
  } catch (err: any) {
    console.error('[Welcome Email Error]', err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to send welcome email' }, { status: 500 })
  }
}

