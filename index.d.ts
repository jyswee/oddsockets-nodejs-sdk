// Type definitions for oddsockets-nodejs
// OddSockets - A division of Tyga.Cloud Ltd

/// <reference types="node" />

import { EventEmitter } from 'events';

declare namespace OddSockets {
  interface OddSocketsToken {
    token: string;
    expiresAt?: string | number;
    exp?: number;
    baseUrl?: string;
  }

  type OddSocketsTokenProvider = () => Promise<OddSocketsToken | string>;

  interface OddSocketsConfig {
    /** Your OddSockets API key. Omit when authenticating with a tokenProvider instead. */
    apiKey?: string;
    /**
     * Async callback returning a fresh minted realtime token, used INSTEAD of an apiKey
     * by clients that exchange a JWT for a short-lived scoped token via the
     * OddSockets /v1/token front door. Called before every (re)connect and again shortly
     * before the token expires.
     */
    tokenProvider?: OddSocketsTokenProvider;
    /** Refresh a minted token this many milliseconds before it expires. Default 120000. */
    tokenRefreshLeadMs?: number;
    managerUrl?: string;
    userId?: string;
    options?: any;
    autoConnect?: boolean;
  }

  interface WorkerInfo {
    workerId: string;
    workerUrl: string;
  }

  interface UsageStats {
    /** Monthly active users, or null if the server can't compute it yet. */
    mau: number | null;
    /** Daily active users, or null. */
    dau: number | null;
    /** Total messages published, or null. */
    totalMessages: number | null;
    /** Error rate (0-1), or null. */
    errorRate: number | null;
    ownerScope: string;
    detail: Record<string, unknown> | null;
    timestamp: string;
  }

  interface SessionInfo {
    isExisting?: boolean;
    ageMs?: number;
    workerId?: string;
  }

  interface MessageOptions {
    ttl?: number;
    metadata?: Record<string, any>;
  }

  interface SubscriptionOptions {
    maxHistory?: number;
    retainHistory?: boolean;
    enablePresence?: boolean;
  }

  interface HistoryOptions {
    count?: number;
    start?: string;
    end?: string;
  }

  interface BulkMessage {
    channel: string;
    message: any;
    options?: MessageOptions;
  }

  interface BulkResult {
    success: boolean;
    result?: any;
    error?: string;
  }

  interface PresenceData {
    occupancy: number;
    occupants?: Array<{
      userId: string;
      state?: any;
    }>;
  }

  interface MessageData {
    channel: string;
    message: any;
    publisher?: {
      userId: string;
    };
    timestamp: string;
  }

  interface StandingsResult {
    challengeId: string;
    metric?: string;
    standings: Array<{
      identity: string;
      value: number;
      rank: number;
      cohort?: string;
      platform?: string;
    }>;
    yourRank?: number | null;
  }

  interface AchievementState {
    achievements: Array<{
      achievementId: string;
      percentComplete: number;
      status: 'in_progress' | 'unlocked';
      unlockedAt?: string | null;
      name?: string;
      tier?: string;
    }>;
  }

  class Channel extends EventEmitter {
    constructor(name: string, client: OddSockets);

    readonly name: string;

    subscribe(callback: (message: MessageData) => void, options?: SubscriptionOptions): Promise<void>;
    unsubscribe(): Promise<void>;
    publish(message: any, options?: MessageOptions): Promise<any>;
    getHistory(options?: HistoryOptions): Promise<MessageData[]>;
    getPresence(): Promise<PresenceData>;
    updateState(state: any): Promise<void>;

    isSubscribed(): boolean;
    getName(): string;
    getPresenceMap(): Map<string, any>;
    getCachedHistory(): MessageData[];
  }

  class EnhancedFeatures {
    constructor(client: OddSockets);

    // Threads
    threadReply(params: { channel: string; threadId?: string; parentMessageId?: string; message: any; userId: string }): Promise<any>;
    getThread(threadId: string): Promise<any>;
    subscribeThread(threadId: string, userId: string): Promise<any>;
    markThreadRead(threadId: string, userId: string): void;
    followThread(threadId: string, userId: string): void;
    unfollowThread(threadId: string, userId: string): void;

    // Reactions
    addReaction(params: { messageId: string; channel: string; emoji: string; userId: string }): void;
    removeReaction(params: { messageId: string; channel: string; emoji: string; userId: string }): void;
    getReactions(messageId: string): Promise<any>;

    // Read receipts
    markRead(params: { channel: string; messageId: string; userId: string }): void;
    getUnreadCounts(userId: string, channels?: string[]): Promise<any>;
    markAllRead(channel: string, userId: string): void;

    // Channel management
    createChannel(params: any): Promise<any>;
    updateChannel(params: any): void;
    archiveChannel(channelId: string, userId: string): void;
    inviteToChannel(params: any): void;
    removeFromChannel(params: any): void;
    joinChannel(params: any): void;
    leaveChannel(channelId: string, userId: string): void;
    getChannelMembers(channelId: string): Promise<any>;

    // Direct messages
    createDM(params: any): Promise<any>;
    sendDM(params: any): void;
    getDMConversations(userId: string, includeArchived?: boolean): Promise<any>;

    // Notifications
    subscribeNotifications(userId: string): void;
    markNotificationRead(notificationId: string, userId: string): void;
    markAllNotificationsRead(userId: string): void;
    clearNotifications(userId: string): void;
    getNotifications(params: any): Promise<any>;

