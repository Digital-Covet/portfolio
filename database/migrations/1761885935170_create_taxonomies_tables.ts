import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sectors'

  async up() {
    this.schema.createTable('sectors', (table) => {
      table.increments('id').notNullable()
      table.string('name', 120).notNullable().unique()
      table.string('slug', 140).notNullable().unique()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable('industries', (table) => {
      table.increments('id').notNullable()
      table
        .integer('sector_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('sectors')
        .onDelete('CASCADE')
      table.string('name', 120).notNullable()
      table.string('slug', 140).notNullable().unique()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.unique(['sector_id', 'name'])
    })

    this.schema.createTable('key_businesses', (table) => {
      table.increments('id').notNullable()
      table
        .integer('industry_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('industries')
        .onDelete('CASCADE')
      table.string('name', 120).notNullable()
      table.string('slug', 140).notNullable().unique()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.unique(['industry_id', 'name'])
    })

    for (const name of ['work_categories', 'services', 'business_models']) {
      this.schema.createTable(name, (table) => {
        table.increments('id').notNullable()
        table.string('name', 120).notNullable().unique()
        table.string('slug', 140).notNullable().unique()
        table.timestamp('created_at').notNullable()
        table.timestamp('updated_at').nullable()
      })
    }
  }

  async down() {
    for (const name of [
      'business_models',
      'services',
      'work_categories',
      'key_businesses',
      'industries',
      'sectors',
    ]) {
      this.schema.dropTable(name)
    }
  }
}
