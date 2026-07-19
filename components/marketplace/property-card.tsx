import { Property } from '@/lib/types'
import { formatCurrency, formatPercentage } from '@/lib/calculations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

interface PropertyCardProps {
  property: Property
}

export function PropertyCard({ property }: PropertyCardProps) {
  const occupancyPercentage = formatPercentage(property.occupancyRate)
  const yieldPercentage = formatPercentage(property.expectedYield)

  return (
    <Link href={`/investor/properties/${property.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
        {/* Image Placeholder */}
        <div className="h-48 bg-gradient-to-br from-muted to-muted-foreground flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-4xl mb-2">🏢</div>
            <p className="text-sm">{property.city}</p>
          </div>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="line-clamp-2">{property.name}</CardTitle>
              <CardDescription className="line-clamp-1 text-xs mt-1">
                {property.location}, {property.city}
              </CardDescription>
            </div>
            <Badge
              variant={property.status === 'active' ? 'default' : 'secondary'}
              className="shrink-0"
            >
              {property.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Price and Units */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Unit Price</p>
              <p className="font-semibold text-sm">{formatCurrency(property.unitPrice)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Available</p>
              <p className="font-semibold text-sm">{property.unitsAvailable} units</p>
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Expected Yield</span>
              <div className="flex items-center gap-1 text-sm font-semibold text-accent">
                <TrendingUp size={14} />
                {yieldPercentage}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Occupancy</span>
              <span className="text-sm font-semibold">{occupancyPercentage}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Units Sold</span>
              <span className="font-medium">
                {property.totalUnits - property.unitsAvailable}/{property.totalUnits}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{
                  width: `${(
                    ((property.totalUnits - property.unitsAvailable) / property.totalUnits) *
                    100
                  ).toFixed(0)
                }%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
