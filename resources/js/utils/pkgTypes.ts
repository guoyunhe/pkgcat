/**
 * Package formats accepted by the package validator (see `app/validators/pkg.ts`). Files are also
 * recognized by their archive magic, but these are the types that can be filtered or entered by
 * hand.
 */
export const packageTypes = ['deb', 'rpm', 'pacman', 'appimage', 'flatpak', 'snap', 'tar.gz']

/**
 * Package formats no release carries: an AppImage or a tarball is handed out as a file, and a
 * Flatpak or a Snap is published by its own store, so a listing of one is not narrowed by a
 * release.
 */
export const distroIndependentPackageTypes = ['appimage', 'flatpak', 'snap', 'tar.gz']
