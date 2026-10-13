import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import { voyageEmbedder } from './src/search/voyage-embedder'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
            },
          },
        ],
      },
    },
    {
      resolve: "./src/modules/oracle",
    },
    {
      resolve: "./src/modules/ai-content",
    },
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          {
            resolve: "./src/modules/cj-fulfillment",
            id: "cj-fulfillment",
            options: {
              apiKey: process.env.CJ_API_KEY,
              email: process.env.CJ_EMAIL,
              dryRun: process.env.CJ_DRY_RUN !== "false",
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/search",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/search-postgres",
            id: "search-postgres",
            options: {
              // Voyage AI embeddings for the `semantic` vector field.
              // Reads VOYAGE_API_KEY lazily at index/query time.
              embedder: voyageEmbedder,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "./src/modules/resend-notification",
            id: "resend",
            options: {
              apiKey: process.env.RESEND_API_KEY,
              from: process.env.RESEND_FROM_EMAIL,
            },
          },
        ],
      },
    },
  ],
})
