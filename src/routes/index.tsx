import { createFileRoute } from '@tanstack/react-router'

import { ThemePage } from '#/routes/preview'

export const Route = createFileRoute('/')({ component: HomeRoute })

function HomeRoute() {
  return <ThemePage />
}
