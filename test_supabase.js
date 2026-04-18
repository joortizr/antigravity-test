import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://akahhpdtbqxkzgceawkj.supabase.co';
const supabaseKey = 'sb_publishable_cPsMI3fBjdpMBUcu_A-RbA_QpfBl_Pf';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing connection to Supabase...');
  try {
    // Intentemos obtener solo 1 registro.
    const { data, error } = await supabase.from('movie_interactions').select('id').limit(1);
    
    if (error) {
      console.error('Connection error:', error.message);
      // Let's assume the table might not exist yet if they didn't run the SQL
      if (error.code === '42P01') {
        console.log('Table does not exist yet. The connection works, but the SQL schema needs to be run in Supabase Editor.');
      }
    } else {
      console.log('Connection successful!', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();
