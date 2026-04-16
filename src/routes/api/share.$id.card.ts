import { createFileRoute } from '@tanstack/react-router'

import { renderSharePaletteCard } from '#/server/services/share-palette-card'
import { getShareById, toShareErrorResponse } from '#/server/services/share'

export const Route = createFileRoute('/api/share/$id/card')({
  server: {
    handlers: {
      GET: async ({ params, request, context }) => {
        try {
          const share = await getShareById(params.id, { request, context })

          if (!share) {
            return new Response('Share not found', {
              status: 404,
              headers: { 'content-type': 'text/plain; charset=utf-8' },
            })
          }

          const mode = readModeOverride(request)
          const card = renderSharePaletteCard(
            share,
            mode ? { mode } : undefined,
          )

          return new Response(card, {
            status: 200,
            headers: {
              'content-type': 'image/svg+xml; charset=utf-8',
              'cache-control': 'public, max-age=3600',
            },
          })
        } catch (error) {
          return toShareErrorResponse(error)
        }
      },
    },
  },
})

function readModeOverride(request: Request) {
  const value = new URL(request.url).searchParams.get('mode')
  if (value === 'light' || value === 'dark') {
    return value
  }
  return null
}
