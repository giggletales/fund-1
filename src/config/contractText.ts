export const CONTRACT_VERSION = '1.0';
export const LAST_UPDATED = '2025-10-18';
export const COMPANY_NAME = 'Fund8r';
export const COMPANY_EMAIL = 'legal@fund8r.com';

export interface ContractData {
  fullName: string;
  email: string;
  country: string;
  challengeType: string;
  accountSize: number;
  purchasePrice: number;
  profitTarget: number;
  maxDailyLoss: number;
  maxTotalLoss: number;
  payoutCycle?: string;
  profitSplit?: number;
}

export function generateContractText(data: ContractData): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const profitTargetAmount = (data.accountSize * data.profitTarget / 100).toLocaleString();
  const maxDailyLossAmount = (data.accountSize * data.maxDailyLoss / 100).toLocaleString();
  const maxTotalLossAmount = (data.accountSize * data.maxTotalLoss / 100).toLocaleString();

  return `
PROPRIETARY TRADING CHALLENGE AGREEMENT

This Agreement is entered into on ${currentDate} ("Effective Date") between:

${COMPANY_NAME} ("Company," "we," "us," or "our")
Email: ${COMPANY_EMAIL}

AND

${data.fullName} ("Trader," "you," or "your")
Email: ${data.email}
Country: ${data.country}

═══════════════════════════════════════════════════════════════════

1. DEFINITIONS

1.1 "Challenge" means the trading evaluation program where Trader demonstrates trading proficiency.
1.2 "Demo Account" means a simulated trading account provided for the Challenge.
1.3 "Funded Account" means a proprietary trading account provided upon successful completion of Challenge.
1.4 "Trading Platform" means MetaTrader 5 or other designated trading software.
1.5 "Challenge Fee" means the one-time fee paid to participate: $${data.purchasePrice}
1.6 "Account Size" means the simulated capital amount: $${data.accountSize.toLocaleString()}
1.7 "Profit Target" means the required profit threshold: ${data.profitTarget}% ($${profitTargetAmount})
1.8 "Maximum Daily Loss" means the daily loss limit: ${data.maxDailyLoss}% ($${maxDailyLossAmount})
1.9 "Maximum Total Loss" means the total drawdown limit: ${data.maxTotalLoss}% ($${maxTotalLossAmount})

═══════════════════════════════════════════════════════════════════

2. NATURE OF SERVICE - SIMULATED TRADING ENVIRONMENT

2.1 DEMO/SIMULATED ACCOUNTS
The Trader acknowledges and agrees that:
a) The Challenge uses DEMO/SIMULATED trading accounts
b) NO REAL MONEY is traded during the Challenge phase
c) All trades are executed in a simulated environment
d) Account balance and equity are SIMULATED values
e) This is an EVALUATION SERVICE, not investment management

2.2 NO INVESTMENT ADVICE
a) The Company does NOT provide investment, financial, or trading advice
b) All trading decisions are solely the Trader's responsibility
c) Past performance does not guarantee future results

═══════════════════════════════════════════════════════════════════

3. CHALLENGE RULES AND REQUIREMENTS

3.1 PROFIT TARGET
Trader must achieve a profit of ${data.profitTarget}% ($${profitTargetAmount})

3.2 MAXIMUM DAILY LOSS RULE
Trader must NOT exceed a daily loss of ${data.maxDailyLoss}% ($${maxDailyLossAmount})
a) Daily loss is calculated from 00:00 to 23:59 UTC
b) Includes floating and closed profit/loss
c) Violation results in immediate Challenge termination

3.3 MAXIMUM TOTAL LOSS RULE
Trader must NOT exceed total drawdown of ${data.maxTotalLoss}% ($${maxTotalLossAmount})
a) Measured from highest equity or initial balance
b) Violation results in immediate Challenge termination

3.4 MINIMUM TRADING DAYS
Trader must trade for a minimum of 5 calendar days with at least one position opened per day.

3.5 PROHIBITED TRADING PRACTICES
The following are STRICTLY PROHIBITED:
a) Account Sharing
b) Copy Trading or using signals from other traders
c) Arbitrage Trading
d) High-Frequency Trading (HFT)
e) Tick Scalping
f) Using Multiple IPs simultaneously
g) News Arbitrage
h) Coordination with other participants

═══════════════════════════════════════════════════════════════════

4. FEES AND PAYMENTS

4.1 CHALLENGE FEE
One-time non-refundable fee: $${data.purchasePrice}

4.2 REFUND POLICY
a) NO REFUNDS after account credentials are issued
b) NO REFUNDS for rule violations or Challenge failure
c) Refunds may be granted for technical issues at Company's sole discretion within 14 days

4.3 FUNDED ACCOUNT TERMS
Upon successful Challenge completion:
a) Profit split: ${data.profitSplit || 100}% to Trader, ${100 - (data.profitSplit || 100)}% to Company
b) Payout cycle: ${data.payoutCycle || 'Bi-Monthly'} (${
  data.payoutCycle === 'BI_MONTHLY' ? 'Every 2 months' :
  data.payoutCycle === 'MONTHLY' ? 'Every month' :
  data.payoutCycle === 'BI_WEEKLY' ? 'Every 2 weeks' :
  data.payoutCycle === 'WEEKLY' ? 'Every week' : 'Every 2 months'
})
c) First payout after meeting minimum performance requirements
d) Minimum payout: $100

═══════════════════════════════════════════════════════════════════

5. ACCOUNT ACCESS AND CREDENTIALS

5.1 CREDENTIAL RELEASE
Trading account credentials will be released ONLY after:
i. Full payment received
ii. This Agreement signed electronically
iii. All required information provided

5.2 ACCOUNT SECURITY
Trader is responsible for:
a) Maintaining confidentiality of login credentials
b) All activity on the account
c) Not sharing account access with any third party

═══════════════════════════════════════════════════════════════════

6. RISK DISCLOSURE

6.1 TRADING RISKS
Trader acknowledges that:
a) Trading involves substantial risk of loss
b) Simulated performance does not guarantee real trading success
c) Leverage increases both profit and loss potential
d) Past performance is not indicative of future results

6.2 NO GUARANTEED INCOME
a) There is NO GUARANTEE of passing the Challenge
b) There is NO GUARANTEE of receiving a Funded Account
c) Success depends on individual skill and market conditions

═══════════════════════════════════════════════════════════════════

7. COMPANY LIABILITY LIMITATIONS

7.1 LIMITED LIABILITY
TO THE MAXIMUM EXTENT PERMITTED BY LAW:
a) Company is NOT liable for any trading losses
b) Company is NOT liable for platform technical issues
c) Total liability is limited to Challenge Fee paid

7.2 NO WARRANTIES
Company provides services "AS IS" without warranties of uninterrupted service or error-free operation.

═══════════════════════════════════════════════════════════════════

8. TRADER REPRESENTATIONS AND WARRANTIES

Trader represents and warrants that:

8.1 AGE AND CAPACITY
a) Trader is at least 18 years old
b) Trader has legal capacity to enter this Agreement

8.2 ACCURATE INFORMATION
All information provided is true, accurate, and complete

8.3 COMPLIANCE WITH LAWS
Trader will comply with all applicable laws and tax obligations

8.4 NO PROHIBITED ACTIVITY
Trader will NOT engage in any prohibited trading practices

═══════════════════════════════════════════════════════════════════

9. PRIVACY AND DATA PROTECTION

9.1 DATA COLLECTION
Company collects personal information, payment information, and trading activity data.

9.2 DATA USE
Data is used for account management, compliance monitoring, and service improvement.

9.3 DATA SECURITY
Company uses industry-standard security measures to protect your data.

═══════════════════════════════════════════════════════════════════

10. TERMINATION

10.1 AUTOMATIC TERMINATION
Challenge terminates automatically upon:
a) Violation of Daily Loss limit
b) Violation of Total Loss limit
c) Violation of any trading rule
d) Reaching Profit Target (successful completion)

10.2 COMPANY TERMINATION RIGHTS
Company may terminate immediately for breach of this Agreement or fraudulent activity.

═══════════════════════════════════════════════════════════════════

11. DISPUTE RESOLUTION

11.1 GOVERNING LAW
This Agreement is governed by applicable laws.

11.2 ARBITRATION
Any disputes will be resolved through binding arbitration.

═══════════════════════════════════════════════════════════════════

12. GENERAL PROVISIONS

12.1 ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the parties.

12.2 AMENDMENTS
Company may modify this Agreement with 30 days notice.

12.3 ELECTRONIC SIGNATURE
By signing electronically, Trader agrees to be legally bound by all terms.

═══════════════════════════════════════════════════════════════════

ACKNOWLEDGMENT AND ACCEPTANCE

By signing this Agreement electronically, Trader acknowledges:

✓ I have READ and UNDERSTAND this entire Agreement
✓ I AGREE to all Terms and Conditions
✓ I ACCEPT all risks disclosed herein
✓ I understand this is a SIMULATED trading environment
✓ I am OVER 18 years of age
✓ All information provided is ACCURATE
✓ I will comply with all TRADING RULES
✓ The Challenge Fee is NON-REFUNDABLE
✓ I will not engage in PROHIBITED PRACTICES
✓ I consent to DATA COLLECTION and MONITORING
✓ This is a LEGALLY BINDING contract

═══════════════════════════════════════════════════════════════════

Contract Version: ${CONTRACT_VERSION}
Last Updated: ${LAST_UPDATED}

This is a legally binding electronic contract.
Please retain for your records.

═══════════════════════════════════════════════════════════════════
  `.trim();
}
