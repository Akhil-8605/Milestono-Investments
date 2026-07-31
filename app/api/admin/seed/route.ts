import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'
import { generatePriceHistory } from '@/lib/store/seed'
import { Property } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const firestore = db
    if (!firestore) return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 })

    const PROPERTY_DATA: Omit<Property, 'id' | 'marketData' | 'listedAt' | 'lastUpdated' | 'viewCount'>[] = [
      {
        name: 'Prestige Sunrise Park',
        symbol: 'PRSN',
        location: 'Whitefield',
        address: '14 Whitefield Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560066',
        type: 'residential',
        totalUnits: 500,
        unitsSold: 0,
        unitsAvailable: 183,
        unitPrice: 125000,
        rentalData: { expectedYield: 9.2, occupancyRate: 94, rentalIncome: 48000000 },
        expectedYield: 9.2,
        occupancyRate: 94,
        status: 'active',
        description: 'Premium gated community with 3 BHK apartments in Whitefield tech corridor. RERA registered, OC received.',
        amenities: ['Swimming Pool', 'Gym', 'Clubhouse', 'Security', 'Power Backup'],
        images: [],
        documents: { termsUrl: '/docs/terms.pdf', prospectusUrl: '/docs/prospectus.pdf', riskDisclosureUrl: '/docs/risk.pdf' },
        developerId: 'developer-1',
      },
      {
        name: 'Godrej BKC Heights',
        symbol: 'GDBK',
        location: 'BKC',
        address: 'G Block, Bandra Kurla Complex',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400051',
        type: 'commercial',
        totalUnits: 800,
        unitsSold: 0,
        unitsAvailable: 312,
        unitPrice: 285000,
        rentalData: { expectedYield: 7.8, occupancyRate: 97, rentalIncome: 182400000 },
        expectedYield: 7.8,
        occupancyRate: 97,
        status: 'active',
        description: 'Grade A commercial office space in India\'s prime business district. LEED platinum certified.',
        amenities: ['24/7 Security', 'Conference Rooms', 'Cafeteria', 'EV Charging', 'HVAC'],
        images: [],
        documents: { termsUrl: '/docs/terms.pdf', prospectusUrl: '/docs/prospectus.pdf', riskDisclosureUrl: '/docs/risk.pdf' },
        developerId: 'developer-1',
      },
      {
        name: 'DLF Capital Greens',
        symbol: 'DLCG',
        location: 'Shivaji Marg',
        address: 'Shivaji Marg, Moti Nagar',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110015',
        type: 'residential',
        totalUnits: 1200,
        unitsSold: 0,
        unitsAvailable: 445,
        unitPrice: 175000,
        rentalData: { expectedYield: 8.4, occupancyRate: 91, rentalIncome: 176400000 },
        expectedYield: 8.4,
        occupancyRate: 91,
        status: 'active',
        description: 'DLF\'s flagship residential project with world-class amenities across 35 acres.',
        amenities: ['Olympic Pool', 'Spa', 'Tennis Court', 'Jogging Track', 'Kids Zone'],
        images: [],
        documents: { termsUrl: '/docs/terms.pdf', prospectusUrl: '/docs/prospectus.pdf', riskDisclosureUrl: '/docs/risk.pdf' },
        developerId: 'developer-2',
      }
    ]

    const batch = firestore.batch()
    
    PROPERTY_DATA.forEach((p, i) => {
      const docRef = firestore.collection('properties').doc(p.symbol)
      const history = generatePriceHistory(p.unitPrice, 12)
      const currentPrice = history[history.length - 1].price
      const prevDayPrice = history[history.length - 2]?.price ?? currentPrice

      const property: Property = {
        ...p,
        id: p.symbol,
        marketData: {
          currentPrice,
          prevDayPrice,
          change: currentPrice - prevDayPrice,
          changePct: ((currentPrice - prevDayPrice) / prevDayPrice) * 100,
          weekHigh: Math.max(...history.slice(-7).map(h => h.price)),
          weekLow: Math.min(...history.slice(-7).map(h => h.price)),
          yearHigh: Math.max(...history.map(h => h.price)),
          yearLow: Math.min(...history.map(h => h.price)),
          volume: Math.floor(Math.random() * 5000) + 500,
          marketCap: currentPrice * p.totalUnits,
          priceHistory: history,
        },
        viewCount: 0,
        listedAt: new Date(Date.now() - (30 + i * 7) * 24 * 3600 * 1000),
        lastUpdated: new Date(),
      }
      
      batch.set(docRef, property)
    })

    await batch.commit()

    return NextResponse.json({ success: true, message: 'Seeded properties successfully' })
  } catch (err) {
    console.error('[Seed]', err)
    return NextResponse.json({ success: false, error: 'Failed to seed' }, { status: 500 })
  }
}
