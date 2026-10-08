/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [{"old":"/","type":0,"val":"/","end":""}],
    types: placeholder as Registry['home']['types'],
  },
  'session.create': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.create']['types'],
  },
  'oauth.redirect': {
    methods: ["GET","HEAD"],
    pattern: '/auth/iam',
    tokens: [{"old":"/auth/iam","type":0,"val":"auth","end":""},{"old":"/auth/iam","type":0,"val":"iam","end":""}],
    types: placeholder as Registry['oauth.redirect']['types'],
  },
  'oauth.callback': {
    methods: ["GET","HEAD"],
    pattern: '/api/auth/oauth2/callback/portfolio',
    tokens: [{"old":"/api/auth/oauth2/callback/portfolio","type":0,"val":"api","end":""},{"old":"/api/auth/oauth2/callback/portfolio","type":0,"val":"auth","end":""},{"old":"/api/auth/oauth2/callback/portfolio","type":0,"val":"oauth2","end":""},{"old":"/api/auth/oauth2/callback/portfolio","type":0,"val":"callback","end":""},{"old":"/api/auth/oauth2/callback/portfolio","type":0,"val":"portfolio","end":""}],
    types: placeholder as Registry['oauth.callback']['types'],
  },
  'dashboard': {
    methods: ["GET","HEAD"],
    pattern: '/dashboard',
    tokens: [{"old":"/dashboard","type":0,"val":"dashboard","end":""}],
    types: placeholder as Registry['dashboard']['types'],
  },
  'caseStudies': {
    methods: ["GET","HEAD"],
    pattern: '/case-studies',
    tokens: [{"old":"/case-studies","type":0,"val":"case-studies","end":""}],
    types: placeholder as Registry['caseStudies']['types'],
  },
  'caseStudyNew': {
    methods: ["GET","HEAD"],
    pattern: '/case-studies/new',
    tokens: [{"old":"/case-studies/new","type":0,"val":"case-studies","end":""},{"old":"/case-studies/new","type":0,"val":"new","end":""}],
    types: placeholder as Registry['caseStudyNew']['types'],
  },
  'caseStudyStore': {
    methods: ["POST"],
    pattern: '/case-studies',
    tokens: [{"old":"/case-studies","type":0,"val":"case-studies","end":""}],
    types: placeholder as Registry['caseStudyStore']['types'],
  },
  'caseStudyShow': {
    methods: ["GET","HEAD"],
    pattern: '/case-studies/:id',
    tokens: [{"old":"/case-studies/:id","type":0,"val":"case-studies","end":""},{"old":"/case-studies/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['caseStudyShow']['types'],
  },
  'caseStudyEdit': {
    methods: ["GET","HEAD"],
    pattern: '/case-studies/:id/edit',
    tokens: [{"old":"/case-studies/:id/edit","type":0,"val":"case-studies","end":""},{"old":"/case-studies/:id/edit","type":1,"val":"id","end":""},{"old":"/case-studies/:id/edit","type":0,"val":"edit","end":""}],
    types: placeholder as Registry['caseStudyEdit']['types'],
  },
  'caseStudyUpdate': {
    methods: ["PUT"],
    pattern: '/case-studies/:id',
    tokens: [{"old":"/case-studies/:id","type":0,"val":"case-studies","end":""},{"old":"/case-studies/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['caseStudyUpdate']['types'],
  },
  'caseStudyPublish': {
    methods: ["POST"],
    pattern: '/case-studies/:id/publish',
    tokens: [{"old":"/case-studies/:id/publish","type":0,"val":"case-studies","end":""},{"old":"/case-studies/:id/publish","type":1,"val":"id","end":""},{"old":"/case-studies/:id/publish","type":0,"val":"publish","end":""}],
    types: placeholder as Registry['caseStudyPublish']['types'],
  },
  'shares': {
    methods: ["GET","HEAD"],
    pattern: '/shares',
    tokens: [{"old":"/shares","type":0,"val":"shares","end":""}],
    types: placeholder as Registry['shares']['types'],
  },
  'shareNew': {
    methods: ["GET","HEAD"],
    pattern: '/shares/new',
    tokens: [{"old":"/shares/new","type":0,"val":"shares","end":""},{"old":"/shares/new","type":0,"val":"new","end":""}],
    types: placeholder as Registry['shareNew']['types'],
  },
  'shareStore': {
    methods: ["POST"],
    pattern: '/shares',
    tokens: [{"old":"/shares","type":0,"val":"shares","end":""}],
    types: placeholder as Registry['shareStore']['types'],
  },
  'sharePreview': {
    methods: ["GET","HEAD"],
    pattern: '/shares/preview',
    tokens: [{"old":"/shares/preview","type":0,"val":"shares","end":""},{"old":"/shares/preview","type":0,"val":"preview","end":""}],
    types: placeholder as Registry['sharePreview']['types'],
  },
  'shareShow': {
    methods: ["GET","HEAD"],
    pattern: '/shares/:id',
    tokens: [{"old":"/shares/:id","type":0,"val":"shares","end":""},{"old":"/shares/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['shareShow']['types'],
  },
  'shareEdit': {
    methods: ["GET","HEAD"],
    pattern: '/shares/:id/edit',
    tokens: [{"old":"/shares/:id/edit","type":0,"val":"shares","end":""},{"old":"/shares/:id/edit","type":1,"val":"id","end":""},{"old":"/shares/:id/edit","type":0,"val":"edit","end":""}],
    types: placeholder as Registry['shareEdit']['types'],
  },
  'shareUpdate': {
    methods: ["PUT"],
    pattern: '/shares/:id',
    tokens: [{"old":"/shares/:id","type":0,"val":"shares","end":""},{"old":"/shares/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['shareUpdate']['types'],
  },
  'shareDestroy': {
    methods: ["DELETE"],
    pattern: '/shares/:id',
    tokens: [{"old":"/shares/:id","type":0,"val":"shares","end":""},{"old":"/shares/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['shareDestroy']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [{"old":"/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['session.destroy']['types'],
  },
  'taxonomies': {
    methods: ["GET","HEAD"],
    pattern: '/taxonomies',
    tokens: [{"old":"/taxonomies","type":0,"val":"taxonomies","end":""}],
    types: placeholder as Registry['taxonomies']['types'],
  },
  'taxonomyStore': {
    methods: ["POST"],
    pattern: '/taxonomies/:type',
    tokens: [{"old":"/taxonomies/:type","type":0,"val":"taxonomies","end":""},{"old":"/taxonomies/:type","type":1,"val":"type","end":""}],
    types: placeholder as Registry['taxonomyStore']['types'],
  },
  'taxonomyUpdate': {
    methods: ["PUT"],
    pattern: '/taxonomies/:type/:id',
    tokens: [{"old":"/taxonomies/:type/:id","type":0,"val":"taxonomies","end":""},{"old":"/taxonomies/:type/:id","type":1,"val":"type","end":""},{"old":"/taxonomies/:type/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['taxonomyUpdate']['types'],
  },
  'taxonomyDestroy': {
    methods: ["DELETE"],
    pattern: '/taxonomies/:type/:id',
    tokens: [{"old":"/taxonomies/:type/:id","type":0,"val":"taxonomies","end":""},{"old":"/taxonomies/:type/:id","type":1,"val":"type","end":""},{"old":"/taxonomies/:type/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['taxonomyDestroy']['types'],
  },
  'clients': {
    methods: ["GET","HEAD"],
    pattern: '/clients',
    tokens: [{"old":"/clients","type":0,"val":"clients","end":""}],
    types: placeholder as Registry['clients']['types'],
  },
  'clientStore': {
    methods: ["POST"],
    pattern: '/clients',
    tokens: [{"old":"/clients","type":0,"val":"clients","end":""}],
    types: placeholder as Registry['clientStore']['types'],
  },
  'clientUpdate': {
    methods: ["PUT"],
    pattern: '/clients/:id',
    tokens: [{"old":"/clients/:id","type":0,"val":"clients","end":""},{"old":"/clients/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['clientUpdate']['types'],
  },
  'clientDestroy': {
    methods: ["DELETE"],
    pattern: '/clients/:id',
    tokens: [{"old":"/clients/:id","type":0,"val":"clients","end":""},{"old":"/clients/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['clientDestroy']['types'],
  },
  'oauth.frontChannelLogout': {
    methods: ["GET","HEAD"],
    pattern: '/api/auth/front-channel-logout',
    tokens: [{"old":"/api/auth/front-channel-logout","type":0,"val":"api","end":""},{"old":"/api/auth/front-channel-logout","type":0,"val":"auth","end":""},{"old":"/api/auth/front-channel-logout","type":0,"val":"front-channel-logout","end":""}],
    types: placeholder as Registry['oauth.frontChannelLogout']['types'],
  },
  'sharePortal': {
    methods: ["GET","HEAD"],
    pattern: '/s/:token',
    tokens: [{"old":"/s/:token","type":0,"val":"s","end":""},{"old":"/s/:token","type":1,"val":"token","end":""}],
    types: placeholder as Registry['sharePortal']['types'],
  },
  'shareUnlock': {
    methods: ["POST"],
    pattern: '/s/:token/unlock',
    tokens: [{"old":"/s/:token/unlock","type":0,"val":"s","end":""},{"old":"/s/:token/unlock","type":1,"val":"token","end":""},{"old":"/s/:token/unlock","type":0,"val":"unlock","end":""}],
    types: placeholder as Registry['shareUnlock']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
