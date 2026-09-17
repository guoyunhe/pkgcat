/**
 * Package formats accepted by the package validator (see `app/validators/pkg.ts`). Files are also
 * recognized by their archive magic, but these are the types that can be filtered or entered by
 * hand.
 */
export const packageTypes = ['deb', 'rpm', 'pacman', 'appimage', 'flatpak', 'snap', 'tar.gz']
