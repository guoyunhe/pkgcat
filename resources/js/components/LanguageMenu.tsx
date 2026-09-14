import { ActionIcon, Combobox, Group, useCombobox } from '@mantine/core'
import { CheckIcon } from '@phosphor-icons/react/Check'
import { GlobeIcon } from '@phosphor-icons/react/Globe'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { languageLabel, supportedLocales } from '../utils/languages'

/**
 * Language of the interface, picked from every language the catalog carries. The control is an
 * icon, so the list brings its own search box (there is no input to type in) and each language is
 * named in its own language, which is what a reader of it recognizes, whatever the interface is
 * shown in.
 */
export default function LanguageMenu() {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState('')
  const currentLanguage = i18n.resolvedLanguage ?? 'en'
  const languages = useMemo(
    () => supportedLocales().map((tag) => ({ value: tag, label: languageLabel(tag) })),
    [],
  )
  const visibleLanguages = useMemo(() => {
    const wanted = query.trim().toLowerCase()
    if (!wanted) return languages
    return languages.filter((language) =>
      `${language.label} ${language.value}`.toLowerCase().includes(wanted),
    )
  }, [languages, query])
  const combobox = useCombobox({
    onDropdownClose: () => {
      setQuery('')
      combobox.resetSelectedOption()
    },
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('selected', { scrollIntoView: true }),
  })
  const dropdownOpened = combobox.dropdownOpened

  // The button is not an input, so it is the dropdown itself that moves the focus into the search box
  // (`ComboboxProps` carries no `trapFocus`)
  useEffect(() => {
    if (dropdownOpened) combobox.focusSearchInput()
  }, [combobox, dropdownOpened])

  return (
    <Combobox
      position='bottom-end'
      shadow='md'
      store={combobox}
      width={220}
      onOptionSubmit={(language) => {
        void i18n.changeLanguage(language)
        combobox.closeDropdown()
      }}
    >
      <Combobox.Target targetType='button' withExpandedAttribute>
        <ActionIcon
          aria-label={t('language')}
          size='lg'
          title={languageLabel(currentLanguage)}
          variant='default'
          onClick={() => combobox.toggleDropdown()}
        >
          <GlobeIcon size={18} />
        </ActionIcon>
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Search
          placeholder={t('searchLanguage')}
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value)
            combobox.updateSelectedOptionIndex()
          }}
        />
        {visibleLanguages.length === 0 ? (
          <Combobox.Empty>{t('noLanguage')}</Combobox.Empty>
        ) : (
          <Combobox.Options mah={280} style={{ overflowY: 'auto' }}>
            {visibleLanguages.map((language) => (
              <Combobox.Option
                key={language.value}
                selected={language.value === currentLanguage}
                value={language.value}
              >
                <Group gap='xs' justify='space-between' wrap='nowrap'>
                  <span>{language.label}</span>
                  {language.value === currentLanguage ? <CheckIcon size={14} /> : null}
                </Group>
              </Combobox.Option>
            ))}
          </Combobox.Options>
        )}
      </Combobox.Dropdown>
    </Combobox>
  )
}
