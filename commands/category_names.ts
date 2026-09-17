import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import chalk from 'chalk'
import { XMLParser } from 'fast-xml-parser'

import { categories } from '#database/data/categories'
import { gettextMessages } from '#utils/gettext'

/**
 * Main categories of the freedesktop.org menu specification, which name the menu a group of
 * categories describes when several of its categories share a word with the name of the menu.
 */
const mainCategories = new Set([
  'AudioVideo',
  'Development',
  'Education',
  'Game',
  'Graphics',
  'Network',
  'Office',
  'Science',
  'Settings',
  'System',
  'Utility',
])

/**
 * Namespaces the menu specification reserves, which no AppStream component carries: a menu that
 * only holds them names no category of the catalog.
 */
const reservedPrefix = 'X-'

/** Names the menu specification reserves besides the namespaces. */
const reservedCategories = new Set(['Core', 'KDE'])

const xmlParser = new XMLParser({
  ignoreAttributes: true,
  isArray: (name) => ['Menu', 'Include', 'And', 'Or', 'Category', 'Not'].includes(name),
})

type ParsedMenu = {
  Directory?: string
  Include?: ParsedInclude[]
  Menu?: ParsedMenu[]
}

type ParsedInclude = {
  And?: ParsedGroup[]
  Or?: ParsedGroup[]
  Category?: string[]
}

type ParsedGroup = {
  Category?: string[]
  And?: ParsedGroup[]
  Or?: ParsedGroup[]
  Not?: ParsedGroup[]
}

/** A menu of the applications menu file, as far as the names of the categories are read from it. */
type MenuEntry = {
  /** Menu file that names the menu, e.g. `kf5-development.directory`, empty when it names none. */
  directory: string
  /** Categories of the first group of the first include, which the menu is named after. */
  categories: string[]
  /** Index of the menu above it, or nothing for a top level menu. */
  parent: number | null
  /** Whether menus are nested inside it. */
  hasChildren: boolean
}

/** Names of one menu file, keyed by the locale that translates them. */
type DirectoryNames = Record<string, string>

/**
 * Writes the display names of the catalog categories for the frontend, which reads them from a
 * static file instead of the database. The names are taken from the menu definitions of the
 * desktop, whose labels KDE translates into ninety-odd languages, and the categories the menus
 * leave out are filled in from the gettext catalogs of the desktop, which translate the identifiers
 * of the freedesktop menu specification. No translation is written by hand, every language file
 * names every category of the registry, and a category a language does not translate keeps an empty
 * value.
 */
export default class CategoryNames extends BaseCommand {
  static commandName = 'category:names'
  static description = 'Write the display names of the categories from the desktop'

  static options: CommandOptions = {
    // The categories to name are the registry of `database/data/categories`, not the catalog
    startApp: false,
  }

  @flags.string({
    description: 'Applications menu file of the desktop',
    default: '/etc/xdg/menus/plasma-applications.menu',
  })
  declare menu: string

  @flags.string({
    description: 'Directory that holds the menu name files',
    default: '/usr/share/desktop-directories',
  })
  declare directories: string

  @flags.string({
    description: 'Directory that holds the gettext catalogs of the desktop',
    default: '/usr/share/locale',
  })
  declare locales: string

  @flags.string({
    description: 'Text domain whose catalogs name the categories the menus leave out',
    default: 'icewm',
  })
  declare domain: string

  @flags.string({
    description: 'Directory the names are written to, as <locale>/categories.json',
    default: 'public/locales',
  })
  declare out: string

