'use client'

import * as Icons from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & {
  lucide?: string
  tabler?: string
  hugeicons?: string
  phosphor?: string
  remixicon?: string
}

export function IconPlaceholder({ lucide, ...props }: IconProps) {
  const Icon =
    lucide && lucide in Icons
      ? (Icons[lucide as keyof typeof Icons] as ComponentType<IconProps>)
      : Icons.SquareIcon

  return <Icon {...props} />
}
