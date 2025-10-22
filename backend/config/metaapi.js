import dotenv from 'dotenv';

dotenv.config();

// TEMPORARY: MetaAPI is disabled due to browser-only code incompatibility
// Using mock API for development
console.warn('⚠️  MetaAPI is currently disabled (using mock API)');

const api = {
  metatraderAccountApi: {
    getAccount: async (accountId) => {
      console.log(`Mock MetaAPI: getAccount(${accountId})`);
      return {
        deploy: async () => {
          console.log('Mock MetaAPI: deploy()');
        },
        waitConnected: async () => {
          console.log('Mock MetaAPI: waitConnected()');
        },
        getRPCConnection: () => ({
          getAccountInformation: async () => ({
            balance: 10000,
            equity: 10000,
            margin: 0,
            freeMargin: 10000,
            leverage: 100,
            currency: 'USD'
          }),
          getPositions: async () => [],
          getOrders: async () => [],
          getDeals: async () => []
        }),
        disconnect: async () => {
          console.log('Mock MetaAPI: disconnect()');
        }
      };
    }
  }
};

export default api;
