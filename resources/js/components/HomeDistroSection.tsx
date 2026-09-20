import { Alert, Grid, Skeleton } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { emptyDistroFilters, getDistros, type Distro } from '../services/distros'
import DistroCard from './DistroCard'
import HomeSection from './HomeSection'

/**
 * Releases the section shows, which is the page of the listing it reads: a full grid of cards, of
 * which it fills one row after another.
 */
const distroCount = 12

/**
 * Width of a card, in the twelve columns of the grid: one to a row on a phone, two on a tablet,
 * three on a desktop.
 */
const cardSpan = { base: 12, xs: 6, sm: 4 }

/** Height of a card, which the skeleton that stands in for one is drawn at. */
const cardHeight = 180

/**
 * The releases the catalog is about on the home page: a page of the distribution listing in its
 * default order, which is the order of the releases the most users run. The cards are laid out by
 * the grid itself, which tells by the width of the page how many of them share a row, and a page
 * that is read shows the shape of the cards it will hold.
 */
export default function HomeDistroSection() {
  const { t, i18n } = useTranslation()
  const [distros, setDistros] = useState<Distro[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    getDistros('userCount', emptyDistroFilters, 1, distroCount)
      .then((page) => {
        if (active) setDistros(page.data)
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : t('home.loadError'))
      })

    return () => {
      active = false
    }
  }, [i18n.language, t])

  return (
    <HomeSection
      eyebrow={t('home.operatingSystems')}
      href='/distros'
      title={t('common.distributions')}
    >
      {error ? (
        <Alert color='red'>{error}</Alert>
      ) : (
        <Grid gap={18}>
          {Array.from({ length: distros?.length ?? distroCount }, (_, index) => {
            const distro = distros?.[index]
            return (
              <Grid.Col key={distro?.id ?? index} span={cardSpan}>
                {distro ? (
                  <DistroCard distro={distro} />
                ) : (
                  <Skeleton height={cardHeight} radius='sm' />
                )}
              </Grid.Col>
            )
          })}
        </Grid>
      )}
    </HomeSection>
  )
}
