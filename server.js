const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).send('HELLCORE Backend is active.');
});

// Initialize Stripe
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = Stripe(stripeKey, {
  apiVersion: '2026-02-25.preview',
});

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'
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
    
    if (!priceId) {
      return res.status(400).json({ error: 'Missing priceId in request body' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: `${req.headers.origin || 'https://hellcore-gaming-os.onrender.com'}/?success=true`,
      cancel_url: `${req.headers.origin || 'https://hellcore-gaming-os.onrender.com'}/?canceled=true`,
    });
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('❌ Checkout Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 HELLCORE Backend running on port ${PORT}`);
});
