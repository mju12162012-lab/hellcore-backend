const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.preview' });
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Stripe Webhook Endpoint (requires raw body for signature verification)
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send('Webhook Error: ' + err.message);
  }
  if (event.type === 'checkout.session.completed') {
    console.log('Payment successful: ' + event.data.object.id);
  }
  res.status(200).json({ received: true });
});

app.use(express.json());

// Checkout Session Endpoint
app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: req.body.priceId, quantity: 1 }],
      mode: 'payment',
      managed_payments: { enabled: true },
      success_url: (req.headers.origin || 'https://your-site.netlify.app') + '/?success=true',
      cancel_url: (req.headers.origin || 'https://your-site.netlify.app') + '/?canceled=true'
    });
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log('Backend running on port ' + PORT));
