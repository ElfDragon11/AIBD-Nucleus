import * as React from 'react'

import { MenuIcon, XIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

/**
 * Mirrors the live header at nucleusutah.org (Squarespace 7.1): palette from site.css,
 * wordmark CDN, nav folders + CONTACT US pill, centered logo with nav left / CTA right.
 */

const NU = 'https://www.nucleusutah.org'

const NU_LOGO_MAIN =
  'https://images.squarespace-cdn.com/content/v1/681936f274ae5b3fa16b8c1d/0a303644-2c8c-499f-b072-31a18b55d4dc/Wordmark_Blue.png?format=1500w'

const navRoot = `${NU}/`

type SimpleLink = {
  label: string
  href: string
  external?: boolean
}

type Folder = {
  label: string
  items: SimpleLink[]
}

/** Same paths as nucleusutah.org primary nav folders (homepage scrape). */
const TOP_NAV: (
  | { type: 'link'; link: SimpleLink }
  | { type: 'folder'; folder: Folder }
)[] = [
  { type: 'link', link: { label: 'Home', href: navRoot } },
  {
    type: 'folder',
    folder: {
      label: 'About Us',
      items: [
        { label: 'About Us', href: `${NU}/aboutus` },
        { label: 'Our Team', href: `${NU}/our-team` },
        { label: 'Partners', href: `${NU}/partners` },
      ],
    },
  },
  {
    type: 'folder',
    folder: {
      label: 'Programs',
      items: [
        { label: 'Programs', href: `${NU}/programs` },
        {
          label: 'Nucleus Fund',
          href: 'https://www.nucleusfundutah.com/',
          external: true,
        },
        { label: 'Nucleus Grow', href: `${NU}/grow` },
        { label: 'PolicyLab', href: `${NU}/policylab` },
        { label: 'MarketEdge', href: `${NU}/marketedge` },
        {
          label: 'Governor’s Medal for Science & Technology',
          href: `${NU}/governors-medal-for-science-technology`,
        },
        { label: 'UTIF', href: `${NU}/utif` },
      ],
    },
  },
  {
    type: 'folder',
    folder: {
      label: 'Events',
      items: [
        { label: 'Events', href: `${NU}/events` },
        { label: 'State of Innovation', href: `${NU}/stateofinnovation` },
        { label: 'Boost', href: `${NU}/boost` },
      ],
    },
  },
  { type: 'link', link: { label: 'Newsroom', href: `${NU}/newsroom` } },
]

function DropdownPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'opacity-0 invisible pointer-events-none transition-[opacity,visibility] duration-150 ease-out',
        'lg:group-hover:opacity-100 lg:group-hover:visible lg:group-hover:pointer-events-auto',
        'lg:group-focus-within:opacity-100 lg:group-focus-within:visible lg:group-focus-within:pointer-events-auto',
        'absolute left-0 top-[calc(100%+0.5rem)] z-50 min-w-[14rem] rounded-sm bg-white py-2 shadow-xl ring-1 ring-black/10',
      )}
    >
      {children}
    </div>
  )
}

function SubmenuLink(props: SimpleLink & { padded?: boolean }) {
  const { label, href, external, padded } = props
  return (
    <a
      href={href}
      className={cn(
        'block font-body leading-snug text-black no-underline transition-colors hover:bg-[hsla(204,83%,94%,1)] hover:text-black',
        padded ? 'px-6 py-2.5 text-base' : 'px-4 py-2 text-sm',
      )}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
    >
      {label}
    </a>
  )
}

