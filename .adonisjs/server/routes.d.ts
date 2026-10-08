import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'oauth.redirect': { paramsTuple?: []; params?: {} }
    'oauth.callback': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'caseStudies': { paramsTuple?: []; params?: {} }
    'caseStudyNew': { paramsTuple?: []; params?: {} }
    'caseStudyStore': { paramsTuple?: []; params?: {} }
    'caseStudyShow': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'caseStudyEdit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'caseStudyUpdate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'caseStudyPublish': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shares': { paramsTuple?: []; params?: {} }
    'shareNew': { paramsTuple?: []; params?: {} }
    'shareStore': { paramsTuple?: []; params?: {} }
    'sharePreview': { paramsTuple?: []; params?: {} }
    'shareShow': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shareEdit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shareUpdate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shareDestroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'taxonomies': { paramsTuple?: []; params?: {} }
    'taxonomyStore': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'taxonomyUpdate': { paramsTuple: [ParamValue,ParamValue]; params: {'type': ParamValue,'id': ParamValue} }
    'taxonomyDestroy': { paramsTuple: [ParamValue,ParamValue]; params: {'type': ParamValue,'id': ParamValue} }
    'clients': { paramsTuple?: []; params?: {} }
    'clientStore': { paramsTuple?: []; params?: {} }
    'clientUpdate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clientDestroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'oauth.frontChannelLogout': { paramsTuple?: []; params?: {} }
    'sharePortal': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'shareUnlock': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'oauth.redirect': { paramsTuple?: []; params?: {} }
    'oauth.callback': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'caseStudies': { paramsTuple?: []; params?: {} }
    'caseStudyNew': { paramsTuple?: []; params?: {} }
    'caseStudyShow': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'caseStudyEdit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shares': { paramsTuple?: []; params?: {} }
    'shareNew': { paramsTuple?: []; params?: {} }
    'sharePreview': { paramsTuple?: []; params?: {} }
    'shareShow': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shareEdit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'taxonomies': { paramsTuple?: []; params?: {} }
    'clients': { paramsTuple?: []; params?: {} }
    'oauth.frontChannelLogout': { paramsTuple?: []; params?: {} }
    'sharePortal': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'oauth.redirect': { paramsTuple?: []; params?: {} }
    'oauth.callback': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'caseStudies': { paramsTuple?: []; params?: {} }
    'caseStudyNew': { paramsTuple?: []; params?: {} }
    'caseStudyShow': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'caseStudyEdit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shares': { paramsTuple?: []; params?: {} }
    'shareNew': { paramsTuple?: []; params?: {} }
    'sharePreview': { paramsTuple?: []; params?: {} }
    'shareShow': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shareEdit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'taxonomies': { paramsTuple?: []; params?: {} }
    'clients': { paramsTuple?: []; params?: {} }
    'oauth.frontChannelLogout': { paramsTuple?: []; params?: {} }
    'sharePortal': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
  }
  POST: {
    'caseStudyStore': { paramsTuple?: []; params?: {} }
    'caseStudyPublish': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shareStore': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'taxonomyStore': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'clientStore': { paramsTuple?: []; params?: {} }
    'shareUnlock': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
  }
  PUT: {
    'caseStudyUpdate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shareUpdate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'taxonomyUpdate': { paramsTuple: [ParamValue,ParamValue]; params: {'type': ParamValue,'id': ParamValue} }
    'clientUpdate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'shareDestroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'taxonomyDestroy': { paramsTuple: [ParamValue,ParamValue]; params: {'type': ParamValue,'id': ParamValue} }
    'clientDestroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}