import { useEffect, useRef } from 'react'
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { ClerkProvider, useUser } from '@clerk/clerk-react'
import { Navigation } from '../components/layout/Navigation'
import { WaterDropLoader } from '../components/ui/water-drop-loader'
import appCss from '../styles.css?url'
import type { QueryClient } from '@tanstack/react-query'
import { mergeGuestCartFn } from './cart'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function RouteLoadingIndicator() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-24">
      <WaterDropLoader size="lg" />
      <p className="mt-4 text-navy-800 font-medium animate-pulse">Loading...</p>
    </div>
  )
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        {
          charSet: 'utf-8',
        },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        {
          title: 'WatersLab - Hydration for Athletes',
        },
        {
          description:
            'WatersLab offers premium hydration products for athletes and fitness enthusiasts. Calculate your hydration needs and shop electrolytes, bottles, and more.',
        },
      ],
      links: [
        {
          rel: 'stylesheet',
          href: appCss,
        },
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/favicon.svg',
        },
        {
          rel: 'apple-touch-icon',
          href: '/favicon.svg',
        },
      ],
    }),

    pendingComponent: RouteLoadingIndicator,
    shellComponent: RootDocument,
  },
)

/**
 * Handles merging guest cart into user cart when user logs in
 */
function CartMergeHandler() {
  const { user, isSignedIn, isLoaded } = useUser()
  const queryClient = useQueryClient()
  const hasMerged = useRef(false)

  useEffect(() => {
    // Only run once when user signs in
    if (isLoaded && isSignedIn && user?.id && !hasMerged.current) {
      hasMerged.current = true
      mergeGuestCartFn({ data: { userId: user.id } })
        .then(() => {
          // Invalidate cart queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['cart-items-data'] })
          queryClient.invalidateQueries({ queryKey: ['cart'] })
        })
        .catch(console.error)
    }

    // Reset when user signs out
    if (isLoaded && !isSignedIn) {
      hasMerged.current = false
    }
  }, [isLoaded, isSignedIn, user?.id, queryClient])

  return null
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const { queryClient } = Route.useRouteContext()

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <CartMergeHandler />
        <html lang="en">
          <head>
            <HeadContent />
          </head>
          <body>
            <div className="min-h-screen bg-white text-navy-900">
              <Navigation />
              <main>{children}</main>
            </div>
            <TanStackDevtools
              config={{
                position: 'bottom-right',
              }}
              plugins={[
                {
                  name: 'Tanstack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
            <TanStackDevtools />
            <Scripts />
          </body>
        </html>
      </QueryClientProvider>
    </ClerkProvider>
  )
}
