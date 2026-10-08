import { Menu, MenuPositioner, MenuPopup, MenuItem } from '~/components/ui/menu'
import { Separator } from '~/components/ui/separator'
import { ExternalLink, LogOut, Moon, Sun, Monitor } from 'lucide-react'
import { Form } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { useTheme, type Theme } from '~/components/theme'

export type ShellUser = {
  fullName?: string
  email?: string
  role?: string
  avatarUrl?: string | null
  initials?: string
}

function initialsOf(user: ShellUser) {
  if (user.initials) return user.initials
  const src = user.fullName || user.email || '?'
  const parts = src.split(/[\s@._-]+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return src.slice(0, 2).toUpperCase()
}

const THEMES = [
  { v: 'light', icon: Sun, label: 'Light' },
  { v: 'dark', icon: Moon, label: 'Dark' },
  { v: 'system', icon: Monitor, label: 'System' },
] as const satisfies Array<{ v: Theme; icon: typeof Sun; label: string }>

export default function UserMenu({
  user,
  compact = false,
}: {
  user: ShellUser
  compact?: boolean
}) {
  const [theme, setTheme] = useTheme()
  const { iamAccountUrl } = usePage().props
  const accountUrl = iamAccountUrl ?? '#'

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Account menu for ${user.fullName || user.email}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: compact ? 'center' : undefined,
          gap: 10,
          width: compact ? 'auto' : '100%',
          padding: compact ? 4 : 8,
          borderRadius: 'var(--radius)',
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          color: 'var(--sidebar-fg)',
          textAlign: 'left',
          margin: compact ? '0 auto' : undefined,
        }}
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            width={32}
            height={32}
            style={{ width: 32, height: 32, borderRadius: 99, objectFit: 'cover', flex: 'none' }}
          />
        ) : (
          <span
            aria-hidden
            style={{
              width: 32,
              height: 32,
              borderRadius: 99,
              flex: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'color-mix(in srgb, var(--primary) 20%, transparent)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'var(--font-heading)',
            }}
          >
            {initialsOf(user)}
          </span>
        )}
        {!compact && (
          <span style={{ minWidth: 0, flex: 1 }} className="shell-usermeta">
            <span
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.fullName || user.email}
            </span>
            <span
              style={{
                display: 'block',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--fg-3)',
                fontWeight: 500,
              }}
            >
              {user.role ?? 'employee'}
            </span>
          </span>
        )}
      </Menu.Trigger>

      <Menu.Portal>
        <MenuPositioner sideOffset={8} align="end">
          <MenuPopup style={{ minWidth: 240 }}>
            <div style={{ padding: '8px 10px 4px' }}>
              <span className="telemetry-label">Theme</span>
              <div
                role="group"
                aria-label="Theme"
                style={{ display: 'flex', gap: 4, marginTop: 8 }}
              >
                {THEMES.map(({ v, icon: Icon, label }) => (
                  <button
                    key={v}
                    type="button"
                    aria-label={`${label} theme`}
                    aria-pressed={theme === v}
                    onClick={() => setTheme(v)}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      height: 32,
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border-strong)',
                      background:
                        theme === v
                          ? 'color-mix(in srgb, var(--primary) 14%, transparent)'
                          : 'transparent',
                      color: theme === v ? 'var(--fg-1)' : 'var(--fg-2)',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    <Icon size={14} aria-hidden />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Separator style={{ height: 1, background: 'var(--hairline)', margin: '8px 4px' }} />

            <MenuItem render={<a href={accountUrl} target="_blank" rel="noopener noreferrer" />}>
              <ExternalLink size={15} aria-hidden /> Manage account
            </MenuItem>

            <Form route="session.destroy">
              {({ processing }) => (
                <MenuItem
                  render={<button type="submit" disabled={processing} />}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  <LogOut size={15} aria-hidden style={{ marginRight: 10 }} />{' '}
                  {processing ? 'Signing out…' : 'Sign out'}
                </MenuItem>
              )}
            </Form>
          </MenuPopup>
        </MenuPositioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