  async run() {
    const menus = this.readMenus(await readFile(this.menu, 'utf8'))
    const names = await this.readNames()
    // Only the categories of the registry are named, so that a message a catalog translates for
    // another purpose (`Back`, `Copy`) never reaches the file
    const codes = new Set(categories.map((category) => category.code))
    const catalogNames = await this.readCatalogNames(codes)
    // A directory that names several menus is the "More applications" view of every category, and
    // names none of them
    const reused = new Set(
      [...names.keys()].filter(
        (slug) => menus.filter((menu) => menu.directory === `${slug}.directory`).length > 1,
      ),
    )

    const assigned = new Map<string, [string, DirectoryNames]>()
    for (const menu of menus) {
      const slug = menu.directory.replace(/\.directory$/, '')
      const translations = names.get(slug)
      if (!translations || reused.has(slug) || menu.categories.length === 0) continue

      const remaining = menu.categories.filter((code) => !assigned.has(code))
      if (remaining.length === 0) continue

      const english = translations.en ?? slug
      // A menu that has menus below it names the category it groups even when its label is a word
      // of its own (`Internet` for `Network`, `Multimedia` for `AudioVideo`)
      const trusted = menu.hasChildren || remaining.some((code) => similar(english, code))
      const matched = remaining.filter((code) => similar(english, code))
      const main = matched.find((code) => mainCategories.has(code))
      if (matched.length > 0) {
        assigned.set(main ?? matched[0], [slug, translations])
      } else if (trusted && remaining.length === 1) {
        assigned.set(remaining[0], [slug, translations])
      }
    }

    // A menu without an include of its own groups the categories of the menus below it, and is
    // named after the category they share (`Education`)
    for (const [index, menu] of menus.entries()) {
      const slug = menu.directory.replace(/\.directory$/, '')
      const translations = names.get(slug)
      if (!translations || reused.has(slug) || menu.categories.length > 0) continue

      let shared: Set<string> | null = null
      for (const child of this.children(menus, index)) {
        const childCategories = new Set(child.categories)
        shared = shared === null ? childCategories : shared.intersection(childCategories)
      }

      const candidates = [...(shared ?? [])].filter((code) => !assigned.has(code))
      if (candidates.length === 1) assigned.set(candidates[0], [slug, translations])
    }

    // A menu names the category it shows, so the names of the menus come first and the catalogs of
    // the desktop only fill in the languages and the categories they leave out
    const output: Record<string, DirectoryNames> = {}
    const sources: Record<string, string> = {}
    for (const [code, [slug, translations]] of assigned) {
      output[code] = { ...translations }
      sources[code] = slug
    }
    for (const [language, named] of catalogNames) {
      for (const [code, name] of Object.entries(named)) {
        if (!output[code]) {
          output[code] = {}
          sources[code] = this.domain
        }
        if (!output[code][language]) output[code][language] = name
      }
    }

    // A category the desktop translates into no language at all still gets a key of its own, so
    // that every file names every category
    for (const { code } of categories) if (!output[code]) output[code] = {}

    const namedCodes = Object.keys(output).sort((left, right) => left.localeCompare(right))
    for (const code of namedCodes) {
      output[code] = Object.fromEntries(
        Object.entries(output[code]).sort(([left], [right]) => left.localeCompare(right)),
      )
      this.logger.info(
        `${chalk.green(code.padEnd(16))} ${(sources[code] ?? '').padEnd(36)}` +
          chalk.dim(` ${output[code].en ?? code} (${Object.keys(output[code]).length} locales)`),
      )
    }

    // Every language names every category, translated or not, so that the keys are the same in
    // every file and a name that is still missing is visible where it belongs
    const languages = new Set<string>()
    for (const code of namedCodes) {
      for (const language of Object.keys(output[code])) languages.add(language)
    }

    const files: Record<string, Record<string, string>> = {}
    for (const language of languages) files[language] = {}
    for (const code of namedCodes) {
      // A language that does not translate a category keeps the key with an empty value, which the
      // interface reads as the fallback language and, failing that, as the code of the category
      for (const language of languages) {
        files[language][code] = output[code][language] ?? ''
      }
    }

    for (const [language, translated] of Object.entries(files).sort(([left], [right]) =>
      left.localeCompare(right),
    )) {
      await mkdir(join(this.out, language), { recursive: true })
      await writeFile(
        join(this.out, language, 'categories.json'),
        `${JSON.stringify(translated, null, 2)}\n`,
      )
    }

    this.logger.info(
      `${namedCodes.length} categories in ${languages.size} languages, written to ${chalk.cyan(this.out)}`,
    )
  }

  /** Menus of an applications menu file in document order, which is the order they are named in. */
  private readMenus(xml: string): MenuEntry[] {
    const parsed = xmlParser.parse(xml) as { Menu?: ParsedMenu[] }
    const menus: MenuEntry[] = []

    // Menu indices are kept while the menus are read, so that the menus nested inside one stay
    // linked to it
    const collect = (group: ParsedMenu[] | undefined, parent: number | null) => {
      for (const menu of group ?? []) {
        const index = menus.push({
          directory: menu.Directory ?? '',
          categories: categoriesOf(menu.Include?.[0]),
          parent,
          hasChildren: (menu.Menu ?? []).length > 0,
        })
        collect(menu.Menu, index - 1)
      }
    }

    collect(parsed.Menu, null)
    return menus
  }

