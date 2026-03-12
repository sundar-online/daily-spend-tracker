import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zmotsypgjepydtjpvlqq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptb3RzeXBnamVweWR0anB2bHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQwMTYsImV4cCI6MjA4ODUzMDAxNn0.iZWsr4KTb4cC0vi0um3ONElmbWr4uBZF5d6Qw1V-UbM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
