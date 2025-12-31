import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { ShoppingBagIcon, Heart } from 'lucide-react'
import { createServerFn } from '@tanstack/react-start'
import { useUser, useClerk } from '@clerk/clerk-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { ProductSelect } from '@/db/schema'
import { mutateCartFn } from '@/routes/cart'
import { useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'

const checkIfSavedServerFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string; productId: string }) => data)
  .handler(async ({ data }) => {
    const { isProductSaved } = await import('@/data/saved-products')
    return isProductSaved(data.userId, data.productId)
  })

const toggleSaveProductServerFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: string; productId: string; isSaved: boolean }) => data)
  .handler(async ({ data }) => {
    const { saveProduct, removeSavedProduct } = await import('@/data/saved-products')
    if (data.isSaved) {
      await removeSavedProduct(data.userId, data.productId)
    } else {
      await saveProduct(data.userId, data.productId)
    }
    return { success: true }
  })

const inventoryTone = {
  'in-stock': 'bg-green-50 text-green-600 border-green-100',
  backorder: 'bg-amber-50 text-amber-700 border-amber-100',
  preorder: 'bg-sky-50 text-sky-700 border-sky-100',
}

export function ProductCard({ product }: { product: ProductSelect }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isLoaded } = useUser()
  const { openSignIn } = useClerk()
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const userId = user?.id ?? null

  useEffect(() => {
    if (userId) {
      checkIfSavedServerFn({ data: { userId, productId: product.id } })
        .then(setIsSaved)
    }
  }, [userId, product.id])

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoaded) return
    if (!userId) {
      openSignIn()
      return
    }
    setIsSaving(true)
    await toggleSaveProductServerFn({
      data: { userId, productId: product.id, isSaved },
    })
    setIsSaved(!isSaved)
    setIsSaving(false)
    // Update the saved count in nav
    await queryClient.invalidateQueries({
      queryKey: ['saved-products-count', userId],
    })
  }

  return (
    <Link
      to="/store/$id"
      params={{ id: product.id }}
      className="block h-full cursor-default"
    >
      <Card className="h-full flex flex-col bg-white dark:bg-navy-800 border-slate-100 dark:border-sky-400/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
        <CardHeader className="gap-2 pb-2">
          <div className="flex items-center justify-between h-6">
            <div className="flex items-center gap-2">
              {product.badge ? (
                <span className="rounded-full bg-ocean-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                  {product.badge}
                </span>
              ) : (
                <span className="rounded-full bg-transparent px-2.5 py-0.5 text-xs font-semibold invisible">
                  Placeholder
                </span>
              )}
            </div>
            <button
              onClick={handleSaveToggle}
              disabled={isSaving || !isLoaded}
              className={cn(
                'p-1.5 rounded-full transition-colors cursor-pointer',
                !isLoaded
                  ? 'text-slate-300 dark:text-navy-600'
                  : isSaved
                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                    : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
              )}
            >
              <Heart size={18} className={isSaved ? 'fill-current' : ''} />
            </button>
          </div>
          <CardTitle className="text-lg font-semibold text-navy-900 dark:text-sky-100">
            {product.name}
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-sky-300 line-clamp-2">
            {product.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-auto flex items-center justify-between pt-2">
          <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-sky-300">
            <span className="font-semibold text-navy-800 dark:text-sky-100">{product.rating}/5</span>
            <span className="text-slate-400 dark:text-sky-400">({product.reviews} reviews)</span>
          </p>
          <span
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-semibold',
              inventoryTone[product.inventory as keyof typeof inventoryTone],
            )}
          >
            {product.inventory === 'in-stock'
              ? 'In Stock'
              : product.inventory === 'backorder'
                ? 'Backorder'
                : 'Preorder'}
          </span>
        </CardContent>
        <CardFooter className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-sky-400/10 mt-4">
          <span className="text-xl font-bold text-navy-900 dark:text-sky-100">${product.price}</span>
          <Button
            size="lg"
            className="bg-ocean-500 hover:bg-ocean-600 text-white shadow-sm hover:shadow-md transition-all cursor-pointer px-6 py-3 text-base"
            onClick={async (e) => {
              e.preventDefault()
              e.stopPropagation()
              await mutateCartFn({
                data: {
                  action: 'add',
                  productId: product.id,
                  quantity: 1,
                  userId,
                },
              })
              await router.invalidate({ sync: true })
              await queryClient.invalidateQueries({
                queryKey: ['cart-items-data', userId],
              })
            }}
          >
            <ShoppingBagIcon size={16} /> Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}
