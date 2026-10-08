/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'home': {
    methods: ["GET","HEAD"]
    pattern: '/'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'session.create': {
    methods: ["GET","HEAD"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
    }
  }
  'oauth.redirect': {
    methods: ["GET","HEAD"]
    pattern: '/auth/iam'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/oauth_controller').default['redirect']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/oauth_controller').default['redirect']>>>
    }
  }
  'oauth.callback': {
    methods: ["GET","HEAD"]
    pattern: '/api/auth/oauth2/callback/portfolio'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/oauth_controller').default['callback']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/oauth_controller').default['callback']>>>
    }
  }
  'dashboard': {
    methods: ["GET","HEAD"]
    pattern: '/dashboard'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['index']>>>
    }
  }
  'caseStudies': {
    methods: ["GET","HEAD"]
    pattern: '/case-studies'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/case_studies_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/case_studies_controller').default['index']>>>
    }
  }
  'caseStudyNew': {
    methods: ["GET","HEAD"]
    pattern: '/case-studies/new'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/case_studies_controller').default['new']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/case_studies_controller').default['new']>>>
    }
  }
  'caseStudyStore': {
    methods: ["POST"]
    pattern: '/case-studies'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/case_study').caseStudyDraftValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/case_study').caseStudyDraftValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/case_studies_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/case_studies_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'caseStudyShow': {
    methods: ["GET","HEAD"]
    pattern: '/case-studies/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/case_studies_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/case_studies_controller').default['show']>>>
    }
  }
  'caseStudyEdit': {
    methods: ["GET","HEAD"]
    pattern: '/case-studies/:id/edit'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/case_studies_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/case_studies_controller').default['edit']>>>
    }
  }
  'caseStudyUpdate': {
    methods: ["PUT"]
    pattern: '/case-studies/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/case_study').caseStudyDraftValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/case_study').caseStudyDraftValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/case_studies_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/case_studies_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'caseStudyPublish': {
    methods: ["POST"]
    pattern: '/case-studies/:id/publish'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/case_study').caseStudyPublishValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/case_study').caseStudyPublishValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/case_studies_controller').default['publish']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/case_studies_controller').default['publish']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'shares': {
    methods: ["GET","HEAD"]
    pattern: '/shares'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shares_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shares_controller').default['index']>>>
    }
  }
  'shareNew': {
    methods: ["GET","HEAD"]
    pattern: '/shares/new'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shares_controller').default['new']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shares_controller').default['new']>>>
    }
  }
  'shareStore': {
    methods: ["POST"]
    pattern: '/shares'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/share').shareValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/share').shareValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shares_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shares_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'sharePreview': {
    methods: ["GET","HEAD"]
    pattern: '/shares/preview'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shares_controller').default['preview']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shares_controller').default['preview']>>>
    }
  }
  'shareShow': {
    methods: ["GET","HEAD"]
    pattern: '/shares/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shares_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shares_controller').default['show']>>>
    }
  }
  'shareEdit': {
    methods: ["GET","HEAD"]
    pattern: '/shares/:id/edit'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shares_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shares_controller').default['edit']>>>
    }
  }
  'shareUpdate': {
    methods: ["PUT"]
    pattern: '/shares/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/share').shareValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/share').shareValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shares_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shares_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'shareDestroy': {
    methods: ["DELETE"]
    pattern: '/shares/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shares_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shares_controller').default['destroy']>>>
    }
  }
  'session.destroy': {
    methods: ["POST"]
    pattern: '/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
    }
  }
  'taxonomies': {
    methods: ["GET","HEAD"]
    pattern: '/taxonomies'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/taxonomies_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/taxonomies_controller').default['index']>>>
    }
  }
  'taxonomyStore': {
    methods: ["POST"]
    pattern: '/taxonomies/:type'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/taxonomy').taxonomyCreateValidator)>>
      paramsTuple: [ParamValue]
      params: { type: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/taxonomy').taxonomyCreateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/taxonomies_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/taxonomies_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'taxonomyUpdate': {
    methods: ["PUT"]
    pattern: '/taxonomies/:type/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/taxonomy').taxonomyRenameValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { type: ParamValue; id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/taxonomy').taxonomyRenameValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/taxonomies_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/taxonomies_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'taxonomyDestroy': {
    methods: ["DELETE"]
    pattern: '/taxonomies/:type/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { type: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/taxonomies_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/taxonomies_controller').default['destroy']>>>
    }
  }
  'clients': {
    methods: ["GET","HEAD"]
    pattern: '/clients'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/clients_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/clients_controller').default['index']>>>
    }
  }
  'clientStore': {
    methods: ["POST"]
    pattern: '/clients'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/client').clientValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/client').clientValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/clients_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/clients_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'clientUpdate': {
    methods: ["PUT"]
    pattern: '/clients/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/client').clientValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/client').clientValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/clients_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/clients_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'clientDestroy': {
    methods: ["DELETE"]
    pattern: '/clients/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/clients_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/clients_controller').default['destroy']>>>
    }
  }
  'oauth.frontChannelLogout': {
    methods: ["GET","HEAD"]
    pattern: '/api/auth/front-channel-logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/oauth_controller').default['frontChannelLogout']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/oauth_controller').default['frontChannelLogout']>>>
    }
  }
  'sharePortal': {
    methods: ["GET","HEAD"]
    pattern: '/s/:token'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/share_portal_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/share_portal_controller').default['show']>>>
    }
  }
  'shareUnlock': {
    methods: ["POST"]
    pattern: '/s/:token/unlock'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/share').shareUnlockValidator)>>
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/share').shareUnlockValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/share_portal_controller').default['unlock']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/share_portal_controller').default['unlock']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
}
