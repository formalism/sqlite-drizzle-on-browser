import {
    sqliteTable, text, integer
} from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const test = sqliteTable('test', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name'),
})
