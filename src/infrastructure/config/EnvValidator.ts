/**
 * Server-Side Environment Validator
 *
 * IMPORTANT: This is for SERVER-SIDE use only (API routes, server components, workers)
 * For CLIENT components ('use client'), use ClientEnv instead
 *
 * @see src/infrastructure/config/ClientEnv.ts for client-side env vars
 */

import { logger } from '@/core/base/utils/Logger';
import { ValidationError } from '@/core/base/errors/BaseError';
import { z } from 'zod';

const envSchema = z.object({
  // Temporal Configuration
  TEMPORAL_ADDRESS: z.string().default('localhost:7233'),
  TEMPORAL_NAMESPACE: z.string().default('default'),
  TEMPORAL_TASK_QUEUE: z.string().default('freight-delay-notifications'),

  // Database Configuration
  DATABASE_URL: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),

  // API Keys
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  MAPBOX_ACCESS_TOKEN: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().optional(),
  SENDGRID_FROM_NAME: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  TWILIO_FROM_PHONE: z.string().optional(),

  // Application Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  NEXT_PUBLIC_API_URL: z.string().default(''),

  // Feature Flags
  ENABLE_SMS: z.string().transform((val) => val === 'true').default('false'),
  ENABLE_EMAIL: z.string().transform((val) => val === 'true').default('true'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // Thresholds
  DEFAULT_DELAY_THRESHOLD_MINUTES: z.string().transform(Number).default('30'),

  // Workflow Configuration
  WORKFLOW_CUTOFF_HOURS: z.string().transform(Number).default('72'), // 3 days default

  // Cron Configuration
  CRON_SECRET: z.string().optional(),
  CRON_INTERVAL_SECONDS: z.string().transform(Number).default('600'), // 10 minutes default, 10 seconds for testing

  // Testing Configuration
  TEST_EMAIL: z.string().optional(),
  TEST_PHONE: z.string().optional(),
  TEST_NAME: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

let cachedEnv: EnvConfig | null = null;

function validateEnv(): EnvConfig {
  if (cachedEnv) {
    return cachedEnv;
  }

  try {
    cachedEnv = envSchema.parse(process.env);
    return cachedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => e.path.join('.')).join(', ');
      logger.error('❌ Environment validation failed:', missingVars);
      logger.error('Please check your .env file and ensure all required variables are set.');
      throw new ValidationError(`Missing or invalid environment variables: ${missingVars}`, { errors: error.errors });
    }
    throw error;
  }
}

// Use a Proxy to lazily validate env on first access
export const env = new Proxy({} as EnvConfig, {
  get(_target, prop) {
    const validated = validateEnv();
    return validated[prop as keyof EnvConfig];
  }
});