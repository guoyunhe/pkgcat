import { Badge, Loader } from '@mantine/core'

type CountBadgeProps = {
  /** Number of results of the tab, when the listing has loaded. */
  count?: number
  loading: boolean
}

/** Number of results of a tab, shown next to its label while the listing loads. */
export default function CountBadge({ count, loading }: CountBadgeProps) {
  if (loading) {
    return <Loader color='orange' size={10} />
  }
  return (
    <Badge radius='sm' size='xs' variant='light'>
      {count ?? 0}
    </Badge>
  )
}
