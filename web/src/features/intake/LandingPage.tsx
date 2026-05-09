import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function LandingPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-between gap-12 px-6 py-16 pb-24 text-center md:justify-center md:pb-16">
      <div className="w-full max-w-2xl space-y-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Nucleus Concierge · Public intake
        </p>
        <h1 className="text-balance font-serif text-[2rem] leading-tight tracking-tight sm:text-5xl md:text-[3.35rem]">
          Find the right people and opportunities in Utah&apos;s innovation
          ecosystem.
        </h1>
        <p className="text-pretty text-base text-muted-foreground sm:text-lg">
          Tell us what you are building, looking for, or able to help with. Nucleus
          Concierge will ask a few smart questions and recommend the best next
          people, opportunities, or resources.
        </p>
        <Button asChild size="lg" className="mt-6 min-w-[8.5rem]">
          <Link to="/intake">Start</Link>
        </Button>
        <p className="mt-6 text-xs text-muted-foreground">
          Need a blank slate mid-browser?{' '}
          <Link
            className="text-foreground underline decoration-foreground/20 underline-offset-4 hover:decoration-foreground/70"
            to="/intake?fresh=1"
          >
            Restart intake clears this device&apos;s concierge session keys.
          </Link>
        </p>
      </div>

      <p className="text-xs text-muted-foreground md:absolute md:bottom-8 md:left-8 md:right-8 md:flex md:justify-center">
        <span>
          Managing submissions?{' '}
          <Link
            className="text-foreground underline decoration-foreground/20 underline-offset-4 hover:decoration-foreground/70"
            to="/admin/login"
          >
            Admin sign in
          </Link>
        </span>
      </p>
    </main>
  )
}
