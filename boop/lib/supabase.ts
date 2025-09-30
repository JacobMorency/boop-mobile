import { createClient } from "@supabase/supabase-js";

// Get from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface Device {
  id: string;
  code: string;
  name: string;
  expo_push_token?: string;
  platform?: "ios" | "android" | "web";
  created_at: string;
  last_seen_at?: string;
}

export interface Pair {
  id: string;
  device_a: string;
  device_b: string;
  created_at: string;
}

export interface Ping {
  id: string;
  from_device?: string;
  to_device?: string;
  created_at: string;
}
