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

// No marketing page: the auth middleware sends signed-out visitors on to /login.
router.get('/', ({ response }) => response.redirect('/dashboard')).as('home')

// Sign-in is delegated to IAM (Digital Covet ID, OAuth 2.0 + PKCE).
const OAuthController = () => import('#controllers/oauth_controller')
const TaxonomiesController = () => import('#controllers/taxonomies_controller')
const ClientsController = () => import('#controllers/clients_controller')
const SharesController = () => import('#controllers/shares_controller')
const PortalController = () => import('#controllers/portal_controller')

router
  .group(() => {
    router.on('/login').renderInertia('login', {}).as('login')
    router.get('/auth/redirect', [OAuthController, 'redirect'])
    router.get('/auth/callback', [OAuthController, 'callback'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.get('/dashboard', [controllers.Dashboard, 'show']).as('dashboard')
    router.get('/case-studies', [controllers.CaseStudies, 'index']).as('caseStudies.index')
    router
      .get('/case-studies/new', [controllers.CaseStudyEditor, 'create'])
      .as('caseStudies.create')
    router.post('/case-studies', [controllers.CaseStudyEditor, 'store']).as('caseStudies.store')
    router.get('/case-studies/:id', [controllers.CaseStudies, 'show']).as('caseStudies.show')
    router
      .get('/case-studies/:id/edit', [controllers.CaseStudyEditor, 'edit'])
      .as('caseStudies.edit')
    router
      .put('/case-studies/:id', [controllers.CaseStudyEditor, 'update'])
      .as('caseStudies.update')
    router
      .post('/case-studies/:id/archive', [controllers.CaseStudyEditor, 'archive'])
      .as('caseStudies.archive')
    router
      .post('/case-studies/:id/duplicate', [controllers.CaseStudyEditor, 'duplicate'])
      .as('caseStudies.duplicate')
    router.post('/uploads', [controllers.Uploads, 'store']).as('uploads.store')
    router.get('/shares', [SharesController, 'index']).as('shares.index')
    router.get('/shares/new', [SharesController, 'create']).as('shares.create')
    router.post('/shares', [SharesController, 'store']).as('shares.store')
    router.get('/shares/:id', [SharesController, 'show']).as('shares.show')
    router.post('/shares/:id/extend', [SharesController, 'extend']).as('shares.extend')
    router.get('/shares/:id/edit', [SharesController, 'edit']).as('shares.edit')
    router.put('/shares/:id', [SharesController, 'update']).as('shares.update')
    router.delete('/shares/:id', [SharesController, 'destroy']).as('shares.destroy')
    router.get('/files/:id', [controllers.Files, 'show']).as('files.show')
    router.post('logout', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())

// Library (admin+): controlled vocabulary behind case-study classification and share rules.
router
  .group(() => {
    router.get('/clients', [ClientsController, 'index']).as('clients.index')
    router.post('/clients', [ClientsController, 'store']).as('clients.store')
    router.post('/clients/quick', [ClientsController, 'quickStore']).as('clients.quick')
    router.put('/clients/:id', [ClientsController, 'update']).as('clients.update')
    router.get('/taxonomies', [TaxonomiesController, 'index']).as('taxonomies.index')
    router.post('/taxonomies/:kind', [TaxonomiesController, 'store']).as('taxonomies.store')
    router.put('/taxonomies/:kind/:id', [TaxonomiesController, 'update']).as('taxonomies.update')
    router
      .delete('/taxonomies/:kind/:id', [TaxonomiesController, 'destroy'])
      .as('taxonomies.destroy')
  })
  .use([middleware.auth(), middleware.admin()])

// Share portal: public, token-addressed. Access is decided per request by PortalController.
router.group(() => {
  router.get('/s/:token', [PortalController, 'show']).as('portal.show')
  router.post('/s/:token/unlock', [PortalController, 'unlock']).as('portal.unlock')
  router.get('/s/:token/files/:fileId', [PortalController, 'file']).as('portal.file')
  router.get('/s/:token/:slug', [PortalController, 'study']).as('portal.study')
})
