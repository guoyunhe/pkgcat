import { Container } from '@mantine/core'

import HomeAppSection from '../components/HomeAppSection'
import HomeDistroSection from '../components/HomeDistroSection'

/**
 * The home page: what the catalog is about, the applications of it and the releases it serves, each
 * in a section that reads what it shows itself and stands in for it while it is read.
 */
export default function HomePage() {
  return (
    <Container component='main' size='md'>
      <HomeAppSection />
      <HomeDistroSection />
    </Container>
  )
}