  /** Name files of every menu, keyed by the menu they belong to. */
  private async readNames(): Promise<Map<string, DirectoryNames>> {
    const names = new Map<string, DirectoryNames>()
    for (const file of await readdir(this.directories)) {
      // KDE names the menus of Plasma 5 in `kf5-*.directory` and the ones of Plasma 6 in `kf6-*`
      if (!/^kf\d+-.+\.directory$/.test(file)) continue

      names.set(
        file.replace(/\.directory$/, ''),
        namesOf(await readFile(join(this.directories, file), 'utf8')),
      )
    }
    return names
  }

  /**
   * Names of the categories as the gettext catalogs of the desktop translate them. The freedesktop
   * menu specification fixes the identifiers of the categories and every catalog translates all of
   * them, which reaches the subcategories (`ActionGame`, `AudioVideoEditing`) that the menus of the
   * desktop do not name at all.
   */
  private async readCatalogNames(codes: Set<string>): Promise<Map<string, DirectoryNames>> {
    const catalogNames = new Map<string, DirectoryNames>()
    for (const locale of await readdir(this.locales)) {
      // A language variant of a script (`sr@latin`) or of an encoding (`zh_CN.GB18030`) is left
      // out, since the interface cannot ask for one
      if (locale.includes('@') || locale.includes('.')) continue

      let content: Buffer
      try {
        content = await readFile(join(this.locales, locale, 'LC_MESSAGES', `${this.domain}.mo`))
      } catch {
        continue
      }

      const named: DirectoryNames = {}
      for (const [code, name] of gettextMessages(content)) {
        if (codes.has(code)) named[code] = name
      }

      if (Object.keys(named).length > 0) catalogNames.set(locale.replace('_', '-'), named)
    }
    return catalogNames
  }

  /** Menus nested inside a menu. */
  private children(menus: MenuEntry[], index: number) {
    return menus.filter((menu) => menu.parent === index)
  }
}

/** Categories of the first group of an include, which the menu that carries it is named after. */
function categoriesOf(include: ParsedInclude | undefined): string[] {
  if (!include) return []

  const group = categoriesIn(include.And?.[0] ?? include.Or?.[0])
  const codes = group.length > 0 ? group : (include.Category ?? [])
  return codes.filter((code) => !code.startsWith(reservedPrefix) && !reservedCategories.has(code))
}

/** Categories of a group, which may nest further groups and excludes the ones it rules out. */
function categoriesIn(group: ParsedGroup | undefined): string[] {
  if (!group) return []

  return [
    ...(group.Category ?? []),
    ...(group.And ?? []).flatMap((nested) => categoriesIn(nested)),
    ...(group.Or ?? []).flatMap((nested) => categoriesIn(nested)),
  ]
}

/**
 * Names of a menu file. The labels are written in the `Name` key of the desktop entry format, the
 * untranslated one first and one per language after it (`Name[zh_CN]`). The tags are turned into
 * the language tags the interface uses, and the variants that name a script or a region of a
 * language (`sr@latin`) are left out, since the interface cannot ask for them.
 */
function namesOf(content: string): DirectoryNames {
  const names: DirectoryNames = {}
  for (const line of content.split('\n')) {
    const match = line.match(/^Name(?:\[([^\]]+)\])?=(.*)$/)
    if (!match) continue

    const [, tag, text] = match
    const name = text.trim()
    if (!name) continue

    if (!tag) {
      names.en = name
      continue
    }

    if (tag.includes('@')) continue
    names[tag.replace('_', '-')] = name
  }
  return names
}

/** Whether a menu name and a category code share a word, which pairs `Board` with `BoardGame`. */
function similar(name: string, code: string) {
  return words(name).some((left) => words(code).some((right) => shares(left, right)))
}

function shares(left: string, right: string) {
  return left.startsWith(right) || right.startsWith(left)
}

/** Words of a name, split at camelCase, dashes and spaces and lower cased. */
function words(text: string) {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .map((word) => word.toLowerCase())
    .filter((word) => word.length >= 3)
}
