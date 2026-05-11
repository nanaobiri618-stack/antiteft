import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gilbrkaholcqjobjwuyl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbGJya2Fob2xjcWpvYmp3dXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5ODk1OTQsImV4cCI6MjA5MzU2NTU5NH0.bhVetuAV8iSZM8eiaX1n6evqSYWOlR5_ksX9lukkivU';

export const supabase = createClient(supabaseUrl, supabaseKey);
