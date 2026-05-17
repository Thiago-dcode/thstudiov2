import { cn } from '@repo/ui/lib/utils'

/**
 * ComboboxInput passes `className` to InputGroup. Defaults are h-9; inner Input also uses h-9/py-5,
 * and the inline-end addon uses padding that would exceed a compact row. The descendant selectors
 * keep the real input and trigger strip aligned with !h-7 without changing the shared UI components.
 */
export const artistsFilterComboboxInputClassName = cn(
    'w-full min-h-7 rounded-sm',
    '[&_[data-slot=input-group-control]]:!h-7 [&_[data-slot=input-group-control]]:min-h-0',
    '[&_[data-slot=input-group-control]]:py-0 [&_[data-slot=input-group-control]]:px-2',
    '[&_[data-slot=input-group-control]]:text-[11px] [&_[data-slot=input-group-control]]:leading-tight',
    '[&_[data-slot=input-group-addon]]:pr-1.5 [&_[data-slot=input-group-addon]]:pl-0',
    '[&_[data-slot=input-group-addon]_button]:!size-5 [&_[data-slot=input-group-addon]_svg]:!size-3',
)
