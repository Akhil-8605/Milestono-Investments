'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const user = localStorage.getItem('milestono_user')
    if (user) {
      setUserRole(JSON.parse(user).role)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('milestono_auth_token')
    localStorage.removeItem('milestono_user')
    router.push('/auth/login')
  }

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary text-white flex items-center justify-center font-bold">
              M
            </div>
            <span className="font-bold text-lg">Milestono</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {userRole === 'investor' && (
              <>
                <Link href="/investor/dashboard">
                  <Button
                    variant={isActive('/investor/dashboard') ? 'default' : 'ghost'}
                    size="sm"
                  >
                    Dashboard
                  </Button>
                </Link>
                <Link href="/investor/marketplace">
                  <Button
                    variant={isActive('/investor/marketplace') ? 'default' : 'ghost'}
                    size="sm"
                  >
                    Properties
                  </Button>
                </Link>
                <Link href="/investor/watchlist">
                  <Button
                    variant={isActive('/investor/watchlist') ? 'default' : 'ghost'}
                    size="sm"
                  >
                    Watchlist
                  </Button>
                </Link>
              </>
            )}
            {userRole === 'developer' && (
              <>
                <Link href="/developer/dashboard">
                  <Button
                    variant={isActive('/developer/dashboard') ? 'default' : 'ghost'}
                    size="sm"
                  >
                    Console
                  </Button>
                </Link>
                <Link href="/developer/properties">
                  <Button
                    variant={isActive('/developer/properties') ? 'default' : 'ghost'}
                    size="sm"
                  >
                    My Properties
                  </Button>
                </Link>
                <Link href="/developer/create">
                  <Button
                    variant={isActive('/developer/create') ? 'default' : 'ghost'}
                    size="sm"
                  >
                    List Property
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-2">
            {userRole && (
              <>
                <span className="text-sm text-muted-foreground capitalize px-3 py-2">
                  {userRole}
                </span>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  Logout
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && userRole && (
          <nav className="md:hidden mt-4 space-y-2 pb-4">
            {userRole === 'investor' && (
              <>
                <Link href="/investor/dashboard">
                  <Button variant="ghost" className="w-full justify-start">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/investor/marketplace">
                  <Button variant="ghost" className="w-full justify-start">
                    Properties
                  </Button>
                </Link>
                <Link href="/investor/watchlist">
                  <Button variant="ghost" className="w-full justify-start">
                    Watchlist
                  </Button>
                </Link>
              </>
            )}
            {userRole === 'developer' && (
              <>
                <Link href="/developer/dashboard">
                  <Button variant="ghost" className="w-full justify-start">
                    Console
                  </Button>
                </Link>
                <Link href="/developer/properties">
                  <Button variant="ghost" className="w-full justify-start">
                    My Properties
                  </Button>
                </Link>
                <Link href="/developer/create">
                  <Button variant="ghost" className="w-full justify-start">
                    List Property
                  </Button>
                </Link>
              </>
            )}
            <Button onClick={handleLogout} variant="outline" className="w-full justify-start">
              Logout
            </Button>
          </nav>
        )}
      </div>
    </header>
  )
}
