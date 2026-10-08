export type ClientRow = {
  id: string
  name: string
  logoUrl: string | null
  caseStudyCount: number
  keyBusinesses: string[]
}

export type ClientsProps = {
  clients: ClientRow[]
}
