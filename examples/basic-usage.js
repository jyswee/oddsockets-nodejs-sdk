const OddSockets = require('../src/index');

// Example: Basic OddSockets usage
async function basicExample() {
  console.log('🚀 OddSockets Node.js SDK - Basic Example');
  
  // Initialize the client
  const client = new OddSockets({
    apiKey: 'your-api-key-here',
    userId: 'user-123'
  });
  
  // Listen for connection events
  client.on('connected', () => {
    console.log('✅ Connected to OddSockets');
  });
  
  client.on('disconnected', () => {
    console.log('❌ Disconnected from OddSockets');
  });
  
  client.on('error', (error) => {
    console.error('🔥 Error:', error.message);
  });
  
  // Get a channel
  const channel = client.channel('my-channel');
  
  // Subscribe to messages
  await channel.subscribe((message) => {
    console.log('📨 Received message:', message);
  });
  
  // Publish a message
  try {
    const result = await channel.publish({
      text: 'Hello from Node.js!',
      timestamp: new Date().toISOString()
    });
    console.log('📤 Message published:', result);
  } catch (error) {
    console.error('❌ Failed to publish:', error.message);
  }
  
  // Publish multiple messages at once
  try {
    const results = await client.publishBulk([
      { channel: 'my-channel', message: 'Message 1' },
      { channel: 'my-channel', message: 'Message 2' },
      { channel: 'another-channel', message: 'Message 3' }
    ]);
    console.log('📤 Bulk publish results:', results);
  } catch (error) {
    console.error('❌ Bulk publish failed:', error.message);
  }
  
  // Get message history
  try {
    const history = await channel.getHistory({ count: 10 });
    console.log('📜 Message history:', history);
  } catch (error) {
    console.error('❌ Failed to get history:', error.message);
  }
  
  // Clean up after 10 seconds
  setTimeout(async () => {
    await channel.unsubscribe();
    client.disconnect();
    console.log('👋 Example completed');
    process.exit(0);
  }, 10000);
}

// Example: PubNub compatibility
async function pubNubCompatExample() {
  console.log('🔄 PubNub Compatibility Example');
  
  const { PubNubCompat } = OddSockets;
  
  // Initialize with PubNub-style configuration
  const pubnub = new PubNubCompat({
    publishKey: 'your-api-key-here',
    subscribeKey: 'your-api-key-here',
    userId: 'user-456'
  });
  
  // Add listener (PubNub style)
  pubnub.addListener({
    message: (messageEvent) => {
      console.log('📨 PubNub-style message:', messageEvent);
    },
    presence: (presenceEvent) => {
      console.log('👥 Presence event:', presenceEvent);
    },
    status: (statusEvent) => {
      console.log('📊 Status:', statusEvent.category);
    }
  });
  
  // Subscribe to channels
  pubnub.subscribe({
    channels: ['channel-1', 'channel-2'],
    withPresence: true
  });
  
  // Publish a message
  pubnub.publish({
    channel: 'channel-1',
    message: 'Hello from PubNub compatibility layer!'
  }, (response) => {
    if (response.error) {
      console.error('❌ Publish error:', response.error);
    } else {
      console.log('📤 Published with timetoken:', response.timetoken);
    }
  });
  
  // Clean up after 10 seconds
  setTimeout(() => {
    pubnub.disconnect();
    console.log('👋 PubNub compatibility example completed');
    process.exit(0);
  }, 10000);
}

// Run examples
if (require.main === module) {
  const example = process.argv[2] || 'basic';
  
  if (example === 'pubnub') {
    pubNubCompatExample().catch(console.error);
  } else {
    basicExample().catch(console.error);
  }
}

module.exports = {
  basicExample,
  pubNubCompatExample
};
