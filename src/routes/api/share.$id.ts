import { createFileRoute } from '@tanstack/react-router'

import {
  getShareById,
  toShareErrorResponse,
} from '#/server/services/share'

export const Route = createFileRoute('/api/share/$id')({
  server: {
    handlers: {
      GET: async ({ params, request, context }) => {
        try {
          const share = await getShareById(params.id, { request, context })

          if (!share) {
            return Response.json({ error: 'Share not found' }, { status: 404 })
          }

          return Response.json(share)
        } catch (error) {
          return toShareErrorResponse(error)
        }
      },
    },
  },
})
