import { useFormContext } from 'react-hook-form'
import { PropertyFormValues } from '@/lib/schemas/property'
import { Input } from '@/components/ui/input'
import { Wallet } from 'lucide-react'
import { useEffect } from 'react'
import { numberToIndianWords } from '@/lib/utils'

export default function InvestmentInfo() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<PropertyFormValues>()
  
  const totalPrice = watch('investmentInfo.totalPropertyPrice')
  const totalUnits = watch('investmentInfo.totalInvestmentUnits')
  const minimumInvestment = watch('investmentInfo.minimumInvestment')
  const rentalYield = watch('investmentInfo.rentalYield')
  
  useEffect(() => {
    if (totalPrice > 0 && totalUnits > 0) {
      // Unit price is calculated, but we don't necessarily need to store it in schema if it's derived,
      // but it's useful to show.
    }
  }, [totalPrice, totalUnits])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 text-primary border-b pb-4">
        <Wallet className="w-5 h-5" />
        <h2 className="text-lg font-semibold text-foreground">Investment Information</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Property Price (₹) *</label>
          <Input 
            {...register('investmentInfo.totalPropertyPrice', { valueAsNumber: true })} 
            type="number"
            placeholder="e.g. 50000000" 
            className="h-11 bg-muted/50 text-foreground"
          />
          <p className="text-[10px] text-primary">{totalPrice > 0 ? numberToIndianWords(totalPrice) : ''}</p>
          {errors.investmentInfo?.totalPropertyPrice && <p className="text-[10px] text-red-500">{errors.investmentInfo.totalPropertyPrice.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Investment Units *</label>
          <Input 
            {...register('investmentInfo.totalInvestmentUnits', { valueAsNumber: true })} 
            type="number"
            placeholder="e.g. 1000" 
            className="h-11 bg-muted/50 text-foreground"
          />
          <p className="text-[10px] text-primary">{totalUnits > 0 ? numberToIndianWords(totalUnits) : ''}</p>
          {errors.investmentInfo?.totalInvestmentUnits && <p className="text-[10px] text-red-500">{errors.investmentInfo.totalInvestmentUnits.message}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex flex-col items-center justify-center">
            <span className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Calculated Unit Price</span>
            <span className="text-2xl font-bold text-primary">
              ₹ {totalPrice > 0 && totalUnits > 0 ? Math.round(totalPrice / totalUnits).toLocaleString('en-IN') : '0'}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1">{totalPrice > 0 && totalUnits > 0 ? numberToIndianWords(Math.round(totalPrice / totalUnits)) : ''}</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Minimum Investment Units</label>
          <Input 
            {...register('investmentInfo.minimumInvestment', { valueAsNumber: true })} 
            type="number"
            placeholder="Default is 1" 
            className="h-11 bg-muted/50 text-foreground"
          />
          <p className="text-[10px] text-primary">{minimumInvestment > 0 ? numberToIndianWords(minimumInvestment) : ''}</p>
          {errors.investmentInfo?.minimumInvestment && <p className="text-[10px] text-red-500">{errors.investmentInfo.minimumInvestment.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Maximum Units Per Investor</label>
          <Input 
            {...register('investmentInfo.maximumUnitsPerInvestor', { valueAsNumber: true })} 
            type="number"
            placeholder="Optional limit" 
            className="h-11 bg-muted/50 text-foreground"
          />
          {errors.investmentInfo?.maximumUnitsPerInvestor && <p className="text-[10px] text-red-500">{errors.investmentInfo.maximumUnitsPerInvestor.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rental Yield (%)</label>
          <Input 
            {...register('investmentInfo.rentalYield', { valueAsNumber: true })} 
            type="number" step="0.1"
            placeholder="Optional e.g. 8.5" 
            className="h-11 bg-muted/50 text-foreground"
          />
          <p className="text-[10px] text-primary">{(rentalYield ?? 0) > 0 ? `${numberToIndianWords(Math.floor(rentalYield || 0))} Point ${numberToIndianWords(Math.round(((rentalYield || 0) % 1) * 10))} Percent` : ''}</p>
          {errors.investmentInfo?.rentalYield && <p className="text-[10px] text-red-500">{errors.investmentInfo.rentalYield.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expected Appreciation (%)</label>
          <Input 
            {...register('investmentInfo.expectedAppreciation', { valueAsNumber: true })} 
            type="number" step="0.1"
            placeholder="Optional e.g. 12" 
            className="h-11 bg-muted/50 text-foreground"
          />
          {errors.investmentInfo?.expectedAppreciation && <p className="text-[10px] text-red-500">{errors.investmentInfo.expectedAppreciation.message}</p>}
        </div>
      </div>
    </div>
  )
}
