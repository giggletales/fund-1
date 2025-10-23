import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import GradientText from '../components/ui/GradientText';
import AnimatedBackground from '../components/AnimatedBackground';
import { ChevronDown, Search } from 'lucide-react';
import { useState } from 'react';

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Questions' },
    { id: 'getting-started', name: 'Getting Started' },
    { id: 'rules', name: 'Trading Rules' },
    { id: 'payouts', name: 'Payouts' },
    { id: 'technical', name: 'Technical' },
    { id: 'account', name: 'Account Management' }
  ];

  const faqs = [
    {
      category: 'getting-started',
      question: 'How do I get started with Fund8r?',
      answer: 'Simply choose your account size on our pricing page, complete the payment, and you\'ll receive instant access to your demo trading account. No waiting period, no approval process.'
    },
    {
      category: 'getting-started',
      question: 'What platforms can I use?',
      answer: 'You can trade on MT4, MT5, cTrader, or DXtrade. Choose whichever platform you\'re most comfortable with.'
    },
    {
      category: 'getting-started',
      question: 'Do I need prior trading experience?',
      answer: 'While we don\'t require proof of experience, our evaluation is designed to assess trading skills. We recommend having a solid understanding of risk management and trading strategies before starting.'
    },
    {
      category: 'rules',
      question: 'What are the profit targets for each phase?',
      answer: 'Phase 1 requires an 8% profit target, Phase 2 requires 5%, and funded accounts have no profit targets. You can trade at your own pace with no time limits on most challenge types.'
    },
    {
      category: 'rules',
      question: 'What is the maximum drawdown rule?',
      answer: 'The maximum drawdown is 6% for both evaluation phases and 8% for funded accounts. This is calculated from your starting balance and moves with your equity high-water mark.'
    },
    {
      category: 'rules',
      question: 'Can I trade during news events?',
      answer: 'Yes! All trading strategies are allowed including news trading, scalping, and automated trading. We have no restrictions on when or how you trade.'
    },
    {
      category: 'rules',
      question: 'Are Expert Advisors (EAs) allowed?',
      answer: 'Absolutely! You can use Expert Advisors, trading bots, and fully automated systems across all phases. We encourage traders to use the tools they\'re comfortable with.'
    },
    {
      category: 'rules',
      question: 'Can I hold trades overnight and over weekends?',
      answer: 'Yes, you can hold positions overnight and over weekends with no restrictions. Trade according to your strategy.'
    },
    {
      category: 'rules',
      question: 'What happens if I violate a rule?',
      answer: 'Rule violations result in immediate account termination. Our automated systems monitor accounts in real-time. However, you can reset your account for 50% off the original fee and try again.'
    },
    {
      category: 'payouts',
      question: 'How fast are payouts processed?',
      answer: 'Payouts are processed within 48 hours of request. You can request payouts every 14 days once you have a funded account.'
    },
    {
      category: 'payouts',
      question: 'What payout methods are available?',
      answer: 'We support PayPal, bank transfer, cryptocurrency (Bitcoin, USDT), and Wise transfers. Choose the method that works best for you.'
    },
    {
      category: 'payouts',
      question: 'What are the profit splits?',
      answer: '$5-10K accounts: 80% trader / 20% Fund8r. $25-50K accounts: 85% / 15%. $100-200K accounts: 90% / 10%. These are industry-leading splits.'
    },
    {
      category: 'payouts',
      question: 'Is there a minimum payout amount?',
      answer: 'Yes, the minimum payout amount is $100. This helps us manage processing fees efficiently while ensuring you receive the maximum amount.'
    },
    {
      category: 'technical',
      question: 'What is the minimum number of trading days?',
      answer: 'You must trade on at least 5 different calendar days during Phase 1 and Phase 2. This ensures consistency rather than lucky single trades.'
    },
    {
      category: 'technical',
      question: 'What is the daily loss limit?',
      answer: 'The daily loss limit is 3% of your starting balance. This resets at 5pm EST daily and helps protect against catastrophic single-day losses.'
    },
    {
      category: 'technical',
      question: 'Can I have multiple accounts?',
      answer: 'Yes! You can purchase and manage multiple evaluation accounts simultaneously. Many successful traders run multiple accounts to diversify strategies.'
    },
    {
      category: 'technical',
      question: 'Is there a time limit on the evaluation?',
      answer: 'Most of our challenge types have no time limits. You can take as long as you need to reach the profit targets while following the rules. Some accelerated challenges may have time limits.'
    },
    {
      category: 'account',
      question: 'What if I fail the challenge?',
      answer: 'If you violate a rule, your account will be terminated. However, you can reset your account for 50% off the original fee and try again. We want you to succeed.'
    },
    {
      category: 'account',
      question: 'Is Phase 2 really free?',
      answer: 'Yes! Phase 2 is 100% free. You only pay once for Phase 1. If you pass Phase 1, you move to Phase 2 at no additional cost.'
    },
    {
      category: 'account',
      question: 'Can I upgrade my account size?',
      answer: 'Once funded, you can scale your account up to $2M based on consistent performance. Each account size increase requires meeting specific performance metrics.'
    },
    {
      category: 'account',
      question: 'Do you offer refunds?',
      answer: 'Challenge fees are non-refundable once you start trading. However, if you haven\'t placed any trades, contact support within 14 days for a potential refund.'
    },
    {
      category: 'technical',
      question: 'What instruments can I trade?',
      answer: 'You can trade Forex pairs, commodities (gold, silver, oil), indices, and cryptocurrencies. The exact instruments depend on your chosen trading platform.'
    },
    {
      category: 'technical',
      question: 'Is there a maximum position size?',
      answer: 'No maximum position size, but your risk per trade should align with proper risk management. Remember the daily loss limit and maximum drawdown rules.'
    },
    {
      category: 'getting-started',
      question: 'Do you charge monthly fees?',
      answer: 'No! We have zero monthly fees. You pay once for Phase 1, and that\'s it. No subscriptions, no hidden recurring charges.'
    },
    {
      category: 'payouts',
      question: 'Do I need to pay for Phase 2?',
      answer: 'No, Phase 2 is completely free. You only pay for Phase 1. This is one of the ways we demonstrate our commitment to trader success.'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Navbar />

      <div className="relative z-10">
        <section className="pt-40 pb-20 px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Frequently Asked <GradientText>Questions</GradientText>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed mb-8">
              Everything you need to know about Fund8r. Can't find what you're looking for? Contact our support team.
            </p>

            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="max-w-6xl mx-auto mb-8">
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    activeCategory === category.id
                      ? 'bg-gradient-to-r from-electric-blue to-cyber-purple text-white'
                      : 'glass-card hover:border-electric-blue/50'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            {filteredFaqs.length > 0 ? (
              <div className="space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <details key={index} className="glass-card p-6 group">
                    <summary className="font-semibold text-lg cursor-pointer flex items-center justify-between list-none">
                      <span className="pr-4">{faq.question}</span>
                      <ChevronDown className="group-open:rotate-180 transition-transform flex-shrink-0" size={20} />
                    </summary>
                    <p className="mt-4 text-gray-400 leading-relaxed">{faq.answer}</p>
                  </details>
                ))}
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <p className="text-gray-400 text-lg">
                  No questions found matching your search. Try different keywords or{' '}
                  <a href="/contact" className="text-electric-blue hover:text-electric-blue/80">
                    contact support
                  </a>.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="pb-20 px-4">
          <div className="max-w-4xl mx-auto glass-card p-12 text-center bg-gradient-to-br from-electric-blue/10 to-cyber-purple/10 border-electric-blue/30">
            <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
            <p className="text-gray-300 mb-6">
              Our support team is ready to help. Get in touch and we'll respond within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <a
                href="/contact"
                className="btn-gradient"
              >
                Contact Support
              </a>
              <a
                href="#"
                className="px-8 py-4 glass-card rounded-lg font-semibold hover:border-electric-blue/50 transition-all"
              >
                Start Live Chat
              </a>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
