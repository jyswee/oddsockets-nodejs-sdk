# OddSockets Node.js SDK — Demo

A tiny, runnable program that proves a real real-time round-trip against OddSockets
using **two independent clients**: **connect → subscribe → publish → receive**.

Because the subscriber (`alice`) and the publisher (`bob`) are separate connections,
a message that reaches the subscriber can only have travelled through the OddSockets
worker — so this doubles as an honest end-to-end regression test (no mocks, no local
echo). It uses the exact SDK you would install.

## 1. Get a free API key

Two-step email verification (no card required):

```bash
# Step 1 — request a code
curl -X POST https://oddsockets.com/api/agent-signup \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","agentName":"demo","platform":"claude"}'

# Step 2 — verify and receive your apiKey
curl -X POST https://oddsockets.com/api/agent-signup/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","code":"123456","agentName":"demo"}'
```

The verify response contains your `apiKey` (starts with `ak_`).

## 2. Run it

```bash
export ODDSOCKETS_API_KEY="ak_your_key_here"
npm install
npm start
```

Expected output:

```
[connect] connecting both clients...
[bob]   worker w002-oddsockets-1
[alice] worker w002-oddsockets-1
[connect] alice = connected , bob = connected
[alice] subscribed to demo-... (presence on)
[bob] published, ack = {"messageId":"...","channel":"demo-...","subscriberCount":1}
[alice] received bob’s message (nonce matched) — real round-trip.
[alice] presence: 1 user(s).
[alice] unsubscribed.

OK — cross-client round-trip verified on demo-...
```

## The code, step by step

Create two clients — a subscriber and a publisher — each on its own connection:

```js
const OddSockets = require('@oddsocketsai/nodejs-sdk');

const subscriber = new OddSockets({ apiKey, userId: 'alice', autoConnect: false });
const publisher  = new OddSockets({ apiKey, userId: 'bob',   autoConnect: false });

await Promise.all([subscriber.connect(), publisher.connect()]);
```

Subscribe on the subscriber (presence enabled):

```js
const inbox = subscriber.channel('my-channel');
await inbox.subscribe((message) => {
  console.log('received:', message.message);
}, { enablePresence: true });
```

Publish from the *other* client — this is what makes the test honest:

```js
const outbox = publisher.channel('my-channel');
const ack = await outbox.publish({ text: 'hello from bob' });
console.log('messageId:', ack.messageId);
```

Inspect presence, then tear down cleanly:

```js
const presence = await inbox.getPresence(); // { channel, count, occupants }
await inbox.unsubscribe();
subscriber.disconnect();
publisher.disconnect();
```

## What it demonstrates

- Manager discovery + automatic worker assignment (fully transparent)
- `client.channel(name)` → `channel.subscribe(cb, opts)` → `channel.publish(msg)`
- **Cross-client delivery**: a message published by `bob` is delivered to `alice`’s
  subscription in real time — provably through the worker, not a local echo
- Presence tracking, unsubscribe, and graceful disconnect
- A 15-second timeout so a stalled round-trip is reported as a failure (non-zero exit)
