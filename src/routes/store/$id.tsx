import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { ArrowLeftIcon, ShoppingBagIcon, SparklesIcon, Heart, Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Suspense, useState, useEffect } from 'react'
import { useUser, SignInButton } from '@clerk/clerk-react'

import type { ProductSelect, ProductInsert } from '@/db/schema'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { RecommendedProducts } from '@/components/RecommendedProducts'
import { Skeleton } from '@/components/ui/skeleton'
import { mutateCartFn } from '@/routes/cart'

// Admin email - change this to your admin email
const ADMIN_EMAIL = 'morrisacasey@gmail.com'

const fetchProductById = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }: { data: string }) => {
    const { getProductById } = await import('@/data/products')
    const product = await getProductById(id)
    if (!product) {
      throw new Error(`Product with id ${id} not found`)
    }
    return product
  })

const fetchRecommendedProducts = createServerFn({ method: 'GET' })
  .inputValidator((excludeId: string) => excludeId)
  .handler(async ({ data: excludeId }) => {
    const { getRecommendedProducts } = await import('@/data/products')
    return getRecommendedProducts(excludeId)
  })

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

const updateProductServerFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; updates: Partial<ProductInsert> }) => data)
  .handler(async ({ data }) => {
    const { updateProduct } = await import('@/data/products')
    return await updateProduct(data.id, data.updates)
  })

const deleteProductServerFn = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const { deleteProduct } = await import('@/data/products')
    return await deleteProduct(id)
  })

export const Route = createFileRoute('/store/$id')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const product = await fetchProductById({ data: params.id })
    const recommendedProducts = fetchRecommendedProducts({ data: params.id })
    return { product, recommendedProducts }
  },
  head: async ({ loaderData: data }) => {
    const { product } = data as {
      product: ProductSelect
      recommendedProducts: Promise<Array<ProductSelect>>
    }
    console.log('product in head', product)
    if (!data) {
      return {}
    }
    return {
      meta: [
        { name: 'description', content: product.description },
        { name: 'image', content: product.image },
        { name: 'title', content: product.name },
        {
          name: 'canonical',
          content:
            process.env.NODE_ENV === 'production'
              ? `https://yourdomain.com/store/${product.id}`
              : `http://localhost:3000/store/${product.id}`,
        },
        {
          title: product.name,
        },
        {
          description: product.description,
        },
      ],
    }
  },
})