export function PublicSiteHeader() {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  React.useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen])

  const accentVars = {
    ['--sq-light-accent-h' as string]: '204',
    ['--sq-light-accent-s' as string]: '83.33%',
    ['--sq-light-accent-l' as string]: '97.65%',
    ['--sq-dark-accent-h' as string]: '217',
    ['--sq-dark-accent-s' as string]: '100%',
    ['--sq-dark-accent-l' as string]: '37%',
  } as React.CSSProperties

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full font-body',
        'text-[hsl(var(--sq-dark-accent-h)_var(--sq-dark-accent-s)_var(--sq-dark-accent-l))]',
      )}
      style={{
        ...accentVars,
        backgroundColor:
          'hsl(var(--sq-light-accent-h) var(--sq-light-accent-s) var(--sq-light-accent-l))',
      }}
    >
      <a
        href={`${navRoot}#page`}
        className="pointer-events-none absolute left-[-9999px] z-[100] px-4 py-2 text-sm focus:pointer-events-auto focus:left-4 focus:top-4 focus:bg-white focus:text-black focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-current"
      >
        Skip to Content
      </a>

      <div className="mx-auto grid w-full max-w-[2560px] grid-cols-[1fr_auto] items-center px-[clamp(16px,4vw,104px)] py-[clamp(16px,2.2vw,40px)] lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-x-8">
        <nav
          className="relative z-50 hidden lg:col-start-1 lg:row-start-1 lg:flex lg:min-w-0 lg:justify-start"
          aria-label="Marketing site navigation"
        >
          <ul className="flex flex-wrap items-center gap-x-[clamp(0.875rem,1.2vw,1.375rem)] gap-y-1 text-[0.8125rem] font-medium leading-snug xl:text-sm">
            {TOP_NAV.map((block, i) =>
              block.type === 'link' ? (
                <li key={`link-${i}`}>
                  <a
                    href={block.link.href}
                    className="text-inherit no-underline transition-opacity hover:opacity-80 hover:underline"
                  >
                    {block.link.label}
                  </a>
                </li>
              ) : (
                <li
                  key={`folder-${block.folder.label}`}
                  className="group relative shrink-0"
                >
                  <button
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={false}
                    className={cn(
                      'cursor-pointer bg-transparent p-0 font-body text-[0.8125rem] font-medium text-inherit underline-offset-4',
                      'transition-opacity hover:opacity-80 xl:text-sm',
                    )}
                  >
                    {block.folder.label}
                  </button>
                  <DropdownPanel>
                    {block.folder.items.map((item) => (
                      <SubmenuLink key={item.label} {...item} />
                    ))}
                  </DropdownPanel>
                </li>
              ),
            )}
            <li>
              <Link
                to="/admin/login"
                className="text-inherit no-underline transition-opacity hover:opacity-80 hover:underline"
              >
                Admin sign in
              </Link>
            </li>
          </ul>
        </nav>

        <div className="col-start-1 row-start-1 flex min-w-0 items-center justify-self-start lg:col-start-2 lg:justify-self-center">
          <a
              href={navRoot}
              className="inline-flex shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/35 focus-visible:ring-offset-2"
              aria-label="THE NUCLEUS INSTITUTE — home"
            >
              <img
                src={NU_LOGO_MAIN}
                alt=""
                decoding="async"
                loading="eager"
                fetchPriority="high"
                className="h-[58px] w-auto md:h-[64px]"
              />
            </a>
        </div>

        <button
          type="button"
          className="col-start-2 row-start-1 justify-self-end rounded-md p-2 text-current lg:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? (
            <XIcon className="size-7" />
          ) : (
            <MenuIcon className="size-7 stroke-[1.75]" aria-hidden />
          )}
        </button>

        <div className="hidden lg:col-start-3 lg:row-start-1 lg:flex lg:justify-end">
          <Link
            to="/intake"
            className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border-[1.8px] border-current px-9 py-[0.7rem] text-[0.68rem] font-bold uppercase tracking-[0.16em] no-underline hover:bg-black/[0.04]"
          >
            CONTACT US
          </Link>
        </div>
      </div>

      {/* Mobile fullscreen panel / Squarespace-style overlay */}
      {mobileOpen ? (
        <div
          className="fixed inset-x-0 top-0 bottom-0 z-[60] overflow-y-auto bg-[hsl(var(--sq-light-accent-h)_var(--sq-light-accent-s)_var(--sq-light-accent-l))] pt-[calc(env(safe-area-inset-top)+1rem)] pb-10 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div className="flex justify-end px-[clamp(16px,5vw,32px)]">
            <button
              type="button"
              className="rounded-md p-2 text-current"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <XIcon className="size-7" />
            </button>
          </div>
          <nav className="mt-8 px-[clamp(16px,6vw,40px)]" aria-label="Mobile marketing nav">
            <ul className="space-y-1 text-lg font-medium">
              {TOP_NAV.map((block) =>
                block.type === 'link' ? (
                  <li key={`m-${block.link.label}`}>
                    <a
                      href={block.link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block py-3 text-inherit no-underline"
                    >
                      {block.link.label}
                    </a>
                  </li>
                ) : (
                  <li key={`m-${block.folder.label}`}>
                    <p className="py-3 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-current/85">
                      {block.folder.label}
                    </p>
                    <ul className="border-l border-current/15 pl-4">
                      {block.folder.items.map((item) => (
                        <li key={item.label}>
                          <a
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className="block py-2.5 text-base text-current no-underline"
                            {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                          >
                            {item.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                ),
              )}
              <li>
                <Link
                  to="/admin/login"
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 text-inherit no-underline"
                >
                  Admin sign in
                </Link>
              </li>
              <li className="pt-6">
                <Link
                  to="/intake"
                  className="inline-flex w-full items-center justify-center rounded-full border-[1.8px] border-current py-4 text-[0.7rem] font-bold uppercase tracking-[0.16em] no-underline"
                  onClick={() => setMobileOpen(false)}
                >
                  CONTACT US
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
