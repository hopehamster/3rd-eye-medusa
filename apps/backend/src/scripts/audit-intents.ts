/**
 * Intent coverage audit — read-only.
 *
 *   npx medusa exec ./src/scripts/audit-intents.ts
 *
 * Reports how many products are actually reachable by intent, which is the
 * thing the Oracle now depends on for product picks.
 *
 * Why this exists: the Oracle used to look for `intent:<id>` product *tags*
 * that nothing in the repo ever wrote, so its intent lookup always matched
 * zero products and every consultation fell through to the vector fallback.
 * The lookup now reads `metadata.intents` (the channel the storefront facet,
 * shelves, PDP and ritual builder already use) — but a product with no intents
 * is still invisible to intent matching, and only falls out of the semantic
 * path.
 *
 * This script changes nothing. It tells you the size of the gap.
 */
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import type { ExecArgs } from '@medusajs/framework/types'
import { ORACLE_INTENT_IDS, ORACLE_INTENTS } from '../modules/oracle/taxonomy'

type Row = {
  id: string
  title?: string | null
  handle?: string | null
  status?: string | null
  metadata?: Record<string, unknown> | null
}

function intentsOf(row: Row): string[] {
  const raw = row.metadata?.intents
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.filter(
    (value): value is string =>
      typeof value === 'string' && ORACLE_INTENT_IDS.includes(value)
  )
}

export default async function auditIntents({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = (await query.graph({
    entity: 'product',
    fields: ['id', 'title', 'handle', 'status', 'metadata'],
  })) as { data: Row[] }

  const all = products ?? []
  const published = all.filter((p) => p.status === 'published')

  const withIntents = published.filter((p) => intentsOf(p).length > 0)
  const withoutIntents = published.filter((p) => intentsOf(p).length === 0)

  // Products whose metadata.intents contain ids that are not in the taxonomy —
  // these are silently dropped by every consumer, including the Oracle.
  const invalid = all.filter((p) => {
    const raw = p.metadata?.intents
    if (!Array.isArray(raw)) {
      return false
    }
    return raw.some(
      (value) => typeof value !== 'string' || !ORACLE_INTENT_IDS.includes(value)
    )
  })

  const perIntent = new Map<string, number>()
  for (const product of withIntents) {
    for (const intent of intentsOf(product)) {
      perIntent.set(intent, (perIntent.get(intent) ?? 0) + 1)
    }
  }

  logger.info('')
  logger.info('=== Intent coverage ===')
  logger.info(`products total          : ${all.length}`)
  logger.info(`published               : ${published.length}`)
  logger.info(`published WITH intents  : ${withIntents.length}`)
  logger.info(`published WITHOUT       : ${withoutIntents.length}`)
  logger.info(`products with bad ids   : ${invalid.length}`)
  logger.info('')

  if (withoutIntents.length > 0) {
    logger.info('Published products with no intents (invisible to intent matching):')
    for (const product of withoutIntents.slice(0, 50)) {
      logger.info(`  - ${product.handle ?? product.id}  ${product.title ?? ''}`)
    }
    if (withoutIntents.length > 50) {
      logger.info(`  ... and ${withoutIntents.length - 50} more`)
    }
    logger.info('')
  }

  if (invalid.length > 0) {
    logger.info('Products carrying intent ids outside the taxonomy:')
    for (const product of invalid.slice(0, 50)) {
      logger.info(`  - ${product.handle ?? product.id}  -> ${JSON.stringify(product.metadata?.intents)}`)
    }
    logger.info('')
  }

  logger.info('Coverage per intent (published products):')
  for (const intent of ORACLE_INTENTS) {
    const count = perIntent.get(intent.id) ?? 0
    const flag = count === 0 ? '  <-- no products; the Oracle cannot pick for this' : ''
    logger.info(`  ${intent.id.padEnd(30)} ${count}${flag}`)
  }
  logger.info('')

  const empty = ORACLE_INTENTS.filter((i) => (perIntent.get(i.id) ?? 0) === 0)
  if (empty.length > 0) {
    logger.warn(
      `${empty.length} of ${ORACLE_INTENTS.length} intents have no tagged product. ` +
        'Give those products metadata.intents (admin -> AI Content generates ' +
        'suggestions for human review), then let the search index catch up.'
    )
  } else {
    logger.info('Every intent has at least one published product.')
  }
}
