import { Effect } from 'effect'
import { InvalidCredentials } from '#errors/auth'
import { runRequestEffect } from '#effect/runtime'
import { AuthService } from '#services/auth_service'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/login', {})
  }

  async store(ctx: HttpContext) {
    const { request, auth, response, session } = ctx
    const { email, password } = await request.validateUsing(loginValidator)

    let user
    try {
      user = await runRequestEffect(
        ctx,
        Effect.gen(function* () {
          const authService = yield* AuthService
          return yield* authService.verifyLogin(email, password)
        })
      )
    } catch (error) {
      if (error instanceof InvalidCredentials) {
        session.flash('errors', {
          email: 'Invalid email or password',
          password: 'Invalid email or password',
        })
        return response.redirect().back()
      }
      throw error
    }

    await auth.use('web').login(user)
    return response.redirect().toRoute('dashboard')
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toRoute('session.create')
  }
}
