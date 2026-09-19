import { Anchor, Text, Title } from '@mantine/core'
import { ArrowRightIcon } from '@phosphor-icons/react/ArrowRight'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import styles from './HomeSection.module.css'

type HomeSectionProps = {
  /** Line above the title, which names what the section belongs to. */
  eyebrow: string
  title: string
  /** Listing the section shows a part of, which the link next to its title opens. */
  href: string
  children: ReactNode
}

/**
 * One section of the home page: the line above its title, the title itself, the link to the listing
 * it shows a part of, and what the section holds. Every section of the page is built from it, so
 * that the titles of two sections are read at the same level and their spacing is written once.
 */
export default function HomeSection({ eyebrow, title, href, children }: HomeSectionProps) {
  const { t } = useTranslation()

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>{eyebrow}</Text>
          <Title order={2}>{title}</Title>
        </div>
        <Anchor component={Link} href={href}>
          {t('home.viewAll')} <ArrowRightIcon size={16} />
        </Anchor>
      </div>
      {children}
    </section>
  )
}
