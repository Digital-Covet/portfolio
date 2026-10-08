import { useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import { Menu, MenuPositioner, MenuPopup, MenuItem } from '~/components/ui/menu'
import { Tooltip, TooltipPopup } from '~/components/ui/tooltip'
import {
  AlertDialog,
  AlertBackdrop,
  AlertPopup,
  AlertTitle,
  AlertDescription,
  AlertActions,
} from '~/components/ui/alert_dialog'
import { MoreHorizontal, Pencil, Eye, Link2, Archive, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { CaseStudyRow } from './types'

/** Row overflow menu: Edit · Preview · Add to share · Archive · Delete. */
export function RowMenu({ row, onDeleted }: { row: CaseStudyRow; onDeleted?: () => void }) {
  const [confirm, setConfirm] = useState(false)

  const archive = () => {
    router.patch(
      `/case-studies/${row.id}`,
      { status: 'archived' },
      {
        preserveScroll: true,
        onSuccess: () => toast.success('Case study archived'),
        onError: () => toast.error('Could not archive. Try again.'),
      }
    )
  }

  const destroy = () => {
    router.delete(`/case-studies/${row.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Case study deleted')
        setConfirm(false)
        onDeleted?.()
      },
      onError: () => {
        toast.error('Could not delete. Try again.')
        setConfirm(false)
      },
    })
  }

  const editTarget = `/case-studies/${row.id}/edit`
  const editDisabled = !row.editable

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          className="iconbtn cs-rowmenu__trigger"
          aria-label={`Actions for ${row.title}`}
        >
          <MoreHorizontal size={16} aria-hidden />
        </Menu.Trigger>
        <Menu.Portal>
          <MenuPositioner side="bottom" align="end" sideOffset={6}>
            <MenuPopup aria-label={`Actions for ${row.title}`}>
              {editDisabled ? (
                <Tooltip.Root>
                  <Tooltip.Trigger
                    delay={200}
                    render={
                      <span className="menu-item" aria-disabled="true" data-disabled="true" />
                    }
                  >
                    <Pencil size={14} aria-hidden />
                    Edit
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Positioner side="left" sideOffset={8}>
                      <TooltipPopup style={{ minWidth: 0 }}>
                        Owned by {row.ownerName}, {row.ownerDepartment}
                      </TooltipPopup>
                    </Tooltip.Positioner>
                  </Tooltip.Portal>
                </Tooltip.Root>
              ) : (
                <MenuItem render={<Link href={editTarget} />} aria-disabled={undefined}>
                  <Pencil size={14} aria-hidden />
                  Edit
                </MenuItem>
              )}
              <MenuItem render={<Link href={`/case-studies/${row.id}`} />}>
                <Eye size={14} aria-hidden />
                Preview
              </MenuItem>
              <MenuItem render={<Link href={`/shares/new?caseStudy=${row.id}`} />}>
                <Link2 size={14} aria-hidden />
                Add to share
              </MenuItem>
              <MenuItem onClick={archive}>
                <Archive size={14} aria-hidden />
                Archive
              </MenuItem>
              <MenuItem className="cs-menuitem--danger" onClick={() => setConfirm(true)}>
                <Trash2 size={14} aria-hidden />
                Delete
              </MenuItem>
            </MenuPopup>
          </MenuPositioner>
        </Menu.Portal>
      </Menu.Root>

      <AlertDialog.Root open={confirm} onOpenChange={setConfirm}>
        <AlertDialog.Portal>
          <AlertBackdrop />
          <AlertPopup aria-labelledby={`delete-${row.id}`}>
            <AlertTitle id={`delete-${row.id}`}>Delete “{row.title}”?</AlertTitle>
            <AlertDescription>
              This permanently removes the case study. Shares that include it will lose access to
              it.
            </AlertDescription>
            <AlertActions>
              <button type="button" className="btn btn--outline" onClick={() => setConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn--danger" onClick={destroy}>
                <Trash2 size={16} aria-hidden />
                Delete
              </button>
            </AlertActions>
          </AlertPopup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  )
}
