import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://akahhpdtbqxkzgceawkj.supabase.co';
const supabaseKey = 'sb_publishable_cPsMI3fBjdpMBUcu_A-RbA_QpfBl_Pf';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('Testing insert to Supabase...');
  try {
    const { data, error } = await supabase.from('movie_interactions').insert({
        movie_id: 12345,
        movie_title: 'Test Movie',
        movie_rating: 8.5,
        interaction: 'like'
    }).select();
    
    if (error) {
      console.error('Insert error:', error);
    } else {
      console.log('Insert successful!', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testInsert();
