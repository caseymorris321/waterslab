import { Link } from '@tanstack/react-router'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const features = [
  'Science-backed hydration formulas',
  'Products designed for active lifestyles',
  'Personalized recommendations',
  'Premium quality ingredients',
]

export function AboutSection() {
  return (
    <section id="about" className="py-20 md:py-28 bg-white dark:bg-navy-950">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-sky-100 to-ocean-100">
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src="https://plus.unsplash.com/premium_photo-1746192629906-7298725e8600?w=800&auto=format&fit=crop&q=80"
                  alt="Athletic man staying hydrated during workout"
                  className="w-[98%] h-[98%] rounded-full object-cover"
                />
              </div>
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-sky-100 rounded-2xl -z-10" />
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-ocean-100 rounded-2xl -z-10" />
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <span className="text-sm font-semibold uppercase tracking-wider text-ocean-500 dark:text-ocean-400">
                About WatersLab
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-navy-900 dark:text-sky-100 mt-2">
                Hydration Science for Peak Performance
              </h2>
            </div>

            <p className="text-lg text-slate-600 dark:text-sky-200 leading-relaxed">
              At WatersLab, we believe proper hydration is the foundation of
              athletic excellence. Our products are developed with input from
              sports scientists and athletes to deliver optimal hydration when
              you need it most.
            </p>

            <p className="text-lg text-slate-600 dark:text-sky-200 leading-relaxed">
              Whether you're a marathon runner, weekend warrior, or fitness
              enthusiast, we have the hydration solutions to help you perform
              at your best and recover faster.
            </p>

            {/* Features list */}
            <ul className="space-y-3">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-ocean-500 dark:text-ocean-400 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-sky-200">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="flex justify-center md:justify-start">
              <Link
                to="/store"
                className={cn(
                  'inline-flex items-center gap-2',
                  'px-6 py-3 rounded-full',
                  'bg-ocean-500 hover:bg-ocean-600',
                  'text-white font-semibold',
                  'shadow-lg shadow-ocean-500/25',
                  'hover:-translate-y-0.5 hover:shadow-xl',
                  'transition-all duration-200',
                )}
              >
                Explore Store
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