function RouteComponent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { product, recommendedProducts } = Route.useLoaderData()
  const { isSignedIn, user, isLoaded } = useUser()
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const userId = user?.id ?? null
  const userEmail = user?.emailAddresses[0]?.emailAddress
  const isAdmin = userEmail === ADMIN_EMAIL

  // Edit dialog state
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: product.name,
    price: product.price,
    description: product.description || '',
    badge: product.badge || '',
    category: product.category || 'everyday',
    image: product.image,
    inventory: product.inventory,
    rating: product.rating,
    reviews: product.reviews,
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleUpdateProduct = async () => {
    setIsUpdating(true)
    await updateProductServerFn({
      data: {
        id: product.id,
        updates: {
          name: editForm.name,
          price: editForm.price,
          description: editForm.description,
          badge: editForm.badge || null,
          category: editForm.category as 'running' | 'cycling' | 'gym' | 'outdoor' | 'recovery' | 'everyday',
          image: editForm.image,
          inventory: editForm.inventory as 'in-stock' | 'backorder' | 'preorder',
          rating: editForm.rating,
          reviews: editForm.reviews,
        },
      },
    })
    setIsUpdating(false)
    setEditOpen(false)
    router.invalidate()
  }

  const handleDeleteProduct = async () => {
    setIsDeleting(true)
    await deleteProductServerFn({ data: product.id })
    setIsDeleting(false)
    navigate({ to: '/store' })
  }

  useEffect(() => {
    if (userId) {
      checkIfSavedServerFn({ data: { userId, productId: product.id } })
        .then(setIsSaved)
    }
  }, [userId, product.id])

  const handleSaveToggle = async () => {
    if (!isLoaded) return
    if (!userId) return // SignInButton will handle this
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
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-navy-950 dark:to-navy-900 pt-24">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Back Link */}
        <Link
          to="/store"
          className="inline-flex items-center gap-2 text-sm font-medium text-ocean-600 hover:text-ocean-700 dark:text-ocean-400 dark:hover:text-ocean-300 mb-6"
        >
          <ArrowLeftIcon size={16} />
          Back to Store
        </Link>

        {/* Product Detail Card */}
        <Card className="bg-white dark:bg-navy-800 border-slate-100 dark:border-sky-400/10 shadow-lg overflow-hidden">
          <div className="grid gap-8 md:grid-cols-2 p-6 md:p-8">
            {/* Product Image */}
            <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 to-slate-100 dark:from-navy-700 dark:to-navy-600 border border-slate-100 dark:border-sky-400/10">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-contain p-8"
                loading="lazy"
              />
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <CardHeader className="p-0 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  {product.badge && (
                    <span className="rounded-full bg-ocean-500 px-3 py-1 text-xs font-semibold text-white">
                      {product.badge}
                    </span>
                  )}
                  {isAdmin && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-slate-500 hover:text-ocean-600"
                          >
                            <Pencil size={14} />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Product</DialogTitle>
                            <DialogDescription>
                              Update the product details below.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="name">Name</Label>
                              <Input
                                id="name"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="description">Description</Label>
                              <Input
                                id="description"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="price">Price</Label>
                                <Input
                                  id="price"
                                  type="number"
                                  step="0.01"
                                  value={editForm.price}
                                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="image">Image URL</Label>
                                <Input
                                  id="image"
                                  value={editForm.image}
                                  onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="badge">Badge</Label>
                                <select
                                  id="badge"
                                  value={editForm.badge}
                                  onChange={(e) => setEditForm({ ...editForm, badge: e.target.value })}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                  <option value="">None</option>
                                  <option value="New">New</option>
                                  <option value="Sale">Sale</option>
                                  <option value="Featured">Featured</option>
                                  <option value="Limited">Limited</option>
                                </select>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <select
                                  id="category"
                                  value={editForm.category}
                                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                  <option value="everyday">Everyday</option>
                                  <option value="running">Running</option>
                                  <option value="cycling">Cycling</option>
                                  <option value="gym">Gym</option>
                                  <option value="outdoor">Outdoor</option>
                                  <option value="recovery">Recovery</option>
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="inventory">Inventory</Label>
                                <select
                                  id="inventory"
                                  value={editForm.inventory}
                                  onChange={(e) => setEditForm({ ...editForm, inventory: e.target.value })}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                  <option value="in-stock">In Stock</option>
                                  <option value="backorder">Backorder</option>
                                  <option value="preorder">Preorder</option>
                                </select>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="rating">Rating</Label>
                                <Input
                                  id="rating"
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="5"
                                  value={editForm.rating}
                                  onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="reviews">Reviews</Label>
                                <Input
                                  id="reviews"
                                  type="number"
                                  min="0"
                                  value={editForm.reviews}
                                  onChange={(e) => setEditForm({ ...editForm, reviews: parseInt(e.target.value) || 0 })}
                                />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setEditOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleUpdateProduct}
                              disabled={isUpdating}
                              className="bg-ocean-500 hover:bg-ocean-600"
                            >
                              {isUpdating ? 'Saving...' : 'Save changes'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{product.name}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep it</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteProduct}
                              disabled={isDeleting}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              {isDeleting ? 'Deleting...' : 'Yes, delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
                <CardTitle>
                  <h1 className="text-3xl font-bold text-navy-900 dark:text-sky-100">
                    {product.name}
                  </h1>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0 flex-1 space-y-6">
                <CardDescription className="text-lg text-slate-600 dark:text-sky-200">
                  {product.description}
                </CardDescription>

                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold text-navy-900 dark:text-sky-100">
                    ${product.price}
                  </span>
                  <span className="text-slate-500 dark:text-sky-300">
                    {product.rating.toString()}/5 ({product.reviews} reviews)
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-sky-50 dark:bg-navy-700 border border-sky-100 dark:border-sky-400/10 p-4 text-sm font-medium text-navy-800 dark:text-sky-100">
                  <SparklesIcon size={18} className="text-ocean-500 dark:text-ocean-400" />
                  {product.inventory === 'in-stock'
                    ? 'Ships in 1-2 business days'
                    : product.inventory === 'backorder'
                      ? 'Backordered - shipping in ~2 weeks'
                      : 'Preorder - shipping in the next drop'}
                </div>
              </CardContent>

              <CardFooter className="p-0 pt-6 mt-auto">
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="bg-ocean-500 hover:bg-ocean-600 px-6 py-3 text-white shadow-lg shadow-ocean-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl cursor-pointer"
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
                    <ShoppingBagIcon size={16} />
                    Add to cart
                  </Button>
                  {isSignedIn ? (
                    <Button
                      variant="outline"
                      disabled={isSaving || !isLoaded}
                      onClick={handleSaveToggle}
                      className={`transition hover:-translate-y-0.5 hover:shadow-sm cursor-pointer ${
                        isSaved
                          ? 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
                          : 'border-slate-200 text-navy-700 hover:border-slate-300'
                      }`}
                    >
                      <Heart size={16} className={isSaved ? 'fill-current' : ''} />
                      {!isLoaded ? 'Loading...' : isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save for later'}
                    </Button>
                  ) : (
                    <SignInButton mode="modal">
                      <Button
                        variant="outline"
                        className="border-slate-200 text-navy-700 hover:border-slate-300 transition hover:-translate-y-0.5 hover:shadow-sm cursor-pointer"
                      >
                        <Heart size={16} />
                        Save for later
                      </Button>
                    </SignInButton>
                  )}
                </div>
              </CardFooter>
            </div>
          </div>
        </Card>

        {/* Recommended Products */}
        <div className="mt-16">
          <Suspense
            fallback={
              <div>
                <h2 className="text-2xl font-bold text-navy-900 dark:text-sky-100 mb-6">
                  Recommended Products
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="w-full h-64 rounded-2xl" />
                  ))}
                </div>
              </div>
            }
          >
            <RecommendedProducts recommendedProducts={recommendedProducts} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
