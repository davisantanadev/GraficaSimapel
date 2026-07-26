import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

const missingConfigMessage =
  'Supabase nao esta configurado. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no Vercel.'

if (!isSupabaseConfigured) {
  console.error(missingConfigMessage)
}

function createMissingSupabaseClient(message: string) {
  const handler: ProxyHandler<any> = {
    get() {
      return new Proxy(() => Promise.resolve({ error: new Error(message), data: null }), handler)
    },
    apply() {
      return Promise.resolve({ error: new Error(message), data: null })
    },
  }

  return new Proxy(() => Promise.resolve({ error: new Error(message), data: null }), handler)
}

export const supabase = isSupabaseConfigured
  ? createClient(
      supabaseUrl!,
      supabaseAnonKey!,
      {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      }
    )
  : createMissingSupabaseClient(missingConfigMessage)
