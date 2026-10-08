import { Effect } from 'effect'
import { EmailAlreadyTaken } from '#errors/auth'
import { runRequestEffect } from '#effect/runtime'
import { AuthService } from '#services/auth_service'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class NewAccountController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/signup', {})
  }

  async store(ctx: HttpContext) {
    const { request, response, auth, session } = ctx
    const { fullName, email, password } = await request.validateUsing(signupValidator)

    let user
    try {
      user = await runRequestEffect(
        ctx,
        Effect.gen(function* () {
          const authService = yield* AuthService
          return yield* authService.signup({ fullName, email, password })
        })
      )
    } catch (error) {
      if (error instanceof EmailAlreadyTaken) {
        session.flash('errors', { email: 'This email is already registered' })
        return response.redirect().back()
      }
      throw error
    }

    await auth.use('web').login(user)
    return response.redirect().toRoute('dashboard')
  }
}
