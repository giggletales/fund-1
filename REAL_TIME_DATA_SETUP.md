# Real-Time MT5 Data Setup - Complete

## ✅ What Was Fixed:

### 1. Created Supabase Edge Function
- **Function Name**: `get-mt5-data`
- **Location**: Deployed to Supabase
- **Purpose**: Fetches MT5 trading data (currently returns simulated data)
- **Endpoint**: `https://hjqbrnutxuyqfqoxwxov.supabase.co/functions/v1/get-mt5-data`

### 2. Updated Dashboard Analytics
- **Removed**: localhost:5000 backend dependency
- **Added**: Direct connection to Supabase Edge Function
- **Features**:
  - Fetches data using MT5 login from account
  - Handles accounts without credentials (shows static data)
  - Shows simulated trading data with realistic metrics
  - Proper error handling with retry button

### 3. Data Flow:
```
User clicks Analytics →
Dashboard checks if MT5 login exists →
Calls Supabase Edge Function →
Edge Function returns trading data →
Dashboard displays real-time metrics
```

## 📊 Current Data Structure:

The edge function returns:
- **Account Metrics**: Balance, Equity, Margin, Free Margin, Margin Level
- **Trading Stats**: Open trades, Total profit, Win rate
- **Performance**: Profit factor, Sharpe ratio, Max drawdown
- **Open Positions**: Current trades with symbols, volumes, P&L

## 🔧 How to Enable REAL MetaAPI Integration:

Currently the edge function returns simulated data. To connect to real MetaAPI:

1. **Get MetaAPI Token**:
   - Sign up at https://metaapi.cloud
   - Get your API token

2. **Update Edge Function**:
   ```typescript
   // Add at top of index.ts
   const METAAPI_TOKEN = Deno.env.get('METAAPI_TOKEN');

   // Replace simulated data with:
   const response = await fetch(
     `https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountId}/state`,
     {
       headers: {
         'auth-token': METAAPI_TOKEN,
       }
     }
   );
   const accountState = await response.json();
   ```

3. **Set Environment Variable in Supabase**:
   - Go to Supabase Dashboard
   - Settings → Edge Functions → Secrets
   - Add `METAAPI_TOKEN` with your token

## 🎯 What Now Works:

1. ✅ No more "localhost:5000" errors
2. ✅ Analytics loads simulated real-time data
3. ✅ Shows trading metrics, positions, stats
4. ✅ Proper error handling with retry
5. ✅ Works for accounts with and without MT5 credentials
6. ✅ Clean, production-ready UI

## 📱 User Experience:

**Without MT5 Credentials:**
- Shows account balance from database
- Displays "Static Data" indicator (yellow)
- Message: "Simulated data until credentials activated"

**With MT5 Credentials:**
- Fetches data from edge function
- Shows simulated trading activity
- Can be upgraded to real MetaAPI data

## 🚀 Next Steps for Full Production:

1. Get MetaAPI account and token
2. Update edge function with real MetaAPI integration
3. Test with actual MT5 accounts
4. Enable auto-refresh (currently manual)
5. Add WebSocket support for real-time updates

## 🔐 Security:

- Edge function requires JWT authentication
- CORS properly configured
- MetaAPI token stored as environment variable (not in code)
- User can only access their own account data
