import { Button } from '@mantine/core'
import { ArrowSquareOutIcon } from '@phosphor-icons/react/ArrowSquareOut'
import { useTranslation } from 'react-i18next'

/**
 * Form an application the catalog does not hold is asked for, which is an issue of the repository
 * of the catalog: it asks for the metadata an entry of the catalog is written from, so a request
 * can be taken into the catalog as it is.
 */
const appRequestUrl = 'https://github.com/guoyunhe/pkgcat/issues/new?template=app-request.yaml'

/**
 * Button that asks for an application the catalog does not hold yet, which the application listing
 * offers beside its heading and the listing of a search that found nothing below its message.
 */
export default function AppRequestButton() {
  const { t } = useTranslation()

  return (
    <Button
      component='a'
      href={appRequestUrl}
      leftSection={<ArrowSquareOutIcon size={18} />}
      target='_blank'
    >
      {t('apps.request')}
    </Button>
  )
}
