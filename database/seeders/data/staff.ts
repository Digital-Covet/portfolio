import AppUser from '#models/app_user'
import Department from '#models/department'

/**
 * Staff who authored the imported records. Ids are the IAM user ids; names come from the
 * backup because IAM does not store them.
 */
export const STAFF = {
  siddhesh: {
    id: 'cd815058-8ff5-4575-a46c-2a668787ae35',
    email: 'siddhesh.chavan@digitalcovet.com',
    name: 'Siddhesh Chavan',
    role: 'admin',
  },
  taniya: {
    id: '2744a53f-00b4-472e-b2d4-8b1168779f98',
    email: 'taniya.mogha@digitalcovet.com',
    name: 'Taniya Mogha',
    role: 'employee',
  },
} as const

export type StaffKey = keyof typeof STAFF

/**
 * Ensures the "Digital" department and both staff mirrors exist.
 */
export async function ensureStaff() {
  const department = await Department.firstOrCreate({ name: 'Digital' })
  const users = {} as Record<StaffKey, AppUser>
  for (const key of Object.keys(STAFF) as StaffKey[]) {
    const staff = STAFF[key]
    const existing = await AppUser.find(staff.id)
    users[key] = existing ?? (await AppUser.create({ ...staff, departmentId: department.id }))
  }
  return { department, users }
}
