/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  home: typeof routes['home']
  session: {
    create: typeof routes['session.create']
    destroy: typeof routes['session.destroy']
  }
  oauth: {
    redirect: typeof routes['oauth.redirect']
    callback: typeof routes['oauth.callback']
    frontChannelLogout: typeof routes['oauth.frontChannelLogout']
  }
  dashboard: typeof routes['dashboard']
  caseStudies: typeof routes['caseStudies']
  caseStudyNew: typeof routes['caseStudyNew']
  caseStudyStore: typeof routes['caseStudyStore']
  caseStudyShow: typeof routes['caseStudyShow']
  caseStudyEdit: typeof routes['caseStudyEdit']
  caseStudyUpdate: typeof routes['caseStudyUpdate']
  caseStudyPublish: typeof routes['caseStudyPublish']
  shares: typeof routes['shares']
  shareNew: typeof routes['shareNew']
  shareStore: typeof routes['shareStore']
  sharePreview: typeof routes['sharePreview']
  shareShow: typeof routes['shareShow']
  shareEdit: typeof routes['shareEdit']
  shareUpdate: typeof routes['shareUpdate']
  shareDestroy: typeof routes['shareDestroy']
  taxonomies: typeof routes['taxonomies']
  taxonomyStore: typeof routes['taxonomyStore']
  taxonomyUpdate: typeof routes['taxonomyUpdate']
  taxonomyDestroy: typeof routes['taxonomyDestroy']
  clients: typeof routes['clients']
  clientStore: typeof routes['clientStore']
  clientUpdate: typeof routes['clientUpdate']
  clientDestroy: typeof routes['clientDestroy']
  sharePortal: typeof routes['sharePortal']
  shareUnlock: typeof routes['shareUnlock']
}
