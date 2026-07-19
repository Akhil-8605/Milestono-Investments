'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { Bell, Lock, Eye, Mail, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function DevSettingsPage() {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your developer account and business settings</p>
        </div>

        {/* Company Profile */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-foreground">Company Profile</h2>

          <div className="space-y-4">
            {[
              { label: 'Company Name', placeholder: 'Acme Real Estate' },
              { label: 'Business Registration Number', placeholder: 'REG-2023-001234' },
              { label: 'Phone', placeholder: '+91-9876543210' },
              { label: 'Email', placeholder: 'contact@acmerealestate.com' },
              { label: 'Website', placeholder: 'https://acmerealestate.com' },
              { label: 'Address', placeholder: 'Mumbai, Maharashtra' },
            ].map(({ label, placeholder }) => (
              <div key={label}>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  {label}
                </label>
                <Input
                  disabled={!isEditing}
                  placeholder={placeholder}
                  className="bg-card border-border disabled:opacity-50"
                />
              </div>
            ))}
          </div>

          <Button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-primary hover:bg-blue-600 text-white w-full"
          >
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </Button>
        </div>

        {/* Bank Details */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-foreground">Payout Details</h2>

          <div className="space-y-4">
            {[
              { label: 'Bank Name', placeholder: 'Enter bank name' },
              { label: 'Account Holder', placeholder: 'Enter account holder name' },
              { label: 'Account Number', placeholder: 'Enter account number' },
              { label: 'IFSC Code', placeholder: 'Enter IFSC code' },
              { label: 'PAN Number', placeholder: 'Enter PAN number' },
            ].map(({ label, placeholder }) => (
              <div key={label}>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  {label}
                </label>
                <Input
                  placeholder={placeholder}
                  className="bg-card border-border"
                />
              </div>
            ))}
          </div>

          <Button className="w-full bg-primary hover:bg-blue-600 text-white">
            Verify Bank Account
          </Button>
        </div>

        {/* KYC & Documents */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-foreground">KYC & Documents</h2>

          <div className="space-y-4">
            {[
              { doc: 'Business Registration Certificate', status: 'verified', date: '2023-06-15' },
              { doc: 'PAN Card', status: 'verified', date: '2023-06-15' },
              { doc: 'GST Certificate', status: 'pending', date: null },
              { doc: 'Auditor Certificate', status: 'pending', date: null },
            ].map(({ doc, status, date }) => (
              <div
                key={doc}
                className="flex items-center justify-between p-4 bg-card rounded-lg"
              >
                <div>
                  <p className="font-medium text-foreground">{doc}</p>
                  {date && <p className="text-xs text-muted-foreground">Verified on {date}</p>}
                </div>
                <span
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    status === 'verified'
                      ? 'bg-green-500/10 text-gain'
                      : 'bg-yellow-500/10 text-yellow-500'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-foreground">Notification Preferences</h2>

          <div className="space-y-4">
            {[
              { label: 'New Investor Enquiries', icon: Mail },
              { label: 'Property Performance Alerts', icon: Bell },
              { label: 'Payment Notifications', icon: Bell },
              { label: 'System Updates', icon: Bell },
            ].map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between p-4 bg-card rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon size={18} className="text-primary" />
                  <p className="text-muted-foreground">{label}</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 cursor-pointer" />
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-foreground">Security</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Current Password
              </label>
              <Input
                type="password"
                placeholder="Enter current password"
                className="bg-card border-border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                New Password
              </label>
              <Input
                type="password"
                placeholder="Enter new password"
                className="bg-card border-border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Confirm Password
              </label>
              <Input
                type="password"
                placeholder="Confirm new password"
                className="bg-card border-border"
              />
            </div>

            <Button className="w-full bg-primary hover:bg-blue-600 text-white">
              <Lock size={16} className="mr-2" />
              Update Password
            </Button>
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-foreground">API Keys</h2>

          <div className="space-y-3">
            {[
              { key: 'sk_live_abcdefghijk123456', status: 'active', created: '2024-01-01' },
              { key: 'sk_test_xyz123abc', status: 'test', created: '2024-01-05' },
            ].map(({ key, status, created }) => (
              <div key={key} className="p-4 bg-card rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm text-muted-foreground">
                    {key.slice(0, 15)}...{key.slice(-5)}
                  </p>
                  <p className="text-xs text-muted-foreground">Created: {created}</p>
                </div>
                <Button className="bg-card border border-border hover:border-loss/40 text-muted-foreground p-2">
                  Revoke
                </Button>
              </div>
            ))}
          </div>

          <Button className="w-full bg-primary hover:bg-blue-600 text-white">
            Generate New Key
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="bg-loss/10 border border-loss/30 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-loss">Danger Zone</h2>

          <Button className="w-full bg-loss hover:bg-red-600 text-white">
            Suspend Account
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
