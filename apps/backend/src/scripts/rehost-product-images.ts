import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Move product photography onto our own storage (#151).
 *
 * 33 of 184 published products stored their only photograph on somebody else's
 * host — i.imgur.com, Aliyun OSS buckets, a Shopify image bucket. The storefront
 * runs with images.unoptimized, so those were raw hotlinks: if a host starts
 * blocking the referrer or the file expires, the product page and the homepage
 * hero go blank with no local copy to fall back on.
 *
 * The images now live in the storefront repo at public/products/<handle>.jpg and
 * are served from the shop's own domain. This script points the product records
 * at them.
 *
 * Report mode by default; WRITE_REHOST=1 applies.
 *
 *   npx medusa exec ./src/scripts/rehost-product-images.ts
 *   WRITE_REHOST=1 npx medusa exec ./src/scripts/rehost-product-images.ts
 */
const SITE = process.env.REHOST_SITE_URL ?? "https://3rdeyesupply.com"

/** handle -> path under the storefront's public/ directory */
const LOCAL_PATH: Record<string, string> = {
  "gray-moonstone-throat-chakra-bracelet-anxiety-relief-sleep-aid": "/products/gray-moonstone-throat-chakra-bracelet-anxiety-relief-sleep-aid.jpg",
  "rose-quartz-heart-chakra-bracelet-self-love-emotional-healing": "/products/rose-quartz-heart-chakra-bracelet-self-love-emotional-healing.jpg",
  "green-crystal-heart-chakra-bracelet-stress-release-vitality": "/products/green-crystal-heart-chakra-bracelet-stress-release-vitality.jpg",
  "vintage-red-oval-crystal-leaf-ring-gold-tone-brass-women-ele-011585": "/products/vintage-red-oval-crystal-leaf-ring-gold-tone-brass-women-ele-011585.jpg",
  "best-selling-zircon-heart-shaped-moonstone-ring-for-women-eu-587137": "/products/best-selling-zircon-heart-shaped-moonstone-ring-for-women-eu-587137.jpg",
  "925-sterling-silver-tarot-temperance-charms-for-bracelets-ne-171329": "/products/925-sterling-silver-tarot-temperance-charms-for-bracelets-ne-171329.jpg",
  "925-sterling-silver-tarot-the-chariot-charms-for-bracelets-n-888001": "/products/925-sterling-silver-tarot-the-chariot-charms-for-bracelets-n-888001.jpg",
  "925-sterling-silver-tarot-the-hierophant-charms-for-bracelet-275201": "/products/925-sterling-silver-tarot-the-hierophant-charms-for-bracelet-275201.jpg",
  "925-sterling-silver-chakra-third-eye-charms-for-bracelets-ne-717570": "/products/925-sterling-silver-chakra-third-eye-charms-for-bracelets-ne-717570.jpg",
  "925-sterling-silver-chakra-heart-charms-for-bracelets-neckla-752001": "/products/925-sterling-silver-chakra-heart-charms-for-bracelets-neckla-752001.jpg",
  "chakra-manipura-solar-plexus-chakra-symbol-925-sterling-silv-679426": "/products/chakra-manipura-solar-plexus-chakra-symbol-925-sterling-silv-679426.jpg",
  "chakra-muladhara-root-chakra-symbol-925-sterling-silver-hand-959554": "/products/chakra-muladhara-root-chakra-symbol-925-sterling-silver-hand-959554.jpg",
  "chakra-svadhishthana-sacral-chakra-symbol-925-sterling-silve-153794": "/products/chakra-svadhishthana-sacral-chakra-symbol-925-sterling-silve-153794.jpg",
  "925-sterling-silver-chakra-solar-plexus-charms-for-bracelets-387713": "/products/925-sterling-silver-chakra-solar-plexus-charms-for-bracelets-387713.jpg",
  "925-sterling-silver-tarot-the-magician-charms-for-bracelets-711041": "/products/925-sterling-silver-tarot-the-magician-charms-for-bracelets-711041.jpg",
  "chinese-style-necklace-stainless-steel-18k-gold-clavicle-cha-695745": "/products/chinese-style-necklace-stainless-steel-18k-gold-clavicle-cha-695745.jpg",
  "live-streamed-diamond-encrusted-color-changing-purple-sweate-939202": "/products/live-streamed-diamond-encrusted-color-changing-purple-sweate-939202.jpg",
  "aventurine-white-jade-guanyin-maitreya-buddha-pendant-event-273601": "/products/aventurine-white-jade-guanyin-maitreya-buddha-pendant-event-273601.jpg",
  "ethnic-style-wooden-buddha-beads-sweater-chain-men-s-chicken-387522": "/products/ethnic-style-wooden-buddha-beads-sweater-chain-men-s-chicken-387522.jpg",
  "vietnamese-gold-plated-necklace-for-men-long-lasting-gold-co-035138": "/products/vietnamese-gold-plated-necklace-for-men-long-lasting-gold-co-035138.jpg",
  "rat-ox-tiger-rabbit-dragon-snake-horse-sheep-monkey-rooster-648513": "/products/rat-ox-tiger-rabbit-dragon-snake-horse-sheep-monkey-rooster-648513.jpg",
  "genuine-jade-oil-green-jade-natural-buddha-pendant-big-belli-064513": "/products/genuine-jade-oil-green-jade-natural-buddha-pendant-big-belli-064513.jpg",
  "new-chinese-style-ice-transparent-buddha-golden-branches-and-474562": "/products/new-chinese-style-ice-transparent-buddha-golden-branches-and-474562.jpg",
  "affirmation-bracelets-large-2-5cm-21cm-soft-polyester-elasti-843202": "/products/affirmation-bracelets-large-2-5cm-21cm-soft-polyester-elasti-843202.jpg",
  "stress-toy-with-standing-cards-cute-fidget-sensory-toy-with-809922": "/products/stress-toy-with-standing-cards-cute-fidget-sensory-toy-with-809922.jpg",
  "affirmation-bracelets-regular-2-5cm-18cm-soft-polyester-elas-774081": "/products/affirmation-bracelets-regular-2-5cm-18cm-soft-polyester-elas-774081.jpg",
  "astrology-juno-symbol-925-sterling-silver-hand-textured-dang-293314": "/products/astrology-juno-symbol-925-sterling-silver-hand-textured-dang-293314.jpg",
  "925-sterling-silver-astrology-oppositions-charms-for-bracele-264769": "/products/925-sterling-silver-astrology-oppositions-charms-for-bracele-264769.jpg",
  "925-sterling-silver-astrology-vesta-charms-for-bracelets-nec-337090": "/products/925-sterling-silver-astrology-vesta-charms-for-bracelets-nec-337090.jpg",
  "astrology-pallas-symbol-925-sterling-silver-hand-textured-da-060802": "/products/astrology-pallas-symbol-925-sterling-silver-hand-textured-da-060802.jpg",
  "astrology-semi-squares-symbol-925-sterling-silver-hand-textu-832321": "/products/astrology-semi-squares-symbol-925-sterling-silver-hand-textu-832321.jpg",
  "925-sterling-silver-astrology-venus-charms-for-bracelets-nec-885889": "/products/925-sterling-silver-astrology-venus-charms-for-bracelets-nec-885889.jpg",
  "hexiaole-smart-bluetooth-speaker-aisensing-ambient-sound-adj-452162": "/products/hexiaole-smart-bluetooth-speaker-aisensing-ambient-sound-adj-452162.jpg",
}

type Row = {
  id: string
  handle: string
  title?: string | null
  thumbnail?: string | null
  images?: { id: string; url: string }[] | null
}

export default async function rehostProductImages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const write = process.env.WRITE_REHOST === "1"

  const { data } = (await query.graph({
    entity: "product",
    fields: ["id", "handle", "title", "thumbnail", "images.id", "images.url"],
  })) as { data: Row[] }

  let planned = 0
  let updated = 0
  let skipped = 0

  for (const product of data ?? []) {
    const localPath = LOCAL_PATH[product.handle]
    if (!localPath) continue

    const target = `${SITE}${localPath}`
    const currentThumb = product.thumbnail ?? ""
    const images = product.images ?? []
    const alreadyHome =
      currentThumb === target &&
      images.length === 1 &&
      images[0].url === target

    if (alreadyHome) {
      skipped++
      continue
    }

    planned++
    logger.info(
      `${write ? "[write]" : "[report]"} ${product.title ?? product.handle}: ${currentThumb.slice(0, 60)} -> ${target}`
    )
    if (!write) continue

    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: product.id },
        update: {
          thumbnail: target,
          images: [{ url: target }],
        },
      },
    })
    updated++
  }

  logger.info(
    `rehost-product-images: ${planned} to change, ${updated} updated, ${skipped} already on our domain (write=${write})`
  )
}
