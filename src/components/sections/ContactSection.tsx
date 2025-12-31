import { useState } from 'react'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

const contactInfo = [
  {
    icon: Mail,
    label: 'Email',
    value: 'support@waterslab.com',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '+1 (555) 123-4567',
  },
  {
    icon: MapPin,
    label: 'Location',
    value: 'San Francisco, CA',
  },
]

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Form submitted:', formData)
    // Reset form
    setFormData({ name: '', email: '', message: '' })
  }

  return (
    <section id="contact" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left - Contact Info */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <span className="text-sm font-semibold uppercase tracking-wider text-ocean-500">
                Contact Us
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mt-2">
                Let's Talk Hydration
              </h2>
              <p className="text-lg text-slate-600 mt-4">
                Have questions about our products or need personalized
                hydration advice? We're here to help you perform at your best.
              </p>
            </div>

            {/* Contact Methods */}
            <div className="space-y-4">
              {contactInfo.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-sky-50 transition-colors"
                >
                  <div className="p-3 rounded-xl bg-white shadow-sm">
                    <item.icon className="w-5 h-5 text-ocean-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="font-medium text-navy-900">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Contact Form */}
          <div className="bg-slate-50 rounded-3xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-navy-800 mb-2"
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className={cn(
                    'w-full px-4 py-3 rounded-xl',
                    'bg-white border border-slate-200',
                    'text-navy-900 placeholder:text-slate-400',
                    'focus:outline-none focus:ring-2 focus:ring-ocean-500/50 focus:border-ocean-500',
                    'transition-all duration-200',
                  )}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-navy-800 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className={cn(
                    'w-full px-4 py-3 rounded-xl',
                    'bg-white border border-slate-200',
                    'text-navy-900 placeholder:text-slate-400',
                    'focus:outline-none focus:ring-2 focus:ring-ocean-500/50 focus:border-ocean-500',
                    'transition-all duration-200',
                  )}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-navy-800 mb-2"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  required
                  rows={5}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl resize-none',
                    'bg-white border border-slate-200',
                    'text-navy-900 placeholder:text-slate-400',
                    'focus:outline-none focus:ring-2 focus:ring-ocean-500/50 focus:border-ocean-500',
                    'transition-all duration-200',
                  )}
                  placeholder="How can we help you?"
                />
              </div>

              <button
                type="submit"
                className={cn(
                  'w-full flex items-center justify-center gap-2',
                  'px-6 py-4 rounded-xl',
                  'bg-ocean-500 hover:bg-ocean-600',
                  'text-white font-semibold text-lg',
                  'shadow-lg shadow-ocean-500/25',
                  'hover:-translate-y-0.5 hover:shadow-xl',
                  'transition-all duration-200',
                )}
              >
                Send Message
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
