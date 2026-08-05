'use client'

import { ArrowUpRight, Building2, CheckCircle2, LineChart, ShieldCheck, WalletCards } from 'lucide-react'
import './FractionalSection.css'

export default function FractionalSection() {
  return (
    <section className="fractional-teaser" aria-labelledby="fractional-teaser-title">
      <div className="fractional-teaser__glow" aria-hidden="true" />
      <div className="fractional-teaser__copy">
        <span className="fractional-kicker"><span className="fractional-live-dot" /> New on Milestono</span>
        <h2 id="fractional-teaser-title">Own a fractional unit in the city&apos;s best real estate.</h2>
        <p>Buy fractional units that represent a defined share of a property opportunity, with transparent performance data and potential rental distributions.</p>
        <div className="fractional-teaser__checks">
          <span><CheckCircle2 size={15} /> Fractional units from ₹35,000</span>
          <span><CheckCircle2 size={15} /> Proportional income potential</span>
          <span><CheckCircle2 size={15} /> Curated by experts</span>
        </div>
        <a className="fractional-button fractional-button--primary" href="/fractional">Explore fractional investing <ArrowUpRight size={16} /></a>
      </div>
      <div className="fractional-teaser__visual" aria-label="Illustrative performance snapshot">
        <div className="fractional-teaser__visual-head"><span><Building2 size={15} /> Harbour One · Mumbai</span><span className="fractional-status">Illustrative</span></div>
        <div className="fractional-teaser__value"><strong>₹48,260</strong><span>+12.84% <ArrowUpRight size={13} /></span></div>
        <svg className="fractional-mini-chart" viewBox="0 0 520 170" role="img" aria-label="Illustrative upward property performance chart" preserveAspectRatio="none">
          <defs><linearGradient id="miniArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#38bdf8" stopOpacity=".28" /><stop offset="1" stopColor="#38bdf8" stopOpacity="0" /></linearGradient></defs>
          <path className="fractional-chart-grid" d="M0 35H520M0 85H520M0 135H520" />
          <path className="fractional-chart-area" d="M0 144C45 136 61 132 91 137S137 119 164 123S211 105 235 112S281 88 309 97S351 72 378 79S417 56 447 65S488 30 520 25V170H0Z" />
          <path className="fractional-chart-line" d="M0 144C45 136 61 132 91 137S137 119 164 123S211 105 235 112S281 88 309 97S351 72 378 79S417 56 447 65S488 30 520 25" />
          <circle className="fractional-chart-point" cx="520" cy="25" r="5" />
        </svg>
        <div className="fractional-teaser__metrics"><span><small>Rental yield</small><b>8.6%</b></span><span><small>Unit holders</small><b>1,248</b></span><span><small>Last distribution</small><b>₹342</b></span></div>
        <div className="fractional-teaser__note"><LineChart size={16} /><span>Illustrative data. Track every unit, distribution, and price movement in one view.</span></div>
      </div>
    </section>
  )
}
