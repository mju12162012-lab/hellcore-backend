const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key_for_build', {
  apiVersion: '2026-02-25.preview',
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log(`✅ Payment successful: ${session.id}`);
  }

  res.status(200).json({ received: true });
});

app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      managed_payments: { enabled: true },
      success_url: `${req.headers.origin || 'https://your-site.netlify.app'}/?success=true`,
      cancel_url: `${req.headers.origin || 'https://your-site.netlify.app'}/?canceled=true`,
    });
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 HELLCORE Backend running on port ${PORT}`);
});
