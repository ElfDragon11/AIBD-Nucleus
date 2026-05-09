import { Link } from 'react-router-dom'

import { PublicSiteHeader } from '@/components/brand/PublicSiteHeader'
import { Button } from '@/components/ui/button'

export function LandingPage() {
  return (
    <div className="min-h-svh bg-background">
      <PublicSiteHeader />
      <main>
        <section className="border-b border-border bg-background">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-8 md:grid-cols-[1fr_0.7fr] md:items-end md:py-24">
            <div className="max-w-3xl space-y-7">
              <h1 className="text-balance font-serif text-[2.6rem] font-medium leading-[1.05] tracking-tight sm:text-6xl">
                Connect with the right people in Utah&apos;s innovation
                ecosystem.
              </h1>
              <p className="max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
                Tell us what you are building, looking for, or able to help
                with. Nucleus Concierge will ask a few smart questions and
                recommend the best next people, opportunities, or resources.
              </p>
              <Button asChild size="lg" className="sm:min-w-52">
                <Link to="/intake">Contact Us</Link>
              </Button>
            </div>
            <div className="border-l-2 border-[var(--nucleus-blue)] bg-secondary p-6 sm:p-8">
              <p className="font-serif text-2xl leading-snug">
                A smarter front door for founders, researchers, operators,
                mentors, investors, and service providers.
              </p>
            </div>
          </div>
        </section>
        <section className="bg-secondary">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm leading-6 text-foreground sm:px-8 md:grid-cols-3">
            <p>
              Share your goal in plain language. The concierge clarifies the
              context that matters.
            </p>
            <p>
              Get curated next connections without sorting through a generic
              directory.
            </p>
            <p>
              Nucleus staff still review and approve introductions before they
              move forward.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
