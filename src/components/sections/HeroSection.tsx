import { Suspense, lazy } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Droplets } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WaterDropLoader } from '@/components/ui/water-drop-loader'

// Lazy load the 3D ocean to improve initial load
const HeroOcean = lazy(() =>
  import('./HeroOcean').then((m) => ({ default: m.HeroOcean }))
)

export function HeroSection() {
  return (
    <section className="relative h-screen min-h-[600px] overflow-hidden">
      {/* 3D Ocean Background */}
      <Suspense
        fallback={
          <div className="absolute inset-0 bg-gradient-to-b from-[#2d4a6d] to-[#1a3a5c] flex items-center justify-center">
            <WaterDropLoader size="lg" />
          </div>
        }
      >
        <HeroOcean />
      </Suspense>

      {/* Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628]/70 via-transparent to-[#0A1628]/20 pointer-events-none" />

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col items-center pointer-events-none">
        {/* Badge - positioned in upper area above sun */}
        <div className="mt-[32vh] -translate-y-1 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 pointer-events-auto shadow-lg shadow-black/20">
          <Droplets size={16} className="text-sky-300" />
          <span className="text-sm font-medium text-white/90">
            Premium Hydration Products
          </span>
        </div>

        {/* Title - at horizon line */}
        <h1
          className={cn(
            'mt-[3vh] text-5xl md:text-7xl font-bold text-white',
            'tracking-tight leading-tight',
            'drop-shadow-lg',
          )}
        >
          WatersLab
        </h1>

        {/* Subheadline */}
        <p
          className={cn(
            'mt-4 text-xl md:text-2xl text-white/80',
            'max-w-2xl mx-auto px-4 text-center',
            'drop-shadow-md',
          )}
        >
          Fuel your performance with science-backed hydration solutions for
          athletes who demand the best.
        </p>

        {/* CTA Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 pointer-events-auto">
          <Link
            to="/store"
            className={cn(
              'inline-flex items-center gap-2',
              'px-8 py-4 rounded-full',
              'bg-ocean-500 hover:bg-ocean-600',
              'text-white font-semibold text-lg',
              'shadow-lg shadow-ocean-500/30',
              'hover:-translate-y-0.5 hover:shadow-xl hover:shadow-ocean-500/40',
              'transition-all duration-200',
            )}
          >
            Shop Now
            <ArrowRight size={20} />
          </Link>
          <a
            href="#about"
            className={cn(
              'inline-flex items-center gap-2',
              'px-8 py-4 rounded-full',
              'bg-white/10 hover:bg-white/20',
              'backdrop-blur-sm border border-white/20',
              'text-white font-semibold text-lg',
              'hover:-translate-y-0.5',
              'transition-all duration-200',
            )}
          >
            Learn More
          </a>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-2.5 bg-white/60 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  )
}
