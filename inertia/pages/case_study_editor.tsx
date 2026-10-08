import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Head, router } from '@inertiajs/react'
import {
  AlertDialog,
  AlertBackdrop,
  AlertPopup,
  AlertTitle,
  AlertDescription,
  AlertActions,
} from '~/components/ui/alert_dialog'
import { Tabs, PillTab } from '~/components/ui/tabs'
import { OctagonX } from 'lucide-react'
import AppShell from '~/layouts/app_shell'
import type { InertiaProps } from '~/types'
import EditorHeader from '~/components/case_study_editor/editor_header'
import {
  AttachmentsList,
  Gallery,
  HeroImage,
  ResultsEditor,
  StoryEditor,
  TestimonialFields,
  TitleSummary,
  VideoList,
} from '~/components/case_study_editor/editor_sections'
import MetaRail from '~/components/case_study_editor/meta_rail'
import type {
  CaseStudyEditorProps,
  EditorForm,
  SaveState,
} from '~/components/case_study_editor/types'
import { missingRequired } from '~/components/case_study_editor/types'

type Props = InertiaProps<CaseStudyEditorProps>

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export default function CaseStudyEditor({
  mode,
  caseStudy,
  options,
  ownership,
  permissions,
}: Props) {
  const [form, setForm] = useState<EditorForm>(caseStudy.form)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [heroUploading, setHeroUploading] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [touched, setTouched] = useState(false)
  const [conflictOpen, setConflictOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [mobileTab, setMobileTab] = useState<'content' | 'details'>('content')
  const pendingHref = useRef<string | null>(null)
  const initialRef = useRef(JSON.stringify(caseStudy.form))

  const editable = permissions.editable
  const uploading = heroUploading || galleryUploading || form.gallery.some((g) => g.uploading)
  const missing = useMemo(() => (touched ? missingRequired(form) : []), [touched, form])

  const patch = useCallback(
    (p: Partial<EditorForm>) => {
      if (!editable) return
      setForm((f) => {
        const next = { ...f, ...p }
        if (p.title !== undefined && mode === 'new') next.slug = slugify(p.title)
        return next
      })
      setSaveState('dirty')
    },
    [editable, mode]
  )

  const endpoint = caseStudy.id ? `/case-studies/${caseStudy.id}` : '/case-studies'

  const doSave = useCallback(() => {
    setTouched(true)
    setSaveState('saving')
    const method = caseStudy.id ? 'put' : 'post'
    router[method](endpoint, { ...form } as never, {
      preserveScroll: true,
      onSuccess: () => {
        initialRef.current = JSON.stringify(form)
        setSaveState('saved')
      },
      onError: () => setSaveState('error'),
    })
  }, [endpoint, form, caseStudy.id])

  const doPublish = useCallback(() => {
    setTouched(true)
    const missingNow = missingRequired(form)
    if (missingNow.length > 0) {
      document.querySelector<HTMLElement>('[data-cse-validation]')?.focus()
      return
    }
    if (!caseStudy.id) {
      doSave()
      return
    }
    setSaveState('saving')
    router.post(`/case-studies/${caseStudy.id}/publish`, { ...form } as never, {
      preserveScroll: true,
      onSuccess: () => setSaveState('saved'),
      onError: () => setSaveState('error'),
    })
  }, [form, caseStudy.id, doSave])

  // ⌘S saves; dirty-navigate guard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        doSave()
      }
    }
    window.addEventListener('keydown', onKey)
    const unblock = router.on('before', (event) => {
      const dirty = JSON.stringify(form) !== initialRef.current
      if (dirty && saveState === 'dirty') {
        event.preventDefault()
        pendingHref.current = event.detail.visit.url.toString()
        setLeaveOpen(true)
      }
    })
    return () => {
      window.removeEventListener('keydown', onKey)
      unblock()
    }
  }, [doSave, form, saveState])

  const pickHero = (file: File) => {
    const url = URL.createObjectURL(file)
    setHeroUploading(true)
    setSaveState('dirty')
    window.setTimeout(() => {
      setForm((f) => ({ ...f, heroImageKey: file.name, heroImageUrl: url }))
      setHeroUploading(false)
    }, 600)
  }

  const addGallery = (files: FileList) => {
    const additions = Array.from(files).map((file, i) => ({
      key: `${Date.now()}-${i}-${file.name}`,
      url: URL.createObjectURL(file),
      uploading: true as const,
    }))
    setGalleryUploading(true)
    setForm((f) => ({ ...f, gallery: [...f.gallery, ...additions] }))
    window.setTimeout(() => {
      setForm((f) => ({ ...f, gallery: f.gallery.map((g) => ({ ...g, uploading: false })) }))
      setGalleryUploading(false)
      setSaveState('dirty')
    }, 800)
  }

  const errors = {
    title: touched && !form.title.trim() ? 'Title is required.' : undefined,
    summary: touched && !form.summary.trim() ? 'Summary is required.' : undefined,
    heroImageKey: touched && !form.heroImageKey ? 'Hero image is required.' : undefined,
    clientId: touched && !form.clientId ? 'Client is required.' : undefined,
    sector: touched && !form.sector ? 'Sector is required.' : undefined,
  }

  const title = form.title || (mode === 'new' ? 'Untitled case study' : 'Edit case study')

  return (
    <div className="cse">
      <Head title={title} />
      <h1 className="visually-hidden">Edit case study</h1>

      <EditorHeader
        mode={mode}
        id={caseStudy.id}
        title={form.title}
        status={caseStudy.status}
        saveState={uploading && saveState === 'saved' ? 'dirty' : saveState}
        savedLabel={caseStudy.updatedRelative}
        uploading={uploading}
        onSave={doSave}
        onPublish={doPublish}
        onRetry={doSave}
        crumbs={{
          label: mode === 'new' ? 'Untitled case study' : form.title || 'Untitled case study',
        }}
      />

      {!editable && (
        <div className="alert cse-banner" role="note">
          <p>
            You can view this case study but not edit it. Owned by{' '}
            {permissions.ownerName ?? 'someone'}
            {permissions.ownerDepartment ? `, ${permissions.ownerDepartment}` : ''}.
          </p>
        </div>
      )}

      {touched && missing.length > 0 && (
        <div className="alert cse-validation" data-cse-validation tabIndex={-1} role="alert">
          <OctagonX size={16} aria-hidden />
          <p>Missing required items: {missing.join(', ')}.</p>
        </div>
      )}

      <div className="cse-mobiletabs">
        <Tabs.Root
          value={mobileTab}
          onValueChange={(v) => setMobileTab(v as 'content' | 'details')}
        >
          <Tabs.List aria-label="Editor view" style={{ display: 'flex', gap: 4 }}>
            <PillTab value="content">Content</PillTab>
            <PillTab value="details">Details</PillTab>
          </Tabs.List>
        </Tabs.Root>
      </div>

      <div className="cse-grid" data-mobiletab={mobileTab}>
        <div className="cse-main" data-pane="content">
          <TitleSummary form={form} disabled={!editable} errors={errors} onChange={patch} />
          <HeroImage
            form={form}
            disabled={!editable}
            uploading={heroUploading}
            error={errors.heroImageKey}
            onPick={pickHero}
            onRemove={() => patch({ heroImageKey: null, heroImageUrl: null })}
          />
          <Gallery
            items={form.gallery}
            disabled={!editable}
            onAdd={addGallery}
            onRemove={(key) => patch({ gallery: form.gallery.filter((g) => g.key !== key) })}
            onMove={(from, to) => {
              const next = [...form.gallery]
              const [moved] = next.splice(from, 1)
              next.splice(to, 0, moved)
              patch({ gallery: next })
            }}
            onRetry={(key) =>
              patch({
                gallery: form.gallery.map((g) =>
                  g.key === key ? { ...g, failed: false, uploading: true } : g
                ),
              })
            }
          />
          <StoryEditor
            value={form.storyMarkdown}
            disabled={!editable}
            onChange={(storyMarkdown) => patch({ storyMarkdown })}
          />
          <VideoList
            videos={form.videos}
            disabled={!editable}
            onChange={(videos) => patch({ videos })}
          />
          <ResultsEditor
            metrics={form.metrics}
            disabled={!editable}
            onChange={(metrics) => patch({ metrics })}
          />
          <TestimonialFields form={form} disabled={!editable} onChange={patch} />
          <AttachmentsList
            items={form.attachments}
            disabled={!editable}
            onAdd={(files) => {
              const additions = Array.from(files).map((file, i) => ({
                key: `${Date.now()}-${i}-${file.name}`,
                name: file.name,
                size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
                url: '#',
              }))
              patch({ attachments: [...form.attachments, ...additions] })
            }}
            onRemove={(key) =>
              patch({ attachments: form.attachments.filter((a) => a.key !== key) })
            }
          />
        </div>
        <div data-pane="details">
          <MetaRail
            form={form}
            options={options}
            ownerName={ownership.ownerName}
            ownerInitials={ownership.ownerInitials}
            department={ownership.department}
            disabled={!editable}
            errors={errors}
            onChange={patch}
          />
        </div>
      </div>

      <AlertDialog.Root open={conflictOpen} onOpenChange={setConflictOpen}>
        <AlertDialog.Portal>
          <AlertBackdrop />
          <AlertPopup aria-label="Case study changed elsewhere">
            <AlertTitle>This case study changed</AlertTitle>
            <AlertDescription>
              Someone else saved a newer version while you were editing.
            </AlertDescription>
            <AlertActions>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => setConflictOpen(false)}
              >
                Keep my version
              </button>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => setConflictOpen(false)}
              >
                Load latest
              </button>
            </AlertActions>
          </AlertPopup>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      <AlertDialog.Root open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialog.Portal>
          <AlertBackdrop />
          <AlertPopup aria-label="Unsaved changes">
            <AlertTitle>Leave without saving?</AlertTitle>
            <AlertDescription>You have unsaved changes that will be lost.</AlertDescription>
            <AlertActions>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => setLeaveOpen(false)}
              >
                Stay
              </button>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => {
                  setLeaveOpen(false)
                  if (pendingHref.current) router.visit(pendingHref.current)
                }}
              >
                Leave
              </button>
            </AlertActions>
          </AlertPopup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  )
}

CaseStudyEditor.layout = (page: React.ReactNode) => <AppShell>{page}</AppShell>
