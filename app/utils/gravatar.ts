import { createHash } from 'node:crypto'

/** Size the Gravatar is read at, which covers the profile page as well as the small avatars. */
const gravatarSize = 256

/**
 * Gravatar of an email address: the image the address is registered with, or the default image of
 * the service for an address that has none, which makes the URL something that always renders.
 */
export function gravatarUrl(email: string, size = gravatarSize) {
  const hash = createHash('md5').update(email.trim().toLowerCase()).digest('hex')
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp`
}
