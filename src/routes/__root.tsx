import * as React from 'react'
import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { Button } from '#/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '#/components/ui/empty'
import { TooltipProvider } from '#/components/ui/tooltip'

import appCss from '../styles.css?url'
import lumaCss from '../theme/style-luma.css?url'
import lyraCss from '../theme/style-lyra.css?url'
import maiaCss from '../theme/style-maia.css?url'
import miraCss from '../theme/style-mira.css?url'
import novaCss from '../theme/style-nova.css?url'
import vegaCss from '../theme/style-vega.css?url'

const STYLE_LINK_ID_PREFIX = 'clonecn-style-css'
const THEME_STYLE_ID = 'clonecn-theme-vars'
const SITE_URL = 'https://clonecn.com'
const SOCIAL_IMAGE_URL = `${SITE_URL}/social-card.png`
const SITE_TITLE = 'clonecn'
const SITE_DESCRIPTION =
  'Generate and preview shadcn/ui themes from screenshots, URLs, and style directions.'
const STYLE_CSS_URLS = {
  nova: novaCss,
  vega: vegaCss,
  maia: maiaCss,
  lyra: lyraCss,
  mira: miraCss,
  luma: lumaCss,
} as const

const THEME_INIT_SCRIPT = `(function(){try{var root=document.documentElement;var hash=new URLSearchParams(location.hash.replace(/^#/,''));var mode=hash.get('mode');var savedMode=localStorage.getItem('clonecn-mode');if(mode!=='dark'&&mode!=='light'){mode=savedMode==='dark'||savedMode==='light'?savedMode:'light';}var style=hash.get('style')||'nova';var styles=${JSON.stringify(STYLE_CSS_URLS)};if(!styles[style]){style='nova';}Object.keys(styles).forEach(function(item){var id='${STYLE_LINK_ID_PREFIX}-'+item;var link=document.getElementById(id);if(!link){link=document.createElement('link');link.id=id;link.rel='stylesheet';link.href=styles[item];document.head.appendChild(link);}if(link.getAttribute('href')!==styles[item]){link.setAttribute('href',styles[item]);}link.media=item===style?'all':'not all';});var css=hash.get('css');if(css){try{var normalized=css.replace(/-/g,'+').replace(/_/g,'/');var padded=normalized.padEnd(normalized.length+((4-(normalized.length%4))%4),'=');var binary=atob(padded);var bytes=Uint8Array.from(binary,function(char){return char.charCodeAt(0);});var decoded=new TextDecoder().decode(bytes);var themeStyle=document.getElementById('${THEME_STYLE_ID}');if(!themeStyle){themeStyle=document.createElement('style');themeStyle.id='${THEME_STYLE_ID}';document.head.appendChild(themeStyle);}if(themeStyle.textContent!==decoded){themeStyle.textContent=decoded;}}catch(e){}}root.classList.toggle('dark',mode==='dark');root.style.colorScheme=mode==='dark'?'dark':'light';['nova','vega','maia','lyra','mira','luma'].forEach(function(item){root.classList.toggle('style-'+item,item===style);});}catch(e){}})();`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: SITE_TITLE,
      },
      {
        name: 'description',
        content: SITE_DESCRIPTION,
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:title',
        content: SITE_TITLE,
      },
      {
        property: 'og:description',
        content: SITE_DESCRIPTION,
      },
      {
        property: 'og:url',
        content: SITE_URL,
      },
      {
        property: 'og:image',
        content: SOCIAL_IMAGE_URL,
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: SITE_TITLE,
      },
      {
        name: 'twitter:description',
        content: SITE_DESCRIPTION,
      },
      {
        name: 'twitter:image',
        content: SOCIAL_IMAGE_URL,
      },
    ],
    links: [
      {
        rel: 'canonical',
        href: SITE_URL,
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/favicon.svg',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <Empty className="max-w-lg rounded-xl border bg-card px-6 py-8">
        <EmptyHeader className="gap-2">
          <EmptyTitle className="text-2xl font-semibold tracking-tight">
            Page not found
          </EmptyTitle>
          <EmptyDescription className="text-sm">
            The page you are looking for does not exist.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="mt-6">
          <Button asChild size="sm">
            <Link to="/">Back to clonecn</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <OptionalDevtools />
        <Scripts />
      </body>
    </html>
  )
}

function OptionalDevtools() {
  const [enabled, setEnabled] = React.useState(false)

  React.useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    const params = new URLSearchParams(window.location.search)
    setEnabled(params.get('devtools') === '1')
  }, [])

  if (!import.meta.env.DEV || !enabled) {
    return null
  }

  return (
    <TanStackDevtools
      config={{
        position: 'bottom-right',
      }}
      plugins={[
        {
          name: 'Tanstack Router',
          render: <TanStackRouterDevtoolsPanel />,
        },
      ]}
    />
  )
}
