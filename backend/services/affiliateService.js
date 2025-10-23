import { supabase } from '../config/supabase.js';
import crypto from 'crypto';

class AffiliateService {
  generateAffiliateCode(userId) {
    const hash = crypto.createHash('sha256').update(userId + Date.now()).digest('hex');
    return hash.substring(0, 10).toUpperCase();
  }

  async createAffiliate(userId) {
    try {
      const affiliateCode = this.generateAffiliateCode(userId);

      const { data, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: userId,
          affiliate_code: affiliateCode,
          commission_rate: 10,
          total_referrals: 0,
          total_earnings: 0,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating affiliate:', error);
      throw error;
    }
  }

  async trackReferral(affiliateCode, referredUserId) {
    try {
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('*')
        .eq('affiliate_code', affiliateCode)
        .eq('status', 'active')
        .single();

      if (!affiliate) {
        return null;
      }

      const { data: referral } = await supabase
        .from('referrals')
        .insert({
          affiliate_id: affiliate.id,
          referred_user_id: referredUserId,
          status: 'pending'
        })
        .select()
        .single();

      await supabase
        .from('affiliates')
        .update({
          total_referrals: affiliate.total_referrals + 1
        })
        .eq('id', affiliate.id);

      return referral;
    } catch (error) {
      console.error('Error tracking referral:', error);
      throw error;
    }
  }

  async processCommission(paymentId) {
    try {
      const { data: payment } = await supabase
        .from('payments')
        .select('*, users:user_id(*)')
        .eq('id', paymentId)
        .single();

      if (!payment) return;

      const { data: referral } = await supabase
        .from('referrals')
        .select('*, affiliates(*)')
        .eq('referred_user_id', payment.user_id)
        .eq('status', 'pending')
        .maybeSingle();

      if (!referral) return;

      const commissionAmount = payment.amount * (referral.affiliates.commission_rate / 100);

      await supabase.from('commissions').insert({
        affiliate_id: referral.affiliate_id,
        referral_id: referral.id,
        payment_id: paymentId,
        amount: commissionAmount,
        status: 'pending'
      });

      await supabase
        .from('referrals')
        .update({
          status: 'completed',
          converted_at: new Date().toISOString()
        })
        .eq('id', referral.id);

      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('*')
        .eq('id', referral.affiliate_id)
        .single();

      await supabase
        .from('affiliates')
        .update({
          total_earnings: affiliate.total_earnings + commissionAmount
        })
        .eq('id', referral.affiliate_id);

      console.log(`Commission of $${commissionAmount} created for affiliate ${referral.affiliate_id}`);
    } catch (error) {
      console.error('Error processing commission:', error);
      throw error;
    }
  }

  async getAffiliateStats(userId) {
    try {
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!affiliate) {
        return null;
      }

      const { data: referrals } = await supabase
        .from('referrals')
        .select('*, users:referred_user_id(email, full_name)')
        .eq('affiliate_id', affiliate.id);

      const { data: commissions } = await supabase
        .from('commissions')
        .select('*')
        .eq('affiliate_id', affiliate.id);

      const pendingEarnings = commissions
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + c.amount, 0);

      const paidEarnings = commissions
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.amount, 0);

      return {
        affiliate,
        referrals,
        commissions,
        stats: {
          total_referrals: referrals.length,
          pending_earnings: pendingEarnings,
          paid_earnings: paidEarnings,
          total_earnings: affiliate.total_earnings
        }
      };
    } catch (error) {
      console.error('Error getting affiliate stats:', error);
      throw error;
    }
  }

  async processPayouts() {
    try {
      const { data: pendingCommissions } = await supabase
        .from('commissions')
        .select('*, affiliates(*, users:user_id(*))')
        .eq('status', 'pending');

      const affiliateGroups = {};

      pendingCommissions.forEach(commission => {
        const affiliateId = commission.affiliate_id;
        if (!affiliateGroups[affiliateId]) {
          affiliateGroups[affiliateId] = {
            affiliate: commission.affiliates,
            commissions: [],
            total: 0
          };
        }
        affiliateGroups[affiliateId].commissions.push(commission);
        affiliateGroups[affiliateId].total += commission.amount;
      });

      for (const [affiliateId, group] of Object.entries(affiliateGroups)) {
        if (group.total >= 100) {
          await supabase.from('payouts').insert({
            affiliate_id: affiliateId,
            amount: group.total,
            status: 'pending',
            requested_at: new Date().toISOString()
          });

          const commissionIds = group.commissions.map(c => c.id);
          await supabase
            .from('commissions')
            .update({ status: 'processing' })
            .in('id', commissionIds);

          console.log(`Payout of $${group.total} created for affiliate ${affiliateId}`);
        }
      }
    } catch (error) {
      console.error('Error processing payouts:', error);
      throw error;
    }
  }
}

export default new AffiliateService();
