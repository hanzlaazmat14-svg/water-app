// scripts/seed_admin.js
// Utility script to seed an initial Admin / Owner account for a new client project.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey);

async function seedAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  const fullName = process.argv[4] || 'Admin';
  const phone = process.argv[5] || '';

  if (!email || !password) {
    console.log('Usage: node scripts/seed_admin.js <email> <password> [fullName] [phone]');
    process.exit(1);
  }

  console.log(`Creating Admin account for: ${email}`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        role: 'admin'
      }
    }
  });

  if (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }

  console.log(`Admin user created successfully! ID: ${data.user?.id}`);
  console.log('You can now log in at /login with these credentials.');
}

seedAdmin();
