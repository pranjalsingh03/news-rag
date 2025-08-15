import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    
    // Database
    DATABASE_URL: z.string().url().optional(),
    
    // Vector Database (ChromaDB Cloud)
    CHROMADB_API_KEY: z.string().min(1),
    CHROMADB_TENANT: z.string().min(1),
    CHROMADB_DATABASE: z.string().min(1),
    

    
    // Supabase - Optional for development
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    
    // AI/LLM Services (Choose one)
    // OpenAI Configuration
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().default("gpt-3.5-turbo"),
    OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-ada-002"),
    
    // Google Gemini Configuration
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().default("gemini-1.5-flash"),
    GEMINI_EMBEDDING_MODEL: z.string().default("text-embedding-004"),
    
    // AI Provider Selection
    AI_PROVIDER: z.enum(["openai", "gemini"]).default("gemini"),
    
    // News APIs - Only NEWS_API_KEY required for basic functionality
    NEWS_API_KEY: z.string().min(1),
    GUARDIAN_API_KEY: z.string().optional(),
    NYT_API_KEY: z.string().optional(),
    
    // Redis (Optional for caching)
    UPSTASH_REDIS_URL: z.string().url().optional(),
    UPSTASH_REDIS_TOKEN: z.string().optional(),
    
    // Rate Limiting
    RATE_LIMIT_MAX: z.coerce.number().default(100),
    RATE_LIMIT_WINDOW: z.coerce.number().default(3600),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtime (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    
    // Database
    DATABASE_URL: process.env.DATABASE_URL,
    
    // Vector Database (ChromaDB Cloud)
    CHROMADB_API_KEY: process.env.CHROMADB_API_KEY,
    CHROMADB_TENANT: process.env.CHROMADB_TENANT,
    CHROMADB_DATABASE: process.env.CHROMADB_DATABASE,

    
    // Supabase
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    
    // AI/LLM Services
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL,
    AI_PROVIDER: process.env.AI_PROVIDER,
    
    // News APIs
    NEWS_API_KEY: process.env.NEWS_API_KEY,
    GUARDIAN_API_KEY: process.env.GUARDIAN_API_KEY,
    NYT_API_KEY: process.env.NYT_API_KEY,
    
    // Redis
    UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL,
    UPSTASH_REDIS_TOKEN: process.env.UPSTASH_REDIS_TOKEN,
    
    // Rate Limiting
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
    
    // Client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  /**
   * Run `build` or `dev` with SKIP_ENV_VALIDATION to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
