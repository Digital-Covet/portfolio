import { router } from '@inertiajs/react'
import { Copy, MoreHorizontal, Pencil, BarChart3, Trash2 } from 'lucide-react'
import { Menu, MenuPositioner, MenuPopup, MenuItem } from '~/components/ui/menu'
import {
  AlertDialog,
  AlertBackdrop,
  AlertPopup,
  AlertTitle,
  AlertDescription,
  AlertActions,
} from '~/components/ui/alert_dialog'
import { useState } from 'react'
import type { ShareRow } from './types'

export default function RowMenu({ row }: { row: ShareRow }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    const url = `${window.location.origin}/s/${row.token}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          className="iconbtn iconbtn--sm"
          aria-label={`Actions for ${row.recipient}`}
          render={<button type="button" />}
        >
          <MoreHorizontal size={16} aria-hidden />
        </Menu.Trigger>
        <Menu.Portal>
          <MenuPositioner side="bottom" align="end">
            <MenuPopup data-base-ui-popup>
              <MenuItem onClick={copy} render={<button type="button" />}>
                <Copy size={14} aria-hidden />
                {copied ? 'Copied' : 'Copy link'}
              </MenuItem>
              <MenuItem render={<a href={`/shares/${row.id}/edit`} />}>
                <Pencil size={14} aria-hidden />
                Edit
              </MenuItem>
              <MenuItem render={<a href={`/shares/${row.id}`} />}>
                <BarChart3 size={14} aria-hidden />
                View analytics
              </MenuItem>
              <MenuItem
                className="cs-menuitem--danger"
                onClick={() => setConfirmOpen(true)}
                render={<button type="button" />}
              >
                <Trash2 size={14} aria-hidden />
                Delete
              </MenuItem>
            </MenuPopup>
          </MenuPositioner>
        </Menu.Portal>
      </Menu.Root>

      <AlertDialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialog.Portal>
          <AlertBackdrop />
          <AlertPopup aria-label={`Delete share for ${row.recipient}`}>
            <AlertTitle>Delete this share?</AlertTitle>
            <AlertDescription>
              The link for {row.recipient}
              {row.company ? ` · ${row.company}` : ''} will stop working. This cannot be undone.
            </AlertDescription>
            <AlertActions>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() =>
                  router.delete(`/shares/${row.id}`, {
                    onFinish: () => setConfirmOpen(false),
                  })
                }
              >
                <Trash2 size={14} aria-hidden />
                Delete share
              </button>
            </AlertActions>
          </AlertPopup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  )
}