    // File uploads
    startFileUpload(params: any): Promise<any>;
    uploadProgress(params: any): void;
    uploadComplete(params: any): void;

    // Presence & status
    setStatus(userId: string, status: string): void;
    setCustomStatus(params: any): void;
    clearCustomStatus(userId: string): void;
    setDND(userId: string, until?: number | string): void;
    clearDND(userId: string): void;
    startTyping(userId: string, channel: string): void;
    stopTyping(userId: string, channel: string): void;
    getUserPresence(userIds: string[]): Promise<any>;

    // Message editing
    editMessage(params: any): void;
    deleteMessage(params: any): void;
    pinMessage(params: any): void;
    unpinMessage(params: any): void;
    getPinnedMessages(channel: string): Promise<any>;

    // Search
    searchMessages(params: any): Promise<any>;
    filterMessages(params: any): Promise<any>;
    searchInChannel(params: any): Promise<any>;
    searchByUser(params: any): Promise<any>;

    // Challenges, leaderboards & achievements
    createChallenge(params: any): Promise<any>;
    /** Fire-and-forget; worker echoes challenge_progress and, for ranked challenges, leaderboard_rank_change. */
    reportProgress(params: { challengeId: string; value: number; eventId?: string }): void;
    /** outcome: 'completed' | 'failed' | 'expired' | 'conceded' | 'tied' */
    completeChallenge(params: { challengeId: string; outcome?: 'completed' | 'failed' | 'expired' | 'conceded' | 'tied' }): Promise<any>;
    /** Fire-and-forget. percentComplete <100 broadcasts achievement_progress; >=100 or omitted broadcasts achievement_unlock. */
    unlockAchievement(params: { achievementId: string; percentComplete?: number; [key: string]: any }): void;
    getStandings(params: { challengeId: string; limit?: number; offset?: number }): Promise<StandingsResult>;
    getAchievements(params?: { achievementId?: string }): Promise<AchievementState>;
    sendChallengeInvite(params: { toUserId: string; type?: string; payload?: any; ttl?: number; channel?: string; inviteId?: string }): Promise<any>;
    replyChallengeInvite(params: any): Promise<any>;
    cancelChallengeInvite(params: any): Promise<any>;
    getChallengeInvites(): Promise<any>;
  }

  interface PubNubCompatConfig {
    publishKey: string;
    subscribeKey: string;
    managerUrl: string;
    userId?: string;
    options?: any;
  }

  class PubNubCompat extends EventEmitter {
    constructor(config: PubNubCompatConfig);

    subscribe(params: { channels: string | string[]; withPresence?: boolean; timetoken?: number }): void;
    unsubscribe(params: { channels: string | string[] }): void;
    publish(params: { channel: string; message: any; meta?: any }, callback?: (response: any) => void): Promise<any>;
    history(params: { channel: string; count?: number; start?: number; end?: number }, callback?: (response: any) => void): Promise<any>;
    hereNow(params: { channels: string | string[] }, callback?: (response: any) => void): Promise<any>;
    setState(params: { channels: string | string[]; state: any }, callback?: (response: any) => void): Promise<any>;

    addListener(listener: any): void;
    removeListener(listener: any): void;
    removeAllListeners(): void;

    disconnect(): void;
    reconnect(): void;
    getSubscribedChannels(): string[];
  }
}

declare class OddSockets extends EventEmitter {
  constructor(config: OddSockets.OddSocketsConfig);

  /** Enhanced feature surface (reactions, threads, DMs, notifications, challenges, ...). */
  readonly enhanced: OddSockets.EnhancedFeatures;

  connect(): Promise<void>;
  disconnect(): void;

  channel(channelName: string): OddSockets.Channel;

  getState(): 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  getWorkerInfo(): OddSockets.WorkerInfo | null;
  getClientIdentifier(): string;
  getSessionInfo(): OddSockets.SessionInfo | null;

  /** Resolves once the client is connected, or rejects after timeoutMs. */
  ready(timeoutMs?: number): Promise<void>;

  publishBulk(messages: OddSockets.BulkMessage[]): Promise<OddSockets.BulkResult[]>;

  getUsageStats(): Promise<OddSockets.UsageStats>;

  // Events
  on(event: 'connecting', listener: () => void): this;
  on(event: 'connected', listener: () => void): this;
  on(event: 'disconnected', listener: (reason?: string) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'reconnecting', listener: (data: { attempt: number; maxAttempts: number; delay: number }) => void): this;
  on(event: 'max_reconnect_attempts_reached', listener: () => void): this;
  on(event: 'worker_assigned', listener: (data: { workerId: string; workerUrl: string; session?: OddSockets.SessionInfo; clientIdentifier: string }) => void): this;
  on(event: 'token_refreshed', listener: (data: { expiresAt: number | null }) => void): this;
  on(event: string, listener: (...args: any[]) => void): this;

  static OddSockets: typeof OddSockets;
  static Channel: typeof OddSockets.Channel;
  static PubNubCompat: typeof OddSockets.PubNubCompat;
  static version: string;
  static create(config: OddSockets.OddSocketsConfig): OddSockets;
  static createPubNubCompat(config: any): OddSockets.PubNubCompat;
}

export = OddSockets;
