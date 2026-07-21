/**
 * OddSockets Node.js SDK — runnable two-client demo
 *
 * A genuine end-to-end round-trip using TWO independent clients:
 *   - a SUBSCRIBER (user "alice") that listens on a channel
 *   - a PUBLISHER  (user "bob")   that sends one message
 *
 * Because they are separate connections, a message reaching the subscriber can
 * ONLY have travelled through the OddSockets worker — it cannot be a local echo.
 * A matched nonce here is proof of a real round-trip. Uses the SAME published
 * SDK a consumer installs. No mocks.
 *
 * Exercised surface: connect -> subscribe (+presence) -> publish -> receive
 * -> presence -> unsubscribe -> disconnect.
 *
 * Run:
 *   export ODDSOCKETS_API_KEY="ak_..."   # get a free key: see README
 *   npm install
 *   node index.js
 */
const OddSockets = require('@oddsocketsai/nodejs-sdk');

const API_KEY = process.env.ODDSOCKETS_API_KEY;
if (!API_KEY) {
  console.error('Missing ODDSOCKETS_API_KEY. Get a free key (see README), then:');
  console.error('  export ODDSOCKETS_API_KEY="ak_..."');
  process.exit(1);
}

const CHANNEL = 'demo-' + Date.now();
const nonce = Math.random().toString(36).slice(2);

let finished = false;
function finish(code, msg) {
  if (finished) return;
  finished = true;
  console.log(msg);
  try { subscriber.disconnect(); } catch (_) {}
  try { publisher.disconnect(); } catch (_) {}
  process.exit(code);
}

// Two independent clients on the same platform.
const subscriber = new OddSockets({ apiKey: API_KEY, userId: 'alice', autoConnect: false });
const publisher  = new OddSockets({ apiKey: API_KEY, userId: 'bob',   autoConnect: false });

subscriber.on('worker_assigned', (w) => console.log('[alice] worker', w.workerId));
publisher.on('worker_assigned',  (w) => console.log('[bob]   worker', w.workerId));
subscriber.on('error', (e) => console.error('[alice] error', e.message));
publisher.on('error',  (e) => console.error('[bob]   error', e.message));

(async () => {
  console.log('[connect] connecting both clients...');
  await Promise.all([subscriber.connect(), publisher.connect()]);
  console.log('[connect] alice =', subscriber.getState(), ', bob =', publisher.getState());

  // Subscriber joins with presence enabled.
  const inbox = subscriber.channel(CHANNEL);
  await inbox.subscribe(async (message) => {
    const body = (message && (message.message || message.data)) || message;
    if (body && body.nonce === nonce) {
      console.log('[alice] received bob\u2019s message (nonce matched) — real round-trip.');
      try {
        const presence = await inbox.getPresence();
        const count = presence && (presence.count != null ? presence.count
          : (presence.occupants ? presence.occupants.length : undefined));
        if (count !== undefined) console.log('[alice] presence:', count, 'user(s).');
        await inbox.unsubscribe();
        console.log('[alice] unsubscribed.');
      } catch (_) { /* best-effort; round-trip already proven */ }
      finish(0, '\nOK — cross-client round-trip verified on ' + CHANNEL);
    }
  }, { enablePresence: true });
  console.log('[alice] subscribed to', CHANNEL, '(presence on)');

  // Publisher sends from its OWN connection.
  const outbox = publisher.channel(CHANNEL);
  const ack = await outbox.publish({ text: 'hello from bob', nonce, from: 'bob' });
  console.log('[bob] published, ack =', JSON.stringify(ack).slice(0, 160));

  setTimeout(() => finish(2, '\nTIMEOUT — no cross-client delivery within 15s'), 15000);
})().catch((e) => finish(1, 'FATAL ' + e.message));
