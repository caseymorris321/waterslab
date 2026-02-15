import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { Minus, Plus, ShoppingBag } from 'lucide-react'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { useUser } from '@clerk/clerk-react'
import type { CartItem, MutateCartFnInput } from '@/types/cart-types'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

import { EmptyCartState } from '@/components/cart/EmptyCartState'
import { CartFooter } from '@/components/cart/CartFooter'
import { Footer } from '@/components/layout/Footer'
import { WaterDropLoader } from '@/components/ui/water-drop-loader'

const fetchCartItems = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId?: string | null }) => data)
  .handler(async ({ data }) => {
    const { getCartItems } = await import('@/data/cart.server')
    return await getCartItems({ userId: data.userId })
  })

export const mutateCartFn = createServerFn({ method: 'POST' })
  .inputValidator((data: MutateCartFnInput) => data)
  .handler(async ({ data }: { data: MutateCartFnInput }) => {
    const { addToCart, updateCartItem, removeFromCart, clearCart } =
      await import('@/data/cart.server')
    const ctx = { userId: data.userId }
    switch (data.action) {
      case 'add':
        return await addToCart(data.productId, data.quantity, ctx)
      case 'remove':
        return await removeFromCart(data.productId, ctx)
      case 'update':
        return await updateCartItem(data.productId, data.quantity, ctx)
      case 'clear':
        return await clearCart(ctx)
    }
  })

// Server function to merge guest cart when user logs in
export const mergeGuestCartFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const { mergeGuestCartToUser } = await import('@/data/cart.server')
    await mergeGuestCartToUser(data.userId)
    return { success: true }
  })

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

function CartPage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const userId = user?.id ?? null

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart', userId],
    queryFn: () => fetchCartItems({ data: { userId } }),
    enabled: isLoaded, // Wait for auth to load
  })

  if (!isLoaded || isLoading || !cart) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center">
        <WaterDropLoader size="lg" />
      </div>
    )
  }

  const shipping = cart.items.length > 0 ? 8 : 0
  const subtotal = cart.items.reduce(
    (acc: number, item) => acc + Number(item.price) * item.quantity,
    0,
  )
  const total = subtotal + shipping

  if (cart.items.length === 0) {
    return <EmptyCartState />
  }

  const handleClearCart = async () => {
    await mutateCartFn({
      data: {
        action: 'clear',
        userId,
      },
    })
    await router.invalidate({ sync: true })
    await queryClient.invalidateQueries({ queryKey: ['cart-items-data'] })
    await queryClient.invalidateQueries({ queryKey: ['cart', userId] })
  }

  const handleDecrementQuantity = async (item: CartItem) => {
    // Don't go below 1 - use Remove button to delete
    if (item.quantity <= 1) return

    await mutateCartFn({
      data: {
        action: 'update',
        productId: item.id,
        quantity: Number(item.quantity) - 1,
        userId,
      },
    })
    await router.invalidate({ sync: true })
    await queryClient.invalidateQueries({ queryKey: ['cart-items-data'] })
    await queryClient.invalidateQueries({ queryKey: ['cart', userId] })
  }

  const handleIncrementQuantity = async (item: CartItem) => {
    await mutateCartFn({
      data: {
        action: 'add',
        productId: item.id,
        quantity: 1,
        userId,
      },
    })
    await router.invalidate({ sync: true })
    await queryClient.invalidateQueries({ queryKey: ['cart-items-data'] })
    await queryClient.invalidateQueries({ queryKey: ['cart', userId] })
  }

  const handleRemoveItem = async (item: CartItem) => {
    await mutateCartFn({
      data: {
        action: 'remove',
        quantity: 0,
        productId: item.id,
        userId,
      },
    })
    await router.invalidate({ sync: true })
    await queryClient.invalidateQueries({ queryKey: ['cart-items-data'] })
    await queryClient.invalidateQueries({ queryKey: ['cart', userId] })
  }
  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:text-sky-100 pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ocean-500/10 dark:bg-ocean-500/20 mb-4">
              <ShoppingBag size={16} className="text-ocean-500 dark:text-ocean-400" />
              <span className="text-sm font-medium text-ocean-600 dark:text-ocean-400">Your Cart</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-navy-900 dark:text-sky-100">
              Review Your Order
            </h1>
            <p className="text-slate-600 dark:text-sky-300 mt-2">
              Review your picks before checking out.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-4">
              <div className="flex items-center justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-500 hover:text-red-500"
                    >
                      Clear cart
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear your cart?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove {cart.items.length} item{cart.items.length > 1 ? 's' : ''} from your cart.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep it</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearCart}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Yes, clear
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-sky-400/10 rounded-2xl border border-slate-100 dark:border-sky-400/10 bg-white dark:bg-navy-800 shadow-lg overflow-hidden">
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-sky-50/50 dark:hover:bg-navy-700/50 transition-colors"
                  >
                    {/* Product info - centered */}
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-xl border border-slate-100 dark:border-sky-400/10 bg-sky-50 dark:bg-navy-700 overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex flex-col justify-center space-y-1">
                        <Link
                          to="/store/$id"
                          params={{ id: item.id }}
                          className="text-base font-semibold text-navy-900 dark:text-sky-100 hover:text-ocean-500 dark:hover:text-ocean-400 transition-colors"
                        >
                          {item.name}
                        </Link>
                        <div className="flex items-center gap-3 text-sm font-semibold">
                          <span className="text-ocean-600 dark:text-ocean-400">${Number(item.price).toFixed(2)}</span>
                          <span className="text-slate-300 dark:text-sky-400/50">·</span>
                          <span className="text-slate-500 dark:text-sky-300">
                            {item.inventory === 'in-stock'
                              ? 'In stock'
                              : item.inventory === 'backorder'
                                ? 'Backorder'
                                : 'Preorder'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity controls - centered */}
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon-sm"
                          variant="outline"
                          aria-label={`Decrease ${item.name}`}
                          onClick={() => handleDecrementQuantity(item)}
                          disabled={item.quantity <= 1}
                          className={cn(
                            "border-slate-200 dark:border-sky-400/20 hover:border-ocean-300 hover:bg-ocean-50 dark:hover:bg-ocean-500/10",
                            item.quantity <= 1 && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Minus size={14} />
                        </Button>
                        <span className="h-9 w-12 flex items-center justify-center rounded-lg border border-slate-200 dark:border-sky-400/20 bg-white dark:bg-navy-900 text-sm font-semibold text-navy-900 dark:text-sky-100">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          aria-label={`Increase ${item.name}`}
                          onClick={() => handleIncrementQuantity(item)}
                          className="border-slate-200 dark:border-sky-400/20 hover:border-ocean-300 hover:bg-ocean-50 dark:hover:bg-ocean-500/10"
                        >
                          <Plus size={14} />
                        </Button>
                      </div>
                      <div className="text-sm font-bold text-navy-900 dark:text-sky-100">
                        ${(Number(item.price) * item.quantity).toFixed(2)}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Item From Cart</AlertDialogTitle>
                            <AlertDialogDescription>
                             Are you sure you want to remove {item.name} from your cart?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep it</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveItem(item)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Yes, remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <CartFooter subtotal={subtotal} shipping={shipping} total={total} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
