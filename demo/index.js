/**
 * OddSockets Node.js SDK — runnable demo
 *
 * A full pub/sub round-trip: connect -> subscribe -> publish -> receive.
 * Uses the SAME published SDK a consumer installs. No mocks.
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

const USER_ID = process.env.ODDSOCKETS_USER_ID || 'demo-agent';
const CHANNEL = 'demo-' + Date.now();
const nonce = Math.random().toString(36).slice(2);

let finished = false;
function finish(code, msg) {
  if (finished) return;
  finished = true;
  console.log(msg);
  try { client.disconnect(); } catch (_) {}
  process.exit(code);
}

const client = new OddSockets({ apiKey: API_KEY, userId: USER_ID, autoConnect: false });

client.on('worker_assigned', (w) =>
  console.log('[worker] assigned', w.workerId, 'via', w.managerUrl));
client.on('error', (e) => console.error('[error]', e.message));

(async () => {
  console.log('[connect] connecting to OddSockets...');
  await client.connect();
  console.log('[connect] state =', client.getState());

  const channel = client.channel(CHANNEL);

  await channel.subscribe((message) => {
    const body = (message && (message.message || message.data)) || message;
    console.log('[recv]', JSON.stringify(body));
    if (body && body.nonce === nonce) {
      finish(0, '\nOK — round-trip verified: published message received back on ' + CHANNEL);
    }
  });
  console.log('[sub] subscribed to', CHANNEL);

  const ack = await channel.publish({ text: 'hello from the Node.js demo', nonce });
  console.log('[pub] published, ack =', JSON.stringify(ack).slice(0, 160));

  setTimeout(() => finish(2, '\nTIMEOUT — no echo received within 15s'), 15000);
})().catch((e) => finish(1, 'FATAL ' + e.message));
