
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://wpdvbcymfrsslxhsgxnv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZHZiY3ltZnJzc2x4aHNneG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0OTk3MTIsImV4cCI6MjA1NjA3NTcxMn0.VZmNLgexrt-g0GjEN3b13VH71OvR2m7DcusATUbRMqA";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);