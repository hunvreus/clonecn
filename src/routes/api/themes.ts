import { createFileRoute } from '@tanstack/react-router'

import {
  listShares,
  toShareErrorResponse,
} from '#/server/services/share'
import { resolveThemeVars } from '#/server/services/theme-vars'

export const Route = createFileRoute('/api/themes')({
  server: {
    handlers: {
      GET: async ({ request, context }) => {
        const url = new URL(request.url)
        const limit = Number(url.searchParams.get('limit') ?? '24')

        try {
          const shares = await listShares({ limit }, { request, context })
          const themes = shares.map((share) => {
            const vars = resolveThemeVars(share.css, share.mode)
            return {
              id: share.id,
              mode: share.mode,
              style: share.style,
              createdAt: share.createdAt,
              colors: {
                background: vars.background,
                foreground: vars.foreground,
                primary: vars.primary,
                secondary: vars.secondary,
                accent: vars.accent,
              },
            }
          })

          return Response.json({ themes })
        } catch (error) {
          return toShareErrorResponse(error)
        }
      },
    },
  },
})
