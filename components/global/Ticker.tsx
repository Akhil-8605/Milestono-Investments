'use client'

import { useEffect, useState } from 'react'
import { Property } from '@/lib/types'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function Ticker() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'properties'), where('status', '==', 'active'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeProps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Property[]
      setProperties(activeProps)
      setLoading(false)
    }, (error) => {
      console.error('[Ticker] Realtime Error:', error)
      setLoading(false)
    })
    
    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="bg-sidebar border-b border-border py-2 overflow-hidden h-[34px] flex items-center justify-center">
        <span className="text-[11px] text-muted-foreground font-mono">Loading market data...</span>
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="bg-sidebar border-b border-border py-2 overflow-hidden h-[34px] flex items-center justify-center">
        <span className="text-[11px] text-muted-foreground font-mono">No active properties currently on the market</span>
      </div>
    )
  }

  // No duplicates, scrolling from right to left across the screen
  const items = properties

  return (
    <div className="bg-sidebar border-b border-border py-2 overflow-hidden flex w-full">
      <div className="flex items-center gap-8 w-max px-4 ticker-animate">
        {items.map((p, i) => {
          const price = p.marketData?.currentPrice || p.unitPrice || 0
          const change = p.marketData?.change || 0
          const changePct = p.marketData?.changePct || 0
          const up = change >= 0
          return (
            <span key={`${p.id}-${i}`} className="flex items-center gap-1 text-xs shrink-0 mx-3">
              <span className="text-muted-foreground font-medium">{p.symbol}</span>
              <span className={up ? 'text-emerald-500 flex items-center gap-0.5' : 'text-rose-500 flex items-center gap-0.5'}>
                {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                ₹{price.toLocaleString('en-IN')}
                <span className="ml-1 text-[10px]">({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)</span>
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
