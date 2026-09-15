import { Carousel } from '@mantine/carousel'
import { CaretLeftIcon } from '@phosphor-icons/react/CaretLeft'
import { CaretRightIcon } from '@phosphor-icons/react/CaretRight'
import { useTranslation } from 'react-i18next'

import { localized, type AppStreamScreenshot } from '../utils/appstream'

import styles from './ScreenshotCarousel.module.css'

type ScreenshotCarouselProps = {
  screenshots: AppStreamScreenshot[]
}

export default function ScreenshotCarousel({ screenshots }: ScreenshotCarouselProps) {
  const { t, i18n } = useTranslation()

  if (screenshots.length === 0) {
    return null
  }

  // A single screenshot has nothing to navigate to
  const navigable = screenshots.length > 1

  return (
    <Carousel
      aria-label={t('detail.screenshots')}
      classNames={{
        control: styles.control,
        controls: styles.controls,
        indicator: styles.indicator,
        indicators: styles.indicators,
        root: styles.carousel,
        viewport: styles.viewport,
      }}
      controlSize={28}
      emblaOptions={{ loop: true }}
      getIndicatorProps={(index) => ({
        'aria-label': t('detail.goToScreenshot', { index: index + 1 }),
      })}
      nextControlIcon={<CaretRightIcon size={18} />}
      nextControlProps={{ 'aria-label': t('detail.nextScreenshot') }}
      previousControlIcon={<CaretLeftIcon size={18} />}
      previousControlProps={{ 'aria-label': t('detail.previousScreenshot') }}
      withControls={navigable}
      withIndicators={navigable}
    >
      {screenshots.map((screenshot, position) => {
        const caption = localized(screenshot.caption, i18n.language)
        return (
          <Carousel.Slide
            aria-label={`${position + 1} / ${screenshots.length}`}
            className={styles.slide}
            component='figure'
            key={`${screenshot.url}-${position}`}
          >
            <img
              alt={caption ?? ''}
              className={styles.image}
              draggable={false}
              loading='lazy'
              src={screenshot.url}
            />
            {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
          </Carousel.Slide>
        )
      })}
    </Carousel>
  )
}
