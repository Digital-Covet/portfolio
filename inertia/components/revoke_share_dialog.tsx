import { useState } from 'react'
import { router } from '@inertiajs/react'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Ban } from 'lucide-react'

const secondaryBtn =
  'inline-flex h-9 items-center gap-2 rounded-md bg-secondary px-3 text-sm font-medium transition-colors hover:bg-secondary/70'

/** Confirms and revokes a share link. Revoking soft-deletes it, so the token stops resolving at once. */
export default function RevokeDialog({
  target,
  onClose,
}: {
  target: { id: string; name: string } | null
  onClose: () => void
}) {
  const [busy, setBusy] = useState(false)
  return (
    <AlertDialog.Root open={!!target} onOpenChange={(open) => !open && onClose()}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/50 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 flex w-[min(440px,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-lg border border-border-raised bg-surface-raised p-6 shadow-[var(--shadow-raised)] transition-[opacity,scale] duration-[160ms] data-[ending-style]:scale-[0.98] data-[starting-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none">
          <div className="flex flex-col gap-2">
            <AlertDialog.Title className="font-display text-xl/7 font-semibold">
              Revoke {target ? `“${target.name}”` : 'this link'}?
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-muted-foreground">
              The link stops working immediately for everyone who has it. Recipients will see a “not
              found” page. This can’t be undone from here.
            </AlertDialog.Description>
          </div>
          <div className="flex justify-end gap-2">
            {/* Cancel first in the DOM so it takes initial focus. */}
            <AlertDialog.Close className={secondaryBtn}>Cancel</AlertDialog.Close>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (!target) return
                setBusy(true)
                router.delete(`/shares/${target.id}`, {
                  preserveScroll: true,
                  onSuccess: onClose,
                  onFinish: () => setBusy(false),
                })
              }}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-error px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Ban size={16} strokeWidth={1.75} aria-hidden /> Revoke link
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
