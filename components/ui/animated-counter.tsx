'use client'

import React, { useEffect, useState } from 'react'

export function AnimatedCounter({ value, label, containerClassName }: { value: string; label: string; containerClassName?: string }) {
  return (
    <div className={containerClassName || "bg-card border border-border rounded-xl p-5 text-center flex flex-col items-center justify-center"}>
      <AnimatedNumber value={value} />
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}

export function AnimatedNumber({ value }: { value: string }) {
  return (
    <div className="text-2xl font-bold text-foreground font-mono flex items-center h-[32px] overflow-hidden">
      {value.split('').map((char, i) => {
        if (!/[0-9]/.test(char)) {
          return (
            <span key={i} className="flex items-center h-[32px]">
              {char}
            </span>
          )
        }
        return <Digit key={i} targetDigit={parseInt(char)} />
      })}
    </div>
  )
}

function Digit({ targetDigit }: { targetDigit: number }) {
  const [currentDigit, setCurrentDigit] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setCurrentDigit(targetDigit), 50)
    return () => clearTimeout(t)
  }, [targetDigit])

  return (
    <span className="relative inline-flex flex-col h-[32px] overflow-hidden w-[14px] align-bottom">
      <span
        className="flex flex-col transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateY(-${currentDigit * 10}%)` }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="h-[32px] flex items-center justify-center">
            {n}
          </span>
        ))}
      </span>
    </span>
  )
}
