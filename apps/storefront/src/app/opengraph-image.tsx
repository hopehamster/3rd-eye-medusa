import { ImageResponse } from "next/og"

/**
 * Social share card. Previously the repo referenced
 * src/app/opengraph-image.jpg, which never existed — so every shared link
 * rendered without a preview image.
 */
export const alt = "3rd Eye Supply — crystals, ritual objects & the Oracle"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#f7f3ec",
          color: "#2a241f",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#8a7a63",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#c9a86a",
            }}
          />
          3rd Eye Supply
        </div>
        <div
          style={{
            fontSize: 76,
            lineHeight: 1.1,
            marginTop: 28,
            maxWidth: 900,
            fontWeight: 600,
          }}
        >
          Crystals, ritual objects &amp; the Oracle
        </div>
        <div style={{ fontSize: 30, marginTop: 28, color: "#6b6152", maxWidth: 820 }}>
          Chosen for intention. Answered honestly.
        </div>
      </div>
    ),
    size
  )
}
