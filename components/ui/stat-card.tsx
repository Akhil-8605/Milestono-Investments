import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  change?: string
  changePositive?: boolean
  sub?: string
  className?: string
  icon?: React.ReactNode
  highlight?: boolean
}

export function StatCard({ label, value, change, changePositive, sub, className, icon, highlight }: StatCardProps) {
  return (
    <div className={cn(
      'rounded-lg border p-4 space-y-2',
      highlight
        ? 'bg-primary/20 border-primary/30'
        : 'bg-card border-border',
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="text-foreground text-xl font-bold num">{value}</div>
      <div className="flex items-center gap-2">
        {change !== undefined && (
          <span className={cn(
            'flex items-center gap-0.5 text-xs font-medium',
            changePositive === undefined ? 'text-muted-foreground' :
            changePositive ? 'text-gain' : 'text-loss'
          )}>
            {changePositive === true && <TrendingUp size={11} />}
            {changePositive === false && <TrendingDown size={11} />}
            {change}
          </span>
        )}
        {sub && <span className="text-muted-foreground text-[11px]">{sub}</span>}
      </div>
    </div>
  )
}
