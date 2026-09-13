import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Localized text of an application. The name and the summary used to be JSON columns on `apps`,
 * which made every listing response carry every translation of every application and made sorting
 * or searching by name a full scan (`json_extract` cannot be indexed). One row per application and
 * locale keeps a listing down to the locale the client asks for, and the `(locale, name)` index
 * makes the localized name sortable.
 */
export default class extends BaseSchema {
  protected tableName = 'app_translations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('app_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('apps')
        .onDelete('CASCADE')

      table.string('locale', 16).notNullable()
      // A locale carries a name, a summary, or both: repositories may translate one without the
      // other, and an editor may complete a translation one field at a time
      table.string('name').nullable()
      table.text('summary').nullable()

      table.unique(['app_id', 'locale'])
      // Lookup of a page of applications in one locale, and the name sort
      table.index(['locale', 'name'])

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()
    })

    // Move the translations the applications already carry, then drop the JSON columns they used
    this.defer(async (db) => {
      const apps: Array<{ id: number; name: string | null; summary: string | null }> = await db
        .from('apps')
        .select('id', 'name', 'summary')

      for (const app of apps) {
        const names = parseLocalized(app.name)
        const summaries = parseLocalized(app.summary)
        for (const locale of new Set([...Object.keys(names), ...Object.keys(summaries)])) {
          const name = names[locale]?.trim() || null
          const summary = summaries[locale]?.trim() || null
          if (!locale || (!name && !summary)) continue
          await db.table(this.tableName).insert({ app_id: app.id, locale, name, summary })
        }
      }
    })

    this.schema.alterTable('apps', (table) => {
      table.dropColumn('name')
      table.dropColumn('summary')
    })
  }

  async down() {
    this.schema.alterTable('apps', (table) => {
      table.json('name').notNullable().defaultTo('{}')
      table.json('summary').notNullable().defaultTo('{}')
    })

    // Move the translations back into the JSON columns the applications carried before
    this.defer(async (db) => {
      const rows: Array<{
        app_id: number
        locale: string
        name: string | null
        summary: string | null
      }> = await db.from(this.tableName).select('app_id', 'locale', 'name', 'summary')

      const names = new Map<number, Record<string, string>>()
      const summaries = new Map<number, Record<string, string>>()
      const collect = (
        into: Map<number, Record<string, string>>,
        row: (typeof rows)[number],
        text: string | null,
      ) => {
        if (!text) return
        const translations = into.get(row.app_id) ?? {}
        translations[row.locale] = text
        into.set(row.app_id, translations)
      }
      for (const row of rows) {
        collect(names, row, row.name)
        collect(summaries, row, row.summary)
      }

      for (const appId of new Set([...names.keys(), ...summaries.keys()])) {
        await db
          .from('apps')
          .where('id', appId)
          .update({
            name: JSON.stringify(names.get(appId) ?? {}),
            summary: JSON.stringify(summaries.get(appId) ?? {}),
          })
      }
    })

    this.schema.dropTable(this.tableName)
  }
}

/**
 * Localized texts of a JSON column. The column is read as a plain string on some drivers and as an
 * already parsed object on others, and older rows may hold an empty or malformed value, so both are
 * accepted and anything else is treated as no translation at all.
 */
function parseLocalized(value: unknown): Record<string, string> {
  const parsed = typeof value === 'string' ? safeParse(value) : value
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

  const translations: Record<string, string> = {}
  for (const [locale, text] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof text !== 'string') continue
    const trimmed = text.trim()
    if (locale && trimmed) translations[locale] = trimmed
  }
  return translations
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
