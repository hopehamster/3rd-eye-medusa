import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/cart", "/checkout", "/account"],
    },
    sitemap: "https://3rdeyesupply.com/sitemap.xml",
  }
}
