import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import BusinessModel from '#models/business_model'
import CaseStudy from '#models/case_study'
import CaseStudyMetric from '#models/case_study_metric'
import CaseStudyTestimonial from '#models/case_study_testimonial'
import Client from '#models/client'
import KeyBusiness from '#models/key_business'
import Service from '#models/service'
import WorkCategory from '#models/work_category'
import { CASE_STUDIES } from './data/case_studies.js'
import { ensureStaff } from './data/staff.js'

/**
 * Run after `taxonomy_seeder`. Idempotent: case studies are matched by slug and left
 * untouched when they already exist.
 */
export default class extends BaseSeeder {
  async run() {
    const { department, users } = await ensureStaff()

    for (const seed of CASE_STUDIES) {
      const existing = await CaseStudy.query()
        .where('slug', seed.slug)
        .whereNull('deleted_at')
        .first()
      if (existing) continue

      const creator = users[seed.creator]
      const client =
        (await Client.query().where('name', seed.client).whereNull('deleted_at').first()) ??
        (await Client.create({ name: seed.client, createdBy: creator.id }))

      const content = [
        seed.description,
        seed.challenge && `## Challenge\n\n${seed.challenge}`,
        seed.solution && `## Solution\n\n${seed.solution}`,
        seed.results && `## Results\n\n${seed.results}`,
      ]
        .filter(Boolean)
        .join('\n\n')

      const createdAt = DateTime.fromISO(seed.createdAt)
      const study = await CaseStudy.create({
        title: seed.title,
        slug: seed.slug,
        status: seed.status,
        contentMarkdown: content || null,
        clientId: client.id,
        departmentId: department.id,
        createdBy: creator.id,
        createdAt,
        updatedAt: createdAt,
      })

      const keyBusinessIds = await resolveIds(seed.keyBusinesses, async (name) => {
        const keyBusiness = await KeyBusiness.findByOrFail('name', name)
        return keyBusiness.id
      })
      await study.related('keyBusinesses').attach(keyBusinessIds)
      await study
        .related('workCategories')
        .attach(await resolveIds(seed.workCategories, findOrCreateId(WorkCategory)))
      await study
        .related('services')
        .attach(await resolveIds(seed.services, findOrCreateId(Service)))
      await study
        .related('businessModels')
        .attach(await resolveIds(seed.businessModels, findOrCreateId(BusinessModel)))

      for (const [index, metric] of (seed.metrics ?? []).entries()) {
        await CaseStudyMetric.create({ caseStudyId: study.id, ...metric, sortOrder: index })
      }
      if (seed.testimonial) {
        await CaseStudyTestimonial.create({
          caseStudyId: study.id,
          ...seed.testimonial,
          sortOrder: 0,
        })
      }
    }
  }
}
async function resolveIds(names: string[] | undefined, resolve: (name: string) => Promise<string>) {
  return Promise.all((names ?? []).map(resolve))
}

function findOrCreateId(model: typeof WorkCategory | typeof Service | typeof BusinessModel) {
  return async (name: string) => {
    const row = await model.firstOrCreate({ name })
    return row.id
  }
}
