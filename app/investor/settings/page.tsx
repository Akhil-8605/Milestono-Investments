'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/shell/app-layout'
import { Bell, Lock, Eye, Mail, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function InvestorSettingsPage() {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>

        {/* Profile Section */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-foreground">Profile Information</h2>

          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary to-blue-800 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">AJ</span>
            </div>
            <Button className="bg-primary hover:bg-blue-600 text-white">
              Change Avatar
            </Button>
          </div>

          <div className="space-y-4">
            {['First Name', 'Last Name', 'Email', 'Phone'].map((label) => (
              <div key={label}>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  {label}
                </label>
                <Input
                  disabled={!isEditing}
                  placeholder={`Enter ${label.toLowerCase()}`}
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

        {/* Notifications */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-foreground">Notification Preferences</h2>

          <div className="space-y-4">
            {[
              { label: 'Email Notifications', icon: Mail, description: 'Receive alerts via email' },
              { label: 'SMS Notifications', icon: Smartphone, description: 'Receive alerts via SMS' },
              { label: 'Price Alerts', icon: Bell, description: 'Get notified on price changes' },
              { label: 'Order Updates', icon: Bell, description: 'Order status updates' },
            ].map(({ label, icon: Icon, description }) => (
              <div key={label} className="flex items-center justify-between p-4 bg-card rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon size={20} className="text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 cursor-pointer"
                />
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

          {/* Two Factor */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between p-4 bg-card rounded-lg">
              <div>
                <p className="font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Enhance your account security</p>
              </div>
              <Button className="bg-primary hover:bg-blue-600 text-white px-4">
                Enable
              </Button>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-foreground">Privacy</h2>

          <div className="space-y-3">
            {['Make profile public', 'Show portfolio to others', 'Allow messages'].map((item) => (
              <div key={item} className="flex items-center justify-between p-4 bg-card rounded-lg">
                <label className="text-muted-foreground cursor-pointer">{item}</label>
                <input type="checkbox" className="w-5 h-5 cursor-pointer" />
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-loss/10 border border-loss/30 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-loss">Danger Zone</h2>

          <div className="space-y-2">
            <Button className="w-full bg-loss/20 hover:bg-loss/30 text-loss border border-loss/40">
              Download My Data
            </Button>
            <Button className="w-full bg-loss hover:bg-red-600 text-white">
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
