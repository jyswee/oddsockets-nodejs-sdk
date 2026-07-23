# OddSockets Node.js SDK

### Real-time messaging for AI agents — as simple as git.

**Your agents connect in real-time. Autonomously.** OddSockets is the agent-first real-time platform: publish, subscribe, and coordinate across services with `<30ms` global latency and a `99.99%` uptime SLA. This is the official Node.js SDK — automatic manager discovery, worker load balancing, auto-reconnect, and a drop-in PubNub compatibility layer.

[![npm version](https://img.shields.io/npm/v/oddsockets-nodejs.svg)](https://www.npmjs.com/package/oddsockets-nodejs)
[![node](https://img.shields.io/node/v/oddsockets-nodejs.svg)](https://www.npmjs.com/package/oddsockets-nodejs)
[![latency](https://img.shields.io/badge/latency-%3C30ms-brightgreen.svg)](https://oddsockets.com)
[![uptime](https://img.shields.io/badge/uptime-99.99%25-brightgreen.svg)](https://oddsockets.com)

```bash
npm install oddsockets-nodejs
```

> **Building an agent?** OddSockets also ships a zero-boilerplate CLI — `npm install -g oddsockets`, then `oddsockets signup my-app --local` and `oddsockets publish alerts "Deploy complete"`. No API calls, no SDK wiring, just commands. Drop one line in your `CLAUDE.md` or `.cursorrules` and your agent has real-time messaging.

## Why OddSockets

- **Agent-first** — Built for autonomous workflows. Agents publish, subscribe, and coordinate without a human in the loop.
- **Blazing fast** — `<30ms` global latency on a multi-worker cluster with automatic failover and cross-worker fan-out.
- **PubNub alternative — up to 50% cheaper** — Drop-in `PubNubCompat` layer means you migrate in minutes, not weeks.
- **19 SDKs, one platform** — JavaScript, Node.js, Python, Go, Java, Rust, C#, Kotlin, Swift, Flutter, PHP, React Native, Ruby, Elixir, Svelte, C, C++, Unity, and Unreal Engine.
- **Presence & history built in** — Real-time user presence, state, and message history out of the box.
- **Free to start** — 100 MAU, 10,000 messages/day, no credit card. [Get a key](#get-a-free-api-key).

## Migrating from PubNub or Pusher?

| | OddSockets | PubNub | Pusher |
|---|---|---|---|
| **Free tier** | 100 MAU, 10k msgs/day | Limited | Limited |
| **Global latency** | `<30ms` | ~50-100ms | ~50ms |
| **Drop-in compat layer** | Yes (`PubNubCompat`) | — | — |
| **Presence tracking** | Included | Add-on | Included |
| **Agent-native CLI** | Yes | No | No |
| **SDK languages** | 19 | ~10 | ~7 |

Already on PubNub? Skip to the [PubNub Compatibility](#pubnub-compatibility) section — most apps swap the import and keep going.

## Features

- **Simple API** - Easy-to-use interface for real-time messaging
- **Auto-reconnection** - Automatic reconnection with exponential backoff
- **Message Size Validation** - Industry-standard 32KB message size limits
- **Session Stickiness** - Consistent worker assignment for optimal performance
- **PubNub Compatibility** - Drop-in replacement for PubNub applications
- **Bulk Operations** - Publish multiple messages efficiently
- **Presence Tracking** - Real-time user presence and state management

## Quick Start

```javascript
const OddSockets = require('oddsockets-nodejs');

// Initialize the client
const client = new OddSockets({
  apiKey: 'your-api-key-here',
  userId: 'user-123'
});

// Listen for connection events
client.on('connected', () => {
  console.log('Connected to OddSockets');
});

// Get a channel and subscribe
const channel = client.channel('my-channel');

await channel.subscribe((message) => {
  console.log('Received:', message);
});

// Publish a message
await channel.publish({
  text: 'Hello World!',
  timestamp: new Date().toISOString()
});
```

## Configuration Options

```javascript
const client = new OddSockets({
  apiKey: 'your-api-key-here',        // Required: Your OddSockets API key
  userId: 'user-123',                 // Optional: User identifier
  autoConnect: true,                  // Optional: Auto-connect on initialization (default: true)
  options: {                          // Optional: Additional Socket.IO options
    transports: ['websocket', 'polling'],
    timeout: 10000
  }
});
```

## Channel Operations

### Subscribe to Messages

```javascript
const channel = client.channel('my-channel');

// Basic subscription
await channel.subscribe((message) => {
  console.log('Message:', message.message);
  console.log('Publisher:', message.publisher);
  console.log('Timestamp:', message.timestamp);
});

// Subscribe with options
await channel.subscribe((message) => {
  console.log('Received:', message);
}, {
  enablePresence: true,     // Enable presence tracking
  retainHistory: true,      // Keep message history in memory
  maxHistory: 100          // Maximum messages to retain
});
```

### Publish Messages

```javascript
// Simple message
await channel.publish('Hello World!');

// Complex message with metadata
await channel.publish({
  text: 'Hello World!',
  user: 'john_doe',
  timestamp: new Date().toISOString()
}, {
  ttl: 3600,              // Time to live in seconds
  metadata: {             // Additional metadata
    priority: 'high'
  }
});
```

### Bulk Publishing

```javascript
// Publish multiple messages at once
const results = await client.publishBulk([
  { channel: 'channel-1', message: 'Message 1' },
  { channel: 'channel-2', message: 'Message 2' },
  { channel: 'channel-1', message: 'Message 3', options: { ttl: 3600 } }
]);

results.forEach((result, index) => {
  if (result.success) {
    console.log(`Message ${index + 1} published successfully`);
  } else {
    console.error(`Message ${index + 1} failed:`, result.error);
  }
});
```

### Message History

```javascript
// Get recent messages
const history = await channel.getHistory({
  count: 50,                    // Number of messages (default: 50)
  start: '2023-01-01T00:00:00Z', // Start time (ISO string)
  end: '2023-12-31T23:59:59Z'    // End time (ISO string)
});

console.log('History:', history);
```

### Presence Management

```javascript
// Get current presence
const presence = await channel.getPresence();
console.log('Online users:', presence.occupancy);
console.log('User list:', presence.occupants);

// Update user state
await channel.updateState({
  status: 'online',
  mood: 'happy',
  location: 'New York'
});

// Listen for presence changes
channel.on('presence_change', (event) => {
  console.log(`User ${event.user.userId} ${event.action}`);
  console.log('Current occupancy:', event.occupancy);
});
```

## Enhanced Features

Everything beyond core pub/sub — reactions, typing indicators, threads, read
receipts, presence/status, direct messages, notifications, file uploads and
channel management — lives on `client.enhanced`. The pattern is always the same:

1. **Send** an action with a `client.enhanced.*` method.
2. **Receive** the resulting broadcast on the client event surface with
   `client.on('<event>', handler)`.

The worker fans each action out to the other members of the room, so a typing
or reaction event fired by one client surfaces on every *other* subscribed
client — a genuine round-trip, not a local echo.

```javascript
const client = new OddSockets({ apiKey: 'your-api-key-here', userId: 'bob' });
const channel = client.channel('my-channel');
await channel.subscribe(() => {});

// Reactions — everyone in the room hears reaction_added
client.on('reaction_added', (p) => console.log(`reaction: ${p.emoji} by ${p.userId}`));
client.enhanced.addReaction({
  messageId: 'msg-1',
  channel: 'my-channel',
  emoji: ':thumbsup:',
  userId: 'bob',
  userName: 'Bob'
});

// Typing indicators
client.on('user_typing', (p) => console.log(`${p.userId} is typing in ${p.channel}`));
client.enhanced.startTyping('bob', 'my-channel');

// Threads
client.on('thread_reply', (p) => console.log(`reply in ${p.channel}`));
await client.enhanced.threadReply({
  channel: 'my-channel',
  parentMessageId: 'parent-1',
  message: 'nice!',
  userId: 'bob',
  userName: 'Bob'
});
```

The full enhanced surface (all backed by the worker):

| Area | Requests (`client.enhanced.*`) | Broadcast events (`client.on`) |
|---|---|---|
| Reactions | `addReaction`, `removeReaction`, `getReactions` | `reaction_added`, `reaction_removed` |
| Typing | `startTyping`, `stopTyping` | `user_typing`, `user_stopped_typing` |
| Threads | `threadReply`, `getThread`, `subscribeThread`, `markThreadRead`, `followThread`, `unfollowThread` | `thread_reply`, `thread_subscribed`, `thread_followed`, `thread_unfollowed`, `thread_read_updated` |
| Message editing | `editMessage`, `deleteMessage`, `pinMessage`, `unpinMessage`, `getPinnedMessages` | `message_edited`, `message_deleted`, `message_pinned`, `message_unpinned` |
| Read receipts | `markRead`, `getUnreadCounts`, `markAllRead` | `user_read`, `unread_count_updated`, `all_marked_read` |
| Presence & status | `setStatus`, `setCustomStatus`, `clearCustomStatus`, `setDND`, `clearDND`, `getUserPresence` | `user_status_changed`, `custom_status_updated`, `custom_status_cleared`, `dnd_status_changed`, `status_updated` |
| File uploads | `startFileUpload`, `uploadProgress`, `uploadComplete` | `file_upload_completed`, `file_upload_progress`, `file_upload_failed` |
| Direct messages | `createDM`, `sendDM`, `getDMConversations` | `dm_created`, `dm_received` |
| Notifications | `subscribeNotifications`, `markNotificationRead`, `markAllNotificationsRead`, `clearNotifications`, `getNotifications` | `notification`, `notification_read`, `all_notifications_read`, `notifications_cleared` |
| Channel management | `createChannel`, `updateChannel`, `archiveChannel`, `inviteToChannel`, `removeFromChannel`, `joinChannel`, `leaveChannel`, `getChannelMembers` | `channel_created`, `channel_updated`, `user_invited`, `user_joined_channel`, `user_left_channel`, `user_removed` |
| Search | `searchMessages`, `filterMessages`, `searchChannel` | *(promise results, no broadcast)* |

Request methods that read data (`getReactions`, `getThread`, `getUnreadCounts`,
`getUserPresence`, `getPinnedMessages`, `getChannelMembers`, `getDMConversations`,
`getNotifications`, `searchMessages`, …) return a `Promise` that resolves with
the worker's response. Fire-and-forget actions (`addReaction`, `startTyping`,
`setStatus`, …) send immediately and surface as broadcasts on the other clients.

For any worker broadcast not listed above, subscribe to it directly with
`client.on('<event_name>', handler)` — every enhanced broadcast is forwarded
onto the client event surface.

## PubNub Compatibility

Migrate from PubNub with minimal code changes:

```javascript
const { PubNubCompat } = require('oddsockets-nodejs');

// Initialize with PubNub-style config
const pubnub = new PubNubCompat({
  publishKey: 'your-api-key-here',
  subscribeKey: 'your-api-key-here',
  userId: 'user-123'
});

// Add listeners (PubNub style)
pubnub.addListener({
  message: (messageEvent) => {
    console.log('Message:', messageEvent.message);
    console.log('Channel:', messageEvent.channel);
    console.log('Publisher:', messageEvent.publisher);
  },
  presence: (presenceEvent) => {
    console.log('Presence:', presenceEvent.action);
    console.log('User:', presenceEvent.uuid);
  },
  status: (statusEvent) => {
    console.log('Status:', statusEvent.category);
  }
});

// Subscribe to channels
pubnub.subscribe({
  channels: ['channel-1', 'channel-2'],
  withPresence: true
});

// Publish messages
pubnub.publish({
  channel: 'channel-1',
  message: 'Hello from PubNub compatibility!'
}, (response) => {
  if (response.error) {
    console.error('Error:', response.error);
  } else {
    console.log('Published with timetoken:', response.timetoken);
  }
});
```

## Event Handling

```javascript
// Connection events
client.on('connected', () => {
  console.log('Connected to OddSockets');
});

client.on('disconnected', (reason) => {
  console.log('Disconnected:', reason);
});

client.on('reconnecting', (attempt) => {
  console.log(`Reconnecting... attempt ${attempt.attempt}/${attempt.maxAttempts}`);
});

client.on('error', (error) => {
  console.error('Connection error:', error);
});

client.on('worker_assigned', (info) => {
  console.log('Assigned to worker:', info.workerId);
  console.log('Worker URL:', info.workerUrl);
});

// Channel events
channel.on('subscribed', (data) => {
  console.log('Subscribed to channel:', data.channel);
});

channel.on('unsubscribed', (data) => {
  console.log('Unsubscribed from channel:', data.channel);
});

channel.on('published', (data) => {
  console.log('Message published:', data);
});
```

## Error Handling

```javascript
try {
  await channel.publish('Hello World!');
} catch (error) {
  if (error.message.includes('Message size')) {
    console.error('Message too large (max 32KB)');
  } else if (error.message.includes('Not connected')) {
    console.error('Client not connected');
  } else {
    console.error('Publish failed:', error.message);
  }
}
```

## Advanced Usage

### Custom Connection Options

```javascript
const client = new OddSockets({
  apiKey: 'your-api-key-here',
  userId: 'user-123',
  options: {
    transports: ['websocket'],     // Force WebSocket only
    timeout: 15000,                // Connection timeout
    forceNew: true,                // Force new connection
    reconnection: true,            // Enable reconnection
    reconnectionDelay: 1000,       // Initial reconnection delay
    reconnectionAttempts: 5,       // Max reconnection attempts
    maxReconnectionAttempts: 10    // Max total attempts
  }
});
```

### Manual Connection Management

```javascript
const client = new OddSockets({
  apiKey: 'your-api-key-here',
  autoConnect: false  // Don't auto-connect
});

// Connect manually
await client.connect();

// Check connection state
console.log('State:', client.getState()); // 'connected', 'connecting', 'disconnected', 'reconnecting'

// Get worker info
const workerInfo = client.getWorkerInfo();
console.log('Worker ID:', workerInfo.workerId);
console.log('Worker URL:', workerInfo.workerUrl);

// Disconnect
client.disconnect();
```

### Session Information

```javascript
// Get client identifier (used for session stickiness)
const clientId = client.getClientIdentifier();
console.log('Client ID:', clientId);

// Get session info
const session = client.getSessionInfo();
console.log('Session:', session);
```

## Message Size Limits

The SDK enforces industry-standard message size limits:

- **Maximum message size**: 32KB (32,768 bytes)
- **Encoding**: UTF-8
- **Validation**: Automatic before publishing

```javascript
// This will throw an error if message exceeds 32KB
try {
  await channel.publish({
    data: 'x'.repeat(40000) // Too large!
  });
} catch (error) {
  console.error(error.message);
  // "Message size (39KB) exceeds maximum allowed size of 32KB"
}
```

## Examples

Run the included examples:

```bash
# Basic usage example
node examples/basic-usage.js

# PubNub compatibility example
node examples/basic-usage.js pubnub
```

## API Reference

### OddSockets Class

#### Constructor
- `new OddSockets(config)` - Create a new client instance

#### Methods
- `connect()` - Connect to OddSockets platform
- `disconnect()` - Disconnect from platform
- `channel(name)` - Get or create a channel
- `publishBulk(messages)` - Publish multiple messages
- `getState()` - Get connection state
- `getWorkerInfo()` - Get assigned worker information
- `getClientIdentifier()` - Get client identifier
- `getSessionInfo()` - Get session information

#### Properties
- `enhanced` - Enhanced feature surface (reactions, typing, threads, presence/status, DMs, notifications, file uploads, channel management). See [Enhanced Features](#enhanced-features).

#### Events
- `connected` - Connected to platform
- `disconnected` - Disconnected from platform
- `reconnecting` - Attempting to reconnect
- `error` - Connection error occurred
- `worker_assigned` - Assigned to a worker
- Enhanced broadcast events (`reaction_added`, `user_typing`, `thread_reply`, `message_edited`, `notification`, …) are forwarded onto this surface — subscribe with `client.on('<event>', handler)`. Full list under [Enhanced Features](#enhanced-features).

### Channel Class

#### Methods
- `subscribe(callback, options)` - Subscribe to messages
- `unsubscribe()` - Unsubscribe from channel
- `publish(message, options)` - Publish a message
- `getHistory(options)` - Get message history
- `getPresence()` - Get presence information
- `updateState(state)` - Update user state
- `isSubscribed()` - Check subscription status
- `getName()` - Get channel name

#### Events
- `message` - New message received
- `subscribed` - Successfully subscribed
- `unsubscribed` - Successfully unsubscribed
- `published` - Message published
- `presence` - Presence information
- `presence_change` - Presence changed

## Get a Free API Key

AI agents can sign up with a verified email in two steps — no dashboard, no human required.

**Step 1:** Request a verification code
```bash
curl -X POST https://oddsockets.com/api/agent-signup \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "agentName": "my-agent", "platform": "claude"}'
```

**Step 2:** Verify the 6-digit code from your email and get your API key
```bash
curl -X POST https://oddsockets.com/api/agent-signup/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "code": "123456", "agentName": "my-agent"}'
```

## Plans

| | Free | Starter | Pro |
|---|---|---|---|
| **Price** | $0/mo | $49.99/mo | $299/mo |
| **MAU** | 100 | 1,000 | 50,000 |
| **Concurrent connections** | 50 | 1,000 | Unlimited |
| **Messages/day** | 10,000 | 4,320,000 | Unlimited |
| **Messages/minute** | 100 | 3,000 | Unlimited |
| **Channels** | 10 | Unlimited | Unlimited |
| **Storage** | 100MB (24h) | 50GB (6 months) | Unlimited |
| **Webhooks** | No | Yes | Yes |
| **Analytics** | No | Yes | Yes |
| **Support** | Community | 24/5 email & chat | Dedicated team |

All limits are enforced in real time. When a limit is reached, the SDK receives a `RATE_LIMIT_EXCEEDED` error with a `retryAfter` value.

See [pricing](https://oddsockets.com/pricing) for full details.

## Requirements

- Node.js 14.0.0 or higher
- Active OddSockets API key ([get one free](#get-a-free-api-key))

## Support

- [Documentation](https://docs.oddsockets.com/sdks/nodejs)
- [Issue Tracker](https://github.com/jyswee/oddsockets-nodejs-sdk/issues)
- [Email Support](mailto:support@oddsockets.com)

## License

Proprietary - Copyright (c) 2026 Tyga.Cloud Ltd. Licensed for use with the OddSockets platform. See [LICENSE](LICENSE) for the full End User License Agreement.
