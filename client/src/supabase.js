// client/src/supabase.js
import { createClient } from '@supabase/supabase-js'

// ⚠️ 请把下面两行换成你自己的！
const supabaseUrl = 'https://benkyyrcbmuofhhcealg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbmt5eXJjYm11b2ZoaGNlYWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzODA2ODIsImV4cCI6MjA4MTk1NjY4Mn0.DD7au6zyCVEeHy17Sg9Ef6YX2MA8BzKeSEbzDjsMItk'

export const supabase = createClient(supabaseUrl, supabaseKey)