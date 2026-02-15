import { use } from 'react'
import { ProductCard } from './ProductCard'
import type { ProductSelect } from '@/db/schema'

export function RecommendedProducts({
  recommendedProducts,
}: {
  recommendedProducts: Promise<Array<ProductSelect>>
}) {
  const recommendedProductsData = use(recommendedProducts)
  return (
    <div>
      <h2 className="text-2xl font-bold text-navy-900 dark:text-sky-100 mb-6">
        Recommended Products
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recommendedProductsData.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
