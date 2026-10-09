import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import DashboardService, { RANGES, type Range } from '#services/dashboard_service'

export default class DashboardController {
  /**
   * Every prop is a closure so a partial reload (`only: ['views']`) runs just that
   * query. `views` resolves to null on failure, which the page shows as an inline
   * "Couldn't load views" with Retry instead of failing the whole dashboard.
   */
  async show({ inertia, request }: HttpContext) {
    const service = new DashboardService()
    const requested = request.input('range')
    const range: Range = RANGES.includes(requested) ? requested : '30d'

    return inertia.render('dashboard', {
      today: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      }),
      stats: () => service.stats(),
      shareHealth: () => service.shareHealth(),
      attention: () => service.attention(),
      latest: () => service.latest(),
      views: async () => {
        try {
          return await service.views(range)
        } catch (error) {
          logger.error({ err: error }, 'dashboard views query failed')
          return null
        }
      },
    })
  }
}
