import type { Distro } from '../services/distros'

import styles from './DistroRelease.module.css'

type DistroReleaseProps = {
  /** The entry to name; only the fields that name it are read. */
  distro: Pick<Distro, 'arch' | 'name' | 'version'>
  /**
   * Architecture of the entry the release is shown next to. The architecture of a release is left
   * out when the two agree, so that a relation between two entries of one architecture reads as the
   * same release, and it is named when they differ.
   */
  arch?: string
  /**
   * Name the architecture even though nothing sits next to the release, which is how a release that
   * stands on its own is named: the distribution a user runs, or the one a review was written on.
   */
  showArch?: boolean
}

/**
 * One entry of the catalog, named the same way wherever it is shown: the icon of the distribution,
 * its name, and the release it is. The distribution column and the compatibilities of an entry hold
 * the same kind of value, so both read alike.
 *
 * A rolling release carries no version, which is why it is named by its distribution alone.
 */
export default function DistroRelease({ arch, distro, showArch }: DistroReleaseProps) {
  const namesArch = showArch || (arch !== undefined && arch !== distro.arch)

  return (
    <span className={styles.release}>
      <img alt='' className={styles.icon} src={`/distros/${encodeURIComponent(distro.name)}.svg`} />
      <span className={styles.name}>
        {distro.version ? `${distro.name} ${distro.version}` : distro.name}
      </span>
      {namesArch && <span className={styles.arch}>({distro.arch})</span>}
    </span>
  )
}
