import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hejvfbqcvtrarfcqwjny.supabase.co'
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY

let supabase = null;

if (supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey)
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error)
  }
} else {
  console.warn('REACT_APP_SUPABASE_KEY not found. Supabase features will be disabled.')
}

export { supabase }
