// Payments provider. Uses Stripe when STRIPE_SECRET_KEY is set; otherwise a safe demo simulator.
// Stripe PaymentIntents with automatic_payment_methods enables Card, Apple Pay, Google Pay, Link
// (and any other wallet you switch on in the Stripe Dashboard) without code changes.

function createPayments(env) {
  if (!env.STRIPE_SECRET_KEY) {
    let n = 0;
    return {
      mode: 'demo',
      publishableKey: null,
      async createIntent({ amount }) { const id = `pi_demo_${Date.now()}_${++n}`; return { id, client_secret: `${id}_secret_demo`, amount }; },
      async retrieveIntent(id, { method } = {}) { return { id, status: 'succeeded', method: method || 'card' }; },
      async refund() { return { id: `re_demo_${Date.now()}` }; },
      async onboardMerchant() { return { accountId: `acct_demo_${Date.now()}`, chargesEnabled: true, url: null }; },
      transfer: null
    };
  }

  const Stripe = require('stripe');
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const methodOf = (pi) => {
    const pm = pi.payment_method;
    if (pm && typeof pm === 'object') {
      if (pm.card && pm.card.wallet && pm.card.wallet.type) return pm.card.wallet.type;   // apple_pay | google_pay | link
      return pm.type || 'card';
    }
    return 'card';
  };

  return {
    mode: 'stripe',
    publishableKey: env.STRIPE_PUBLISHABLE_KEY,
    stripe,
    async createIntent({ amount, currency, metadata, receipt_email, transfer_group }) {
      const pi = await stripe.paymentIntents.create({
        amount, currency: currency || 'usd', metadata, receipt_email, transfer_group,
        automatic_payment_methods: { enabled: true },
        statement_descriptor_suffix: 'BUCKDUCK'
      });
      return { id: pi.id, client_secret: pi.client_secret };
    },
    async retrieveIntent(id) {
      const pi = await stripe.paymentIntents.retrieve(id, { expand: ['payment_method'] });
      return { id: pi.id, status: pi.status, method: methodOf(pi) };
    },
    async refund(paymentIntentId, amount) {
      return stripe.refunds.create({ payment_intent: paymentIntentId, amount });
    },
    async onboardMerchant({ store, user, returnUrl }) {
      let accountId = store.stripe_account_id;
      if (!accountId) {
        const acct = await stripe.accounts.create({
          type: 'express', country: 'US', email: user.email, business_type: 'company',
          business_profile: { name: store.name, mcc: '5411', product_description: 'Grocery store selling through the BuckDuck marketplace' },
          capabilities: { transfers: { requested: true } }, metadata: { store_id: String(store.id) }
        });
        accountId = acct.id;
      }
      const acct = await stripe.accounts.retrieve(accountId);
      if (acct.charges_enabled || acct.payouts_enabled) {
        const login = await stripe.accounts.createLoginLink(accountId);
        return { accountId, chargesEnabled: true, url: login.url };
      }
      const link = await stripe.accountLinks.create({ account: accountId, refresh_url: returnUrl, return_url: returnUrl, type: 'account_onboarding' });
      return { accountId, chargesEnabled: false, url: link.url };
    },
    async transfer({ amount, destination, transfer_group, metadata }) {
      return stripe.transfers.create({ amount, currency: 'usd', destination, transfer_group, metadata });
    },
    constructEvent(rawBody, sig) { return stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET); },
    methodOf
  };
}
module.exports = { createPayments };
