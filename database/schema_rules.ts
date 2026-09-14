import type { ColumnInfo, SchemaRules } from '@adonisjs/lucid/types/schema_generator'

/**
 * Factory for JSON column rules. Returns a `ColumnInfo` with JSON serialize/deserialize decorators
 * and the given TS type.
 */
function jsonColumn(tsType: string): ColumnInfo {
  return {
    tsType,
    decorators: [
      {
        name: '@column',
        args: {
          prepare: (value: any) => (value ? JSON.stringify(value) : value),
          consume: (value: any) => (typeof value === 'string' ? JSON.parse(value) : value),
        },
      },
    ],
  }
}

export default {
  tables: {
    apps: {
      columns: {
        name: jsonColumn('Record<string, string>'),
        summary: jsonColumn('Record<string, string>'),
        description: jsonColumn('Record<string, string>'),
      },
    },
  },
} satisfies SchemaRules
