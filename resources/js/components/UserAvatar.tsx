import type { Data } from '@generated/data'
import { Avatar } from '@mantine/core'

/** What an avatar is read from, which every user a page holds carries. */
type AvatarUser = Pick<Data.User, 'avatar' | 'gravatarUrl' | 'name'>

type UserAvatarProps = {
  user: AvatarUser
  size?: number
}

/**
 * Picture of a user wherever one is shown: the avatar the account uploaded, and the Gravatar of its
 * email address while it has none. Mantine draws the initials of the name should neither load.
 */
export default function UserAvatar({ size = 40, user }: UserAvatarProps) {
  return (
    <Avatar
      alt={user.name}
      name={user.name}
      size={size}
      src={user.avatar?.url ?? user.gravatarUrl}
    />
  )
}
