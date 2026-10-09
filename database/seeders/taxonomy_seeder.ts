import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Industry from '#models/industry'
import KeyBusiness from '#models/key_business'
import Sector from '#models/sector'

/**
 * Sector | Industry | Key businesses (comma separated). A trailing `*` in the source
 * list marked later additions; it is not part of the name.
 */
const TAXONOMY = `
Primary|Agriculture|Farming
Primary|Forestry|Logging
Primary|Fishing|Commercial Fishing
Primary|Mining & Quarrying|Coal mining, Metals mining, Mineral mining
Primary|Oil & Gas Extraction|Crude oil production, Natural gas production
Primary|Water Management & Utilities|Freshwater extraction, Irrigation, Desalination
Primary|Aquaculture & Mariculture|Fish farming, Seaweed cultivation, Shellfish breeding
Primary|Livestock & Animal Husbandry|Cattle production, Poultry production, Dairy production, Wool production
Primary|Forestry & Timber|Plantation management, Pulpwood, Lumber
Secondary|Automotive & Aerospace|Vehicle manufacturing, Aircraft manufacturing
Secondary|Chemicals & Pharmaceuticals|Medicine production, Industrial chemicals
Secondary|Electronics & Semiconductors|Hardware, Chips, Consumer electronics
Secondary|Construction & Infrastructure|Building homes, Building roads, Building bridges
Secondary|Food & Beverage Processing|Packaged foods, Beverages, Dairy products
Secondary|Textile & Apparel|Clothing, Fabric mills, Fast fashion supply chains
Secondary|Steel & Metal Fabrication|Structural steel, Aluminum smelting, Castings
Secondary|Rubber & Plastics|Synthetic rubber, Packaging, Industrial plastics
Secondary|Paper & Pulp|Newsprint, Cardboard, Industrial paper products
Secondary|Defense & Arms Manufacturing|Military equipment, Weapons, Defense systems
Secondary|Furniture & Wood Products|Cabinetry, Flooring, Modular furniture
Secondary|Glass & Ceramics|Flat glass, Pottery, Industrial ceramics
Secondary|Shipbuilding & Marine Equipment|Commercial vessels, Naval ships, Offshore rigs
Tertiary|Finance, Banking & Insurance|Banking, Investments, Risk coverage, Insurance*, Estate Planning*
Tertiary|Healthcare & Medical Services|Hospitals, Clinics, Health tech
Tertiary|Retail & E-commerce|Consumer goods, Online marketplaces
Tertiary|Transportation & Logistics|Shipping, Air freight, Trucking, Packers & Movers*
Tertiary|Travel, Tourism & Hospitality|Hotels, Airlines, Leisure
Tertiary|Telecommunications|Internet networks, Mobile networks
Tertiary|Media & Entertainment|Film, Gaming, Digital content
Tertiary|Real Estate & Property Management|Residential property, Commercial property, Industrial property
Tertiary|Legal Services|Corporate law, Litigation, Compliance consulting
Tertiary|Accounting & Audit|Tax advisory, Financial reporting, Forensic accounting
Tertiary|Advertising & Marketing|Brand campaigns, Digital media, PR
Tertiary|Public Administration & Government|Policy, Regulation, Civil services
Tertiary|Social Services & NGOs|Community welfare, Humanitarian aid, Nonprofits
Tertiary|Waste Management & Recycling|Landfill operations, Composting, E-waste recycling, Housekeeping or Workforce Management*
Tertiary|Security & Facility Services|Private security, Cleaning, Building maintenance
Tertiary|Postal & Courier Services|Mail delivery, Last-mile logistics, Express parcels
Tertiary|Religious & Cultural Organizations|Places of worship, Cultural trusts, Heritage bodies
Quaternary|IT & Software|AI, Cloud computing, Software development
Quaternary|SaaS (Software as a Service)|Subscription-based cloud software, Platforms, B2B/B2C apps
Quaternary|Research & Development (R&D)|Scientific innovation, Prototyping
Quaternary|Education & Training|Schools, Universities, Corporate training
Quaternary|Consulting & Advisory|Management consulting, Strategy, Business advisory
Quaternary|Data Analytics & Business Intelligence|Data processing, Visualization, Market insights
Quaternary|Financial Technology (Fintech)|Digital payments, Neobanks, Blockchain solutions
Quaternary|Biotechnology & Life Sciences|Gene editing, Diagnostics, Biopharma R&D
Quaternary|Space & Satellite Technology|Satellite launches, Space tourism, Orbital services
Quaternary|Cybersecurity|Threat intelligence, Network security, Compliance tech
Quaternary|Architecture & Urban Planning|City design, Zoning, Smart city development
Quinary|Government & Policy Making|Legislative bodies, Ministries, International diplomacy
Quinary|Academic & Scientific Research|Think tanks, Universities, Independent research labs
Quinary|Healthcare Leadership & Public Health|WHO-level policy, National health boards, Epidemiology
Quinary|Environmental & Climate Policy|Carbon markets, Climate treaties, Sustainability governance
Quinary|International Trade & Diplomacy|WTO, Bilateral trade bodies, Export promotion councils
`

export default class extends BaseSeeder {
  /**
   * Idempotent: rows are matched by name within their parent, so re-running adds nothing.
   */
  async run() {
    const rows = TAXONOMY.trim()
      .split('\n')
      .map((line) => {
        const [sector, industry, keyBusinesses] = line.split('|')
        return {
          sector: sector.trim(),
          industry: industry.trim(),
          keyBusinesses: keyBusinesses.split(',').map((name) => name.trim().replace(/\*$/, '')),
        }
      })

    for (const row of rows) {
      const sector = await Sector.firstOrCreate({ name: row.sector })
      const industry = await Industry.firstOrCreate({ sectorId: sector.id, name: row.industry })
      for (const name of row.keyBusinesses) {
        await KeyBusiness.firstOrCreate({ industryId: industry.id, name })
      }
    }
  }
}
