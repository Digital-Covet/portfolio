/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'

const DashboardController = () => import('#controllers/dashboard_controller')
const CaseStudiesController = () => import('#controllers/case_studies_controller')
const SharesController = () => import('#controllers/shares_controller')
const SharePortalController = () => import('#controllers/share_portal_controller')
const TaxonomiesController = () => import('#controllers/taxonomies_controller')
const OauthController = () => import('#controllers/oauth_controller')
const ClientsController = () => import('#controllers/clients_controller')

router.on('/').renderInertia('home', {}).as('home')

router
  .group(() => {
    // IAM-only sign-in. No local credentials: POST /login and
    // GET/POST /signup were removed. The login page is a single
    // "Continue with Digital Covet IAM" redirect.
    router.get('login', [controllers.Session, 'create'])

    router.get('auth/iam', [OauthController, 'redirect']).as('oauth.redirect')
  })
  .use(middleware.guest())

// The callback must stay reachable when a Portfolio session already exists
// (re-login / account switch). It validates the one-time `state` + PKCE
// cookies itself, so guest middleware must not bounce it to `/` before it
// can exchange the code.
router.get('api/auth/oauth2/callback/portfolio', [OauthController, 'callback']).as('oauth.callback')

router
  .group(() => {
    router.get('/dashboard', [DashboardController, 'index']).as('dashboard')
    router.get('/case-studies', [CaseStudiesController, 'index']).as('caseStudies')
    router.get('/case-studies/new', [CaseStudiesController, 'new']).as('caseStudyNew')
    router.post('/case-studies', [CaseStudiesController, 'store']).as('caseStudyStore')
    router.get('/case-studies/:id', [CaseStudiesController, 'show']).as('caseStudyShow')
    router.get('/case-studies/:id/edit', [CaseStudiesController, 'edit']).as('caseStudyEdit')
    router.put('/case-studies/:id', [CaseStudiesController, 'update']).as('caseStudyUpdate')
    router
      .post('/case-studies/:id/publish', [CaseStudiesController, 'publish'])
      .as('caseStudyPublish')
    router.get('/shares', [SharesController, 'index']).as('shares')
    router.get('/shares/new', [SharesController, 'new']).as('shareNew')
    router.post('/shares', [SharesController, 'store']).as('shareStore')
    router.get('/shares/preview', [SharesController, 'preview']).as('sharePreview')
    router.get('/shares/:id', [SharesController, 'show']).as('shareShow')
    router.get('/shares/:id/edit', [SharesController, 'edit']).as('shareEdit')
    router.put('/shares/:id', [SharesController, 'update']).as('shareUpdate')
    router.delete('/shares/:id', [SharesController, 'destroy']).as('shareDestroy')
    router.post('logout', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())

// Admin+ only. Employees are redirected to /dashboard by admin middleware.
// Taxonomies and clients are fully managed here; no employee-readable view.
router
  .group(() => {
    router.get('/taxonomies', [TaxonomiesController, 'index']).as('taxonomies')
    router.post('/taxonomies/:type', [TaxonomiesController, 'store']).as('taxonomyStore')
    router.put('/taxonomies/:type/:id', [TaxonomiesController, 'update']).as('taxonomyUpdate')
    router.delete('/taxonomies/:type/:id', [TaxonomiesController, 'destroy']).as('taxonomyDestroy')
    router.get('/clients', [ClientsController, 'index']).as('clients')
    router.post('/clients', [ClientsController, 'store']).as('clientStore')
    router.put('/clients/:id', [ClientsController, 'update']).as('clientUpdate')
    router.delete('/clients/:id', [ClientsController, 'destroy']).as('clientDestroy')
  })
  .use([middleware.auth(), middleware.admin()])

router
  .get('api/auth/front-channel-logout', [OauthController, 'frontChannelLogout'])
  .as('oauth.frontChannelLogout')

// Public share portal (route A: distinct prefix avoids collision with
// staff /shares/new and /shares/:id; SSR-friendly, noindex at edge/proxy).
router.get('/s/:token', [SharePortalController, 'show']).as('sharePortal')
router.post('/s/:token/unlock', [SharePortalController, 'unlock']).as('shareUnlock')
