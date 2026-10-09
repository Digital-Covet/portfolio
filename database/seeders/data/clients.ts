import type { StaffKey } from './staff.js'

export interface ClientSeed {
  name: string
  creator: StaffKey
  /** Timestamps in the backup have no zone and are assumed to be UTC. */
  createdAt: string
}

/**
 * The backup stores the Runwal name with a double space; it is normalised here.
 * Logos are not seeded: the files are not in Supabase Storage yet.
 */
export const CLIENTS: ClientSeed[] = [
  { name: 'Atom Prive', creator: 'siddhesh', createdAt: '2026-06-03T15:14:16Z' },
  { name: 'Atom Risk Advisory', creator: 'siddhesh', createdAt: '2026-06-03T15:21:57Z' },
  { name: 'Ecochem', creator: 'siddhesh', createdAt: '2026-06-03T15:23:09Z' },
  { name: 'Arise Facility Solutions', creator: 'siddhesh', createdAt: '2026-06-03T15:24:05Z' },
  { name: 'SD Hospitality', creator: 'siddhesh', createdAt: '2026-06-03T15:25:07Z' },
  { name: 'Sthiti Eco', creator: 'siddhesh', createdAt: '2026-06-03T15:27:13Z' },
  {
    name: 'Patel International Packers and Movers',
    creator: 'siddhesh',
    createdAt: '2026-06-10T13:40:02Z',
  },
  { name: 'Mahindra Rainforest', creator: 'taniya', createdAt: '2026-10-06T08:39:59Z' },
  { name: 'Prestige City', creator: 'taniya', createdAt: '2026-10-06T08:57:36Z' },
  { name: 'Runwal Group', creator: 'taniya', createdAt: '2026-10-06T09:14:41Z' },
]
