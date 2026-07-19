'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/shell/app-layout'
import { ImageGallery } from '@/components/gallery/image-gallery'
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Heart, Share2, TrendingUp, TrendingDown, Bell, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const mockProperty = {
  id: '1',
  symbol: 'DOWNOFC',
  name: 'Downtown Office Complex',
  location: 'Mumbai, Maharashtra',
  type: 'commercial',
  currentPrice: 10500,
  openPrice: 10200,
  highPrice: 10800,
  lowPrice: 10100,
  dayChange: 300,
  dayChangePercent: 2.94,
  yearHigh: 12000,
  yearLow: 8500,
  
  // Dividend Info
  dividend: 450,
  dividendYield: 4.29,
  exDividendDate: '2024-02-01',
  paymentDate: '2024-02-15',
  
  // Availability
  totalUnits: 1000,
  soldUnits: 650,
  availableUnits: 350,
  reservedUnits: 0,
  
  // Financial
  yield: 8.5,
  roi: 12.5,
  occupancy: 85,
  monthlyRent: 2500000,
  totalInvestment: 50000000,
  
  // Charts
  priceHistory: [
    { date: 'Jan 1', price: 9800 },
    { date: 'Jan 5', price: 9950 },
    { date: 'Jan 10', price: 10100 },
    { date: 'Jan 15', price: 10200 },
    { date: 'Jan 20', price: 10350 },
    { date: 'Jan 25', price: 10500 },
  ],
  
  images: [
    { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200', caption: 'Exterior View' },
    { url: 'https://images.unsplash.com/photo-1497366216548-37519c06fe5d?w=1200', caption: 'Main Lobby' },
    { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200', caption: 'Office Floors' },
    { url: 'https://images.unsplash.com/photo-1497366811353-6798859d07d5?w=1200', caption: 'Parking' },
  ],

  description: 'A premium commercial office complex in the heart of downtown Mumbai with state-of-the-art facilities and high occupancy rates.',
  highlights: [
    'LEED Gold Certified',
    '24/7 Security',
    'On-site parking',
    'High-speed internet',
    'Central AC',
    'Conference facilities',
  ],
}

const orderBookData = {
  bids: [
    { price: 10490, quantity: 150, total: 1573500 },
    { price: 10480, quantity: 200, total: 2096000 },
    { price: 10470, quantity: 300, total: 3141000 },
  ],
  asks: [
    { price: 10510, quantity: 100, total: 1051000 },
    { price: 10520, quantity: 250, total: 2630000 },
    { price: 10530, quantity: 200, total: 2106000 },
  ],
}

export default function PropertyDetailPage() {
  const [quantity, setQuantity] = useState(1)
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy')

  const totalCost = quantity * mockProperty.currentPrice

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with Price */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl font-bold font-mono text-primary">
                  {mockProperty.symbol}
                </span>
                <span className={cn(
                  'px-3 py-1 rounded text-xs font-bold',
                  mockProperty.dayChangePercent >= 0
                    ? 'bg-green-500/10 text-gain'
                    : 'bg-loss/10 text-loss'
                )}>
                  {mockProperty.dayChangePercent >= 0 ? '+' : ''}{mockProperty.dayChangePercent}%
                </span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">{mockProperty.name}</h1>
              <p className="text-muted-foreground">{mockProperty.location}</p>
            </div>
            <div className="flex gap-2">
              <Button className="p-2 bg-card border border-border hover:border-primary/40">
                <Heart size={20} className="text-muted-foreground" />
              </Button>
              <Button className="p-2 bg-card border border-border hover:border-primary/40">
                <Share2 size={20} className="text-muted-foreground" />
              </Button>
              <Button className="p-2 bg-card border border-border hover:border-primary/40">
                <Bell size={20} className="text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Price Display */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Current Price', value: `₹${mockProperty.currentPrice.toLocaleString()}` },
              { label: 'Day Change', value: `₹${mockProperty.dayChange} (${mockProperty.dayChangePercent}%)`, color: mockProperty.dayChangePercent >= 0 ? '#22c55e' : '#ef4444' },
              { label: '52W High', value: `₹${mockProperty.yearHigh.toLocaleString()}` },
              { label: '52W Low', value: `₹${mockProperty.yearLow.toLocaleString()}` },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 bg-card rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className="font-mono font-bold text-lg" style={{ color: color || '#e8eaed' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images and Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <ImageGallery images={mockProperty.images} title="Property Photos" />

            {/* Price Chart */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Price History</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockProperty.priceHistory}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                    formatter={(val) => `₹${val}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Order Book */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-foreground">Order Book</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Bids */}
                <div>
                  <h4 className="text-sm font-semibold text-gain mb-3">BIDS</h4>
                  <div className="space-y-1">
                    {orderBookData.bids.map((bid, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 bg-card rounded">
                        <span className="text-gain font-mono">₹{bid.price}</span>
                        <span className="text-muted-foreground">{bid.quantity}</span>
                        <span className="text-muted-foreground">₹{bid.total.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Asks */}
                <div>
                  <h4 className="text-sm font-semibold text-loss mb-3">ASKS</h4>
                  <div className="space-y-1">
                    {orderBookData.asks.map((ask, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 bg-card rounded">
                        <span className="text-loss font-mono">₹{ask.price}</span>
                        <span className="text-muted-foreground">{ask.quantity}</span>
                        <span className="text-muted-foreground">₹{ask.total.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-foreground">About this Property</h3>
              <p className="text-muted-foreground">{mockProperty.description}</p>

              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Highlights</p>
                <div className="grid grid-cols-2 gap-2">
                  {mockProperty.highlights.map((highlight) => (
                    <div key={highlight} className="flex items-center gap-2 p-2 bg-card rounded text-sm text-muted-foreground">
                      <span>✓</span>
                      {highlight}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Metrics and Order Form */}
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-foreground">Key Metrics</h3>

              {[
                { label: 'Annual Yield', value: `${mockProperty.yield}%`, icon: TrendingUp },
                { label: 'Expected ROI', value: `${mockProperty.roi}%`, icon: TrendingUp },
                { label: 'Occupancy Rate', value: `${mockProperty.occupancy}%`, icon: TrendingUp },
                { label: 'Monthly Rent', value: `₹${(mockProperty.monthlyRent / 1000000).toFixed(1)}M`, icon: TrendingUp },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between p-3 bg-card rounded">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-primary" />
                    <span className="text-sm text-muted-foreground">{label}</span>
                  </div>
                  <span className="font-bold text-foreground">{value}</span>
                </div>
              ))}
            </div>

            {/* Dividend Info */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-foreground">Dividend Info</h3>

              {[
                { label: 'Dividend per Unit', value: `₹${mockProperty.dividend}` },
                { label: 'Dividend Yield', value: `${mockProperty.dividendYield}%` },
                { label: 'Ex-Dividend Date', value: mockProperty.exDividendDate },
                { label: 'Payment Date', value: mockProperty.paymentDate },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between p-3 bg-card rounded">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="font-bold text-foreground">{value}</span>
                </div>
              ))}
            </div>

            {/* Availability */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-foreground">Availability</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Units</span>
                  <span className="font-bold text-foreground">{mockProperty.totalUnits.toLocaleString()}</span>
                </div>
                <div className="w-full bg-card rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-gain"
                    style={{ width: `${(mockProperty.soldUnits / mockProperty.totalUnits) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gain">Sold: {mockProperty.soldUnits.toLocaleString()} ({((mockProperty.soldUnits / mockProperty.totalUnits) * 100).toFixed(0)}%)</span>
                  <span className="text-muted-foreground">Available: {mockProperty.availableUnits.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Order Form */}
            <div className="bg-gradient-to-b from-primary/20 to-card border border-primary/30 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-foreground">Place Order</h3>

              {/* Order Type Tabs */}
              <div className="flex gap-2">
                {(['buy', 'sell'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    className={cn(
                      'flex-1 py-2 rounded-lg font-semibold text-sm transition-colors',
                      orderType === type
                        ? type === 'buy'
                          ? 'bg-gain text-white'
                          : 'bg-loss text-white'
                        : 'bg-card text-muted-foreground'
                    )}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  Quantity (Units)
                </label>
                <Input
                  type="number"
                  min="1"
                  max={orderType === 'buy' ? mockProperty.availableUnits : 1000}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="bg-card border-border"
                />
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-2 p-3 bg-card rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Unit Price</span>
                  <span className="font-mono">₹{mockProperty.currentPrice.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-mono">{quantity}</span>
                </div>
                <div className="border-t border-border pt-2 flex items-center justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-mono font-bold text-lg text-primary">
                    ₹{totalCost.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                className={cn(
                  'w-full text-white font-semibold',
                  orderType === 'buy'
                    ? 'bg-gain hover:bg-[#16a34a]'
                    : 'bg-loss hover:bg-red-600'
                )}
              >
                {orderType === 'buy' ? 'Buy Now' : 'Sell Now'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
