import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const accountLogin = url.searchParams.get('login');

    if (!accountLogin) {
      return new Response(
        JSON.stringify({ error: 'MT5 login required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get account details from database
    const { data: accountData, error: dbError } = await supabase
      .from('user_challenges')
      .select('trading_account_id, trading_account_password, trading_account_server, account_size')
      .eq('trading_account_id', accountLogin)
      .single();

    if (dbError || !accountData) {
      console.log('Account not found in database:', accountLogin);
      // Return simulated data for accounts not in DB
      return Response.json(getSimulatedData(), {
        headers: corsHeaders,
      });
    }

    const metaapiToken = Deno.env.get('METAAPI_TOKEN');
    
    if (!metaapiToken) {
      console.log('MetaAPI token not configured, returning simulated data');
      return Response.json(getSimulatedData(), {
        headers: corsHeaders,
      });
    }

    // Try to fetch real data from MetaAPI
    try {
      // First, we need to find or create the MetaAPI account
      // This is a simplified version - in production you'd store the MetaAPI account ID
      const accountResponse = await fetch(
        'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts',
        {
          headers: {
            'auth-token': metaapiToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!accountResponse.ok) {
        console.log('MetaAPI accounts fetch failed, using simulated data');
        return Response.json(getSimulatedData(), {
          headers: corsHeaders,
        });
      }

      const accounts = await accountResponse.json();
      const metaAccount = accounts.find((acc: any) => acc.login === accountLogin);

      if (!metaAccount) {
        console.log('MT5 account not found in MetaAPI, using simulated data');
        return Response.json(getSimulatedData(), {
          headers: corsHeaders,
        });
      }

      // Fetch account state
      const stateResponse = await fetch(
        `https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${metaAccount._id}/state`,
        {
          headers: {
            'auth-token': metaapiToken,
          },
        }
      );

      if (!stateResponse.ok) {
        console.log('MetaAPI state fetch failed, using simulated data');
        return Response.json(getSimulatedData(), {
          headers: corsHeaders,
        });
      }

      const state = await stateResponse.json();

      // Fetch positions
      const positionsResponse = await fetch(
        `https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${metaAccount._id}/positions`,
        {
          headers: {
            'auth-token': metaapiToken,
          },
        }
      );

      const positions = positionsResponse.ok ? await positionsResponse.json() : [];

      // Transform MetaAPI data to our format
      const realTimeData = {
        balance: state.accountInformation?.balance || 0,
        equity: state.accountInformation?.equity || 0,
        margin: state.accountInformation?.margin || 0,
        freeMargin: state.accountInformation?.freeMargin || 0,
        marginLevel: state.accountInformation?.marginLevel || 0,
        openTrades: positions.length || 0,
        profit: state.accountInformation?.profit || 0,
        profitPercentage: state.accountInformation?.balance > 0
          ? ((state.accountInformation?.profit || 0) / state.accountInformation?.balance) * 100
          : 0,
        totalTrades: 0, // Would need historical data
        winRate: 0, // Would need historical data
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        lastUpdate: new Date().toISOString(),
        isLiveData: true,
        trades: positions.map((pos: any) => ({
          id: pos.id,
          symbol: pos.symbol,
          type: pos.type,
          volume: pos.volume,
          openPrice: pos.openPrice,
          currentPrice: pos.currentPrice,
          profit: pos.profit,
          openTime: pos.time,
        })),
      };

      return Response.json(realTimeData, {
        headers: corsHeaders,
      });
    } catch (metaApiError) {
      console.error('MetaAPI error:', metaApiError);
      return Response.json(getSimulatedData(), {
        headers: corsHeaders,
      });
    }
  } catch (error) {
    console.error('Error in get-mt5-data:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getSimulatedData() {
  // Generate dynamic simulated data that changes over time
  const baseBalance = 10000;
  const randomProfit = (Math.random() * 1000) - 500; // -500 to +500
  const equity = baseBalance + randomProfit;
  const profitPercentage = (randomProfit / baseBalance) * 100;

  return {
    balance: baseBalance,
    equity: parseFloat(equity.toFixed(2)),
    margin: parseFloat((Math.random() * 2000).toFixed(2)),
    freeMargin: parseFloat((equity * 0.85).toFixed(2)),
    marginLevel: parseFloat((Math.random() * 500 + 500).toFixed(2)),
    openTrades: Math.floor(Math.random() * 5),
    profit: parseFloat(randomProfit.toFixed(2)),
    profitPercentage: parseFloat(profitPercentage.toFixed(2)),
    totalTrades: Math.floor(Math.random() * 100) + 20,
    winRate: parseFloat((Math.random() * 30 + 50).toFixed(2)),
    averageWin: parseFloat((Math.random() * 200 + 50).toFixed(2)),
    averageLoss: parseFloat((Math.random() * 100 + 30).toFixed(2)),
    profitFactor: parseFloat((Math.random() * 1.5 + 0.8).toFixed(2)),
    sharpeRatio: parseFloat((Math.random() * 2 + 0.5).toFixed(2)),
    maxDrawdown: parseFloat((Math.random() * 10 + 1).toFixed(2)),
    lastUpdate: new Date().toISOString(),
    isLiveData: false,
    trades: generateRandomTrades(),
  };
}

function generateRandomTrades() {
  const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'XAUUSD'];
  const types = ['BUY', 'SELL'];
  const numTrades = Math.floor(Math.random() * 4);
  const trades = [];

  for (let i = 0; i < numTrades; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const profit = (Math.random() * 200) - 100;
    
    trades.push({
      id: `${Date.now()}-${i}`,
      symbol,
      type,
      volume: parseFloat((Math.random() * 0.5 + 0.01).toFixed(2)),
      openPrice: parseFloat((Math.random() * 100 + 1).toFixed(4)),
      currentPrice: parseFloat((Math.random() * 100 + 1).toFixed(4)),
      profit: parseFloat(profit.toFixed(2)),
      openTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    });
  }

  return trades;
}
