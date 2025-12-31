import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useUser, SignInButton, UserButton } from '@clerk/clerk-react'
import { Menu, X, ShoppingBag, Heart } from 'lucide-react'
import { WatersLabLogo } from './WatersLabLogo'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'

const getCartItemsCount = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId?: string | null }) => data)
  .handler(async ({ data }) => {
    const { getCartItemsCount } = await import('@/data/cart.server')
    return await getCartItemsCount({ userId: data.userId })
  })

const getSavedProductsCount = createServerFn({ method: 'GET' })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const { getSavedProductsCount } = await import('@/data/saved-products')
    return getSavedProductsCount(userId)
  })

const navLinks = [
  { label: 'About', href: '/#about' },
  { label: 'Store', href: '/store' },
  { label: 'Contact', href: '/contact' },
]

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isSignedIn, user, isLoaded } = useUser()

  const userId = user?.id ?? null

  const { data: cartItemsData } = useQuery({
    queryKey: ['cart-items-data', userId],
    queryFn: () => getCartItemsCount({ data: { userId } }),
  })

  const { data: savedCount = 0 } = useQuery({
    queryKey: ['saved-products-count', userId],
    queryFn: () => getSavedProductsCount({ data: userId! }),
    enabled: !!userId,
  })

  return (
    <header
      className={cn(
        'fixed top-4 left-1/2 -translate-x-1/2 z-50',
        'w-[calc(100%-2rem)] max-w-5xl',
        'rounded-2xl border border-white/20',
        'bg-white/80 backdrop-blur-xl shadow-lg shadow-navy-950/5',
        'dark:bg-navy-900/80 dark:border-sky-400/10 dark:shadow-sky-500/5',
      )}
    >
      <nav className="flex items-center justify-between px-4 py-3">
        {/* Left - Nav Links (Desktop) */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium',
                'text-navy-800 hover:text-ocean-600',
                'hover:bg-sky-50 transition-colors',
                'dark:text-sky-100 dark:hover:text-sky-300 dark:hover:bg-navy-800',
              )}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Center - Logo */}
        <Link
          to="/"
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
        >
          <WatersLabLogo className="h-8 w-8" />
          <span className="text-lg font-bold text-navy-900 dark:text-sky-100">WatersLab</span>
        </Link>

        {/* Right - User + Cart (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {!isLoaded ? (
            <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse" />
          ) : isSignedIn ? (
            <div className="flex items-center gap-2">
              {/* Saved products badge - left of avatar */}
              <Link
                to="/saved-products"
                className={cn(
                  'relative p-1.5 rounded-full transition-all hover:scale-110',
                  'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10',
                )}
                title={`${savedCount} saved products`}
              >
                <Heart size={20} className={savedCount > 0 ? 'fill-current' : ''} />
                {savedCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {savedCount > 9 ? '9+' : savedCount}
                  </span>
                )}
              </Link>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-9 h-9',
                  },
                }}
              />
            </div>
          ) : (
            <SignInButton mode="modal">
              <button
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium',
                  'text-navy-800 hover:text-ocean-600',
                  'hover:bg-sky-50 transition-colors cursor-pointer',
                  'dark:text-sky-100 dark:hover:text-sky-300 dark:hover:bg-navy-800',
                )}
              >
                Sign In
              </button>
            </SignInButton>
          )}

          <ThemeToggle />

          <Link
            to="/cart"
            className={cn(
              'flex items-center gap-2',
              'px-4 py-2 rounded-full',
              'bg-ocean-500 text-white',
              'text-sm font-semibold',
              'shadow-md shadow-ocean-500/25',
              'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ocean-500/30',
              'transition-all duration-200',
            )}
          >
            <ShoppingBag size={16} />
            <span>Cart</span>
            <span
              className={cn(
                'flex h-5 min-w-5 items-center justify-center',
                'rounded-full bg-white text-ocean-600',
                'text-xs font-bold px-1.5',
              )}
            >
              {cartItemsData?.count ?? 0}
            </span>
          </Link>
        </div>

        {/* Mobile - Menu Button + Theme Toggle (Left) */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-sky-50 dark:hover:bg-navy-800 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X size={20} className="text-navy-800 dark:text-sky-100" />
            ) : (
              <Menu size={20} className="text-navy-800 dark:text-sky-100" />
            )}
          </button>
          <ThemeToggle />
        </div>

        {/* Mobile - Cart (Right) */}
        <Link
          to="/cart"
          className={cn(
            'flex md:hidden items-center gap-1',
            'px-3 py-2 rounded-full',
            'bg-ocean-500 text-white',
            'text-sm font-semibold',
          )}
        >
          <ShoppingBag size={16} />
          <span
            className={cn(
              'flex h-5 min-w-5 items-center justify-center',
              'rounded-full bg-white text-ocean-600',
              'text-xs font-bold px-1.5',
            )}
          >
            {cartItemsData?.count ?? 0}
          </span>
        </Link>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-sky-400/10 px-4 py-3">
          {/* Navigation Links */}
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'px-4 py-3 rounded-xl text-sm font-medium',
                  'text-navy-800 hover:text-ocean-600',
                  'hover:bg-sky-50 transition-colors',
                  'dark:text-sky-100 dark:hover:text-sky-300 dark:hover:bg-navy-800',
                )}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* User Section at Bottom */}
          <div className="border-t border-slate-100 dark:border-sky-400/10 mt-3 pt-3">
            {!isLoaded ? (
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-navy-700 animate-pulse" />
                <div className="h-4 w-24 bg-slate-200 dark:bg-navy-700 rounded animate-pulse" />
              </div>
            ) : isSignedIn ? (
              <div className="flex flex-col gap-1">
                <div className="px-4 py-2 text-sm text-slate-500 dark:text-sky-300">
                  Signed in as{' '}
                  <span className="font-medium text-navy-800 dark:text-sky-100">
                    {user?.emailAddresses[0]?.emailAddress}
                  </span>
                </div>
                <Link
                  to="/saved-products"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium',
                    'text-navy-800 hover:text-ocean-600 hover:bg-sky-50',
                    'dark:text-sky-100 dark:hover:text-sky-300 dark:hover:bg-navy-800',
                    'transition-colors',
                  )}
                >
                  <Heart
                    size={16}
                    className={savedCount > 0 ? 'text-red-500 fill-current' : ''}
                  />
                  Saved{savedCount > 0 ? ` (${savedCount})` : ''}
                </Link>
                <div className="px-4 py-2 flex items-center gap-3">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: 'w-9 h-9',
                      },
                    }}
                  />
                  <span className="text-sm text-slate-500 dark:text-sky-300">Manage account</span>
                </div>
              </div>
            ) : (
              <SignInButton mode="modal">
                <button
                  className={cn(
                    'flex items-center justify-center gap-2 w-full',
                    'px-4 py-3 rounded-xl',
                    'bg-ocean-500 text-white font-semibold',
                    'hover:bg-ocean-600 transition-colors cursor-pointer',
                  )}
                >
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
