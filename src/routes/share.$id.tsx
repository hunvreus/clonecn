import { createFileRoute } from '@tanstack/react-router'

import { ThemePage } from '#/routes/preview'

export const Route = createFileRoute('/share/$id')({
  component: SharedThemeRoute,
})

function SharedThemeRoute() {
  const { id } = Route.useParams()
  return <ThemePage shareId={id} />
}
