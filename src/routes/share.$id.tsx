import { createFileRoute } from '@tanstack/react-router'

import { ThemePage } from '#/routes/index'

export const Route = createFileRoute('/share/$id')({
  component: SharedThemeRoute,
})

function SharedThemeRoute() {
  const { id } = Route.useParams()
  return <ThemePage shareId={id} />
}
