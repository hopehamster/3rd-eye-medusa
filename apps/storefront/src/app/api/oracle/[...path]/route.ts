import { NextRequest } from "next/server"
import { MEDUSA_BACKEND_URL } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"

/**
 * Same-origin proxy for the Oracle API (#137).
 *
 * The storefront signs a customer in inside a server action and keeps the JWT in
 * an httpOnly `_medusa_jwt` cookie — only the server can read it. The browser
 * sdk is created without an `auth` option, so a client-side call to
 * api.3rdeyesupply.com carried no Authorization header and every /store/oracle/*
 * route answered 401 to a signed-in member. The Oracle was unusable in the UI.
 *
 * This handler runs on the server, attaches the cookie's token, and forwards.
 * Streaming passes straight through, so /api/oracle/ask/stream keeps working.
 */
export const dynamic = "force-dynamic"

const buildHeaders = async (req: NextRequest) => {
  const headers = new Headers()
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  if (publishableKey) {
    headers.set("x-publishable-api-key", publishableKey)
  }
  const contentType = req.headers.get("content-type")
  if (contentType) headers.set("content-type", contentType)
  const accept = req.headers.get("accept")
  if (accept) headers.set("accept", accept)

  const auth = await getAuthHeaders()
  if ("authorization" in auth && auth.authorization) {
    headers.set("authorization", auth.authorization)
  }

  return headers
}

async function forward(req: NextRequest, path: string[] | undefined) {
  const suffix = (path ?? []).join("/")
  const url = `${MEDUSA_BACKEND_URL}/store/oracle/${suffix}${req.nextUrl.search}`
  const method = req.method.toUpperCase()

  const init: RequestInit = {
    method,
    headers: await buildHeaders(req),
    // The upstream must not be cached by Next.
    cache: "no-store",
  }

  if (method !== "GET" && method !== "HEAD") {
    init.body = await req.text()
  }

  let upstream: Response
  try {
    upstream = await fetch(url, init)
  } catch {
    return Response.json(
      { message: "The Oracle is unreachable right now." },
      { status: 502 }
    )
  }

  // Streams (SSE) must not be buffered.
  const headers = new Headers()
  const upstreamType = upstream.headers.get("content-type")
  if (upstreamType) headers.set("content-type", upstreamType)
  headers.set("cache-control", "no-store")

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  })
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await ctx.params
  return forward(req, path)
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await ctx.params
  return forward(req, path)
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await ctx.params
  return forward(req, path)
}
