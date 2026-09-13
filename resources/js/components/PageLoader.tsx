import { Loader } from '@mantine/core'

import styles from './PageLoader.module.css'

/** Stand-in shown while the code of a lazily loaded page is being downloaded. */
export default function PageLoader() {
  return (
    <div className={styles.page}>
      <Loader color='orange' />
    </div>
  )
}
