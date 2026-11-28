"use client"

import Link from "next/link"
import { motion } from "framer-motion"

type GuideCardProps = {
  href: string
  title: string
  excerpt: string
  topics: string[]
}

/**
 * Guide card — the hover lift from issue #248, in a client component.
 *
 * This component exists because the guides index page is a server
 * component, and touching `motion.div` there calls
 * createMotionComponent() on the server, which throws — the index
 * 500'd at runtime on every request while the [slug] pages (which
 * only render MotionConfig and the Reveal client component) stayed
 * up. The build never caught it: the index has no
 * generateStaticParams, so it renders on demand and the line never
 * runs during prerender. The lift itself is unchanged: 4px rise over
 * 0.3s, easeOut, disabled under reduced motion by the MotionConfig
 * wrapper on the page.
 */
const GuideCard = ({ href, title, excerpt, topics }: GuideCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Link
        href={href}
        className="block h-full rounded-lg border border-white/10 bg-white/[0.02] p-5 hover:border-violet-700/50 hover:bg-white/[0.04] transition"
      >
        <h2 className="font-medium mb-1">{title}</h2>
        <p className="text-sm text-gray-400 line-clamp-2">{excerpt}</p>
        {topics.length > 0 && (
          <p className="text-xs text-gray-500 mt-3">
            {topics.slice(0, 3).join(" · ")}
          </p>
        )}
      </Link>
    </motion.div>
  )
}

export default GuideCard
