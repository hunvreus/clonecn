import { createFileRoute } from '@tanstack/react-router'

import {
  createShare,
  toShareErrorResponse,
} from '#/server/services/share'

export const Route = createFileRoute('/api/share')({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        let payload: unknown

        try {
          payload = await request.json()
        } catch {
          return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        try {
          const { id } = await createShare(payload, { request, context })
          const origin = new URL(request.url).origin
          const path = `/share/${id}`

          return Response.json({
            id,
            path,
            url: `${origin}${path}`,
          })
        } catch (error) {
          return toShareErrorResponse(error)
        }
      },
    },
  },
})
