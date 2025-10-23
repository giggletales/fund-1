import { supabase } from './config/supabase.js';
import metaapi from './config/metaapi.js';

async function testConnections() {
  console.log('Testing connections...\n');

  console.log('1. Testing Supabase connection...');
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('count');

    if (error) throw error;
    console.log('✅ Supabase connection successful\n');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message, '\n');
  }

  console.log('2. Testing MetaAPI connection...');
  try {
    const accounts = await metaapi.metatraderAccountApi.getAccounts();
    console.log('✅ MetaAPI connection successful');
    console.log(`   Found ${accounts.length} MetaTrader accounts\n`);
  } catch (error) {
    console.error('❌ MetaAPI connection failed:', error.message, '\n');
  }

  console.log('Connection tests completed!');
}

testConnections();
