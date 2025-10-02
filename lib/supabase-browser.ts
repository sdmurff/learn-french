import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './supabase';

export const createBrowserClient = () => createClientComponentClient<Database>();
