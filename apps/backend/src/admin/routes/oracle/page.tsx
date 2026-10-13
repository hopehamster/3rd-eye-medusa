import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

interface OracleLog {
  id: string
  question: string
  intents: string[] | null
  mode: string
  productIds: string[] | null
  helpful: boolean | null
  needsCanon: boolean
  created_at: string
}

interface LogsResponse {
  logs: OracleLog[]
  count: number
}

async function fetchLogs(needsCanon: boolean): Promise<LogsResponse> {
  const params = new URLSearchParams({ limit: "50" })
  if (needsCanon) {
    params.set("needs_canon", "true")
  }
  const res = await fetch(`/admin/oracle/logs?${params.toString()}`, {
    credentials: "include",
  })
  if (!res.ok) {
    throw new Error("Failed to load consultations")
  }
  return res.json()
}

const OraclePage = () => {
  const [showNeedsCanonOnly, setShowNeedsCanonOnly] = useState(false)
  const { data, isLoading, error } = useQuery({
    queryKey: ["oracle-logs", showNeedsCanonOnly],
    queryFn: () => fetchLogs(showNeedsCanonOnly),
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Oracle Consultations</h1>
          <p className="text-sm text-gray-500 mt-1">
            What visitors asked the Oracle, how it answered, and where the
            canon fell short.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showNeedsCanonOnly}
            onChange={(e) => setShowNeedsCanonOnly(e.target.checked)}
            className="accent-violet-600"
          />
          Needs canon only
        </label>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && (
        <p className="text-sm text-red-600">
          Could not load consultations. Try refreshing.
        </p>
      )}

      {data && data.logs.length === 0 && (
        <p className="text-sm text-gray-500">
          {showNeedsCanonOnly
            ? "No unanswered questions — the canon covers everything asked so far."
            : "No consultations yet. They'll appear here once visitors start asking the Oracle."}
        </p>
      )}

      {data && data.logs.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Question</th>
                <th className="px-4 py-2 font-medium">Intents</th>
                <th className="px-4 py-2 font-medium">Mode</th>
                <th className="px-4 py-2 font-medium">Products</th>
                <th className="px-4 py-2 font-medium">Feedback</th>
                <th className="px-4 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {data.logs.map((log) => (
                <tr key={log.id} className="border-t">
                  <td className="px-4 py-2 max-w-xs">
                    <p className="truncate" title={log.question}>
                      {log.question}
                    </p>
                    {log.needsCanon && (
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        needs canon
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {(log.intents ?? []).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{log.mode}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {(log.productIds ?? []).length || "—"}
                  </td>
                  <td className="px-4 py-2">
                    {log.helpful === true && (
                      <span className="text-green-600">👍</span>
                    )}
                    {log.helpful === false && (
                      <span className="text-red-600">👎</span>
                    )}
                    {log.helpful === null && (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.count > data.logs.length && (
        <p className="text-xs text-gray-500 mt-2">
          Showing {data.logs.length} of {data.count}
        </p>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Oracle",
})

export default OraclePage
