# OddSockets Node.js SDK

Official Node.js SDK for the OddSockets real-time messaging platform. This SDK provides a simple, powerful interface for building real-time applications with automatic manager discovery, worker load balancing, and message size validation.

## Features

- **Simple API** - Easy-to-use interface for real-time messaging
- **Auto-reconnection** - Automatic reconnection with exponential backoff
- **Message Size Validation** - Industry-standard 32KB message size limits
- **Session Stickiness** - Consistent worker assignment for optimal performance
- **PubNub Compatibility** - Drop-in replacement for PubNub applications
- **Bulk Operations** - Publish multiple messages efficiently
- **TypeScript Support** - Full TypeScript definitions included
- **Presence Tracking** - Real-time user presence and state management

## Installation

```bash
npm install @oddsocketsai/nodejs-sdk
```

## Quick Start

```javascript
const OddSockets = require('@oddsocketsai/nodejs-sdk');

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

## PubNub Compatibility

Migrate from PubNub with minimal code changes:

```javascript
const { PubNubCompat } = require('@oddsocketsai/nodejs-sdk');

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

#### Events
- `connected` - Connected to platform
- `disconnected` - Disconnected from platform
- `reconnecting` - Attempting to reconnect
- `error` - Connection error occurred
- `worker_assigned` - Assigned to a worker

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

MIT License - Copyright (c) 2026 Joe Wee, Tyga.Cloud Ltd. See [LICENSE](LICENSE) for details.
