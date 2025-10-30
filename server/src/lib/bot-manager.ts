import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  BotInstance,
  BotConfig,
  BotManagerStats,
  Room,
  AttackQueue,
  initGameInfo,
  MapDiffData,
  LeaderBoardTable
} from './types';
import { GenniaBotAI } from './bot-ai';
import { roomPool } from './room-pool';

export class BotManager {
  private static instance: BotManager;
  private bots: Map<string, BotInstance> = new Map();
  private aiInstances: Map<string, GenniaBotAI> = new Map();
  private maxBots: number = 10;
  private io: Server;
  private memoryThreshold: number = 1024; // MB
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(io: Server) {
    this.io = io;
    this.startCleanupInterval();
  }

  static getInstance(io?: Server): BotManager {
    if (!BotManager.instance) {
      if (!io) {
        throw new Error('Server instance is required for first-time initialization');
      }
      BotManager.instance = new BotManager(io);
    }
    return BotManager.instance;
  }

  // Add a new bot to a room
  async addBot(config: BotConfig): Promise<{ success: boolean; botId?: string; message?: string }> {
    try {
      // Check limits
      if (this.bots.size >= this.maxBots) {
        return { success: false, message: 'Maximum bot limit reached' };
      }

      // Check memory usage
      const memoryUsage = this.getMemoryUsage();
      if (memoryUsage > this.memoryThreshold) {
        return { success: false, message: 'Memory usage too high' };
      }

      // Validate room exists
      const room = roomPool[config.roomId];
      if (!room) {
        return { success: false, message: 'Room does not exist' };
      }

      // Check room capacity
      if (room.players.length >= room.maxPlayers) {
        return { success: false, message: 'Room is full' };
      }

      // Create bot instance
      const botId = uuidv4();
      const bot: BotInstance = {
        id: botId,
        roomId: config.roomId,
        room: room,
        username: config.botName || `Bot_${botId.substring(0, 8)}`,
        myPlayerId: null,
        color: null,
        attackColor: -1,
        attackRoute: [],
        myGeneral: null,
        myGeneralThreatened: false,
        enemyGeneral: [],
        initGameInfo: null,
        gameMap: null,
        totalViewed: null,
        leaderBoardData: null,
        queue: new AttackQueue(),
        socket: null,
        isActive: false,
        createdAt: new Date(),
        lastActiveAt: new Date()
      };

      // Create AI instance
      const ai = new GenniaBotAI(bot);
      this.aiInstances.set(botId, ai);

      // Connect bot to room
      const connectedBot = await this.connectBotToRoom(bot, ai);
      if (!connectedBot) {
        this.aiInstances.delete(botId);
        return { success: false, message: 'Failed to connect bot to room' };
      }

      this.bots.set(botId, bot);
      console.log(`Bot ${bot.username} added to room ${config.roomId}`);

      return { success: true, botId };

    } catch (error: any) {
      console.error('Error adding bot:', error);
      return { success: false, message: error.message };
    }
  }

  // Remove a bot
  async removeBot(botId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const bot = this.bots.get(botId);
      if (!bot) {
        return { success: false, message: 'Bot not found' };
      }

      // Disconnect socket
      if (bot.socket) {
        bot.socket.disconnect();
      }

      // Remove from room
      if (bot.room && bot.myPlayerId) {
        const playerIndex = bot.room.players.findIndex(p => p.id === bot.myPlayerId);
        if (playerIndex !== -1) {
          bot.room.players.splice(playerIndex, 1);
        }
      }

      // Clean up
      this.bots.delete(botId);
      this.aiInstances.delete(botId);

      console.log(`Bot ${bot.username} removed`);
      return { success: true };

    } catch (error: any) {
      console.error('Error removing bot:', error);
      return { success: false, message: error.message };
    }
  }

  // Connect bot to room (simulate bot joining without actual socket connection)
  private async connectBotToRoom(bot: BotInstance, ai: GenniaBotAI): Promise<boolean> {
    try {
      // Simulate bot joining by directly adding to room players
      if (!bot.room) {
        return false;
      }

      // Create a mock socket object for the bot
      const mockSocket = {
        id: `bot-${bot.id}`,
        emit: (event: string, ...args: any[]) => {
          this.handleBotEvent(bot, ai, event, ...args);
        },
        disconnect: () => {
          bot.isActive = false;
          bot.socket = null;
        },
        connected: true
      } as any;

      bot.socket = mockSocket;

      // Simulate player ID assignment
      bot.myPlayerId = `bot-player-${bot.id}`;

      // Find an available color for the bot
      const availableColors = [0, 1, 2, 3, 4, 5, 6, 7];
      const usedColors = bot.room.players.map(p => p.color);
      const availableColor = availableColors.find(color => !usedColors.includes(color));

      if (availableColor === undefined) {
        console.error(`No available colors for bot ${bot.username}`);
        return false;
      }

      // Create a bot player object
      const botPlayer = {
        id: bot.myPlayerId,
        socket_id: mockSocket.id,
        username: bot.username,
        color: availableColor,
        isRoomHost: bot.room.players.length === 0,
        forceStart: true,
        isDead: false,
        operatedTurn: 0,
        land: [],
        king: null,
        patchView: null,
        spectating: false,
        disconnected: false,
        minify: () => ({ username: bot.username, color: availableColor }),
        toJSON: () => ({
          id: bot.myPlayerId,
          socket_id: mockSocket.id,
          username: bot.username,
          color: availableColor,
          isRoomHost: bot.room!.players.length === 0,
          forceStart: true,
          isDead: false,
          spectating: false,
          disconnected: false
        })
      } as any;

      // Add bot to room
      bot.room.players.push(botPlayer);
      bot.color = availableColor;
      bot.isActive = true;
      bot.lastActiveAt = new Date();

      console.log(`Bot ${bot.username} (color: ${availableColor}) joined room ${bot.roomId}`);

      // Notify real players in the room about the new bot
      this.io.to(bot.roomId).emit('update_room', bot.room);

      return true;

    } catch (error) {
      console.error(`Error connecting bot ${bot.username} to room:`, error);
      return false;
    }
  }

  // Handle bot events (simulated socket events)
  private handleBotEvent(bot: BotInstance, ai: GenniaBotAI, event: string, ...args: any[]): void {
    try {
      switch (event) {
        case 'get_room_info':
          // Simulate room info response
          if (bot.socket) {
            bot.socket.emit('update_room', bot.room);
            bot.socket.emit('set_player_id', bot.myPlayerId);
          }
          break;

        case 'force_start':
          // Bot is ready to start
          if (bot.room) {
            bot.room.forceStartNum++;

            // Check if enough players to start
            const readyPlayers = bot.room.players.filter(p => p.forceStart).length;
            const totalPlayers = bot.room.players.filter(p => !p.spectating).length;

            if (readyPlayers >= Math.min(2, totalPlayers) && !bot.room.gameStarted) {
              // Start the game
              this.startGame(bot.room);
            }
          }
          break;

        case 'attack':
          // Handle bot attack
          if (bot.room && bot.room.gameStarted && args.length >= 3) {
            const [from, to, isHalf] = args;
            // Process attack through server game logic
            this.processAttack(bot, from, to, isHalf);
          }
          break;
      }
    } catch (error) {
      console.error(`Error handling bot event ${event}:`, error);
    }
  }

  // Start game with bot participation
  private startGame(room: Room): void {
    // This would integrate with the existing game start logic
    console.log(`Starting game in room ${room.id} with bot participation`);
  }

  // Process bot attack
  private processAttack(bot: BotInstance, from: any, to: any, isHalf: boolean): void {
    // This would integrate with the existing attack processing logic
    console.log(`Bot ${bot.username} attacks from ${from.x},${from.y} to ${to.x},${to.y} (half: ${isHalf})`);
  }

  
  // Get bot statistics
  getStats(): BotManagerStats {
    const activeBots = Array.from(this.bots.values()).filter(bot => bot.isActive).length;
    const memoryUsage = this.getMemoryUsage();
    const systemResources = this.getSystemResources();
    const resourceCheck = this.checkResourceLimits();

    // Calculate average reaction time
    let totalReactionTime = 0;
    let reactionCount = 0;
    for (const ai of this.aiInstances.values()) {
      const reactionTime = ai.getLastReactionTime();
      if (reactionTime > 0) {
        totalReactionTime += reactionTime;
        reactionCount++;
      }
    }

    // Calculate bot distribution by room
    const botsByRoom: { [roomId: string]: number } = {};
    for (const bot of this.bots.values()) {
      botsByRoom[bot.roomId] = (botsByRoom[bot.roomId] || 0) + 1;
    }

    return {
      totalBots: this.bots.size,
      activeBots,
      maxBots: this.maxBots,
      memoryUsage,
      averageReactionTime: reactionCount > 0 ? totalReactionTime / reactionCount : 0,
      // Additional fields (not in original interface, but useful)
      ...{
        systemResources,
        resourceStatus: resourceCheck,
        botsByRoom,
        memoryPerBot: this.bots.size > 0 ? memoryUsage / this.bots.size : 0,
        uptime: systemResources.uptime
      }
    } as any;
  }

  // Get all bots
  getAllBots(): BotInstance[] {
    return Array.from(this.bots.values());
  }

  // Get bots by room
  getBotsByRoom(roomId: string): BotInstance[] {
    return Array.from(this.bots.values()).filter(bot => bot.roomId === roomId);
  }

  // Get detailed memory usage
  private getMemoryUsage(): number {
    const usage = process.memoryUsage();
    return Math.round(usage.heapUsed / 1024 / 1024); // Convert to MB
  }

  // Get detailed system resources
  private getSystemResources(): { memory: NodeJS.MemoryUsage; cpu: NodeJS.CpuUsage; uptime: number } {
    return {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime()
    };
  }

  // Check if system resources are within limits
  private checkResourceLimits(): { withinLimits: boolean; reason?: string } {
    const memoryUsage = this.getMemoryUsage();
    const systemResources = this.getSystemResources();

    // Check memory threshold
    if (memoryUsage > this.memoryThreshold) {
      return {
        withinLimits: false,
        reason: `Memory usage (${memoryUsage}MB) exceeds threshold (${this.memoryThreshold}MB)`
      };
    }

    // Check bot memory efficiency (too much memory per bot) - only if we have many bots
    if (this.bots.size > 5) {
      const memoryPerBot = memoryUsage / this.bots.size;
      if (memoryPerBot > 150) { // 150MB per bot is too much only when we have many bots
        return {
          withinLimits: false,
          reason: `Memory per bot (${memoryPerBot}MB) is too high with ${this.bots.size} bots`
        };
      }
    }

    return { withinLimits: true };
  }

  // Resource-based bot cleanup
  private performResourceBasedCleanup(): void {
    const resourceCheck = this.checkResourceLimits();

    if (!resourceCheck.withinLimits) {
      console.warn('Resource limits exceeded:', resourceCheck.reason);

      // Remove inactive bots first
      const inactiveBots = Array.from(this.bots.values())
        .filter(bot => !bot.isActive)
        .sort((a, b) => a.lastActiveAt.getTime() - b.lastActiveAt.getTime());

      for (const bot of inactiveBots) {
        console.log(`Removing inactive bot due to resource pressure: ${bot.username}`);
        this.removeBot(bot.id);

        // Recheck after each removal
        if (this.checkResourceLimits().withinLimits) {
          break;
        }
      }

      // If still over limits, remove oldest active bots
      if (!this.checkResourceLimits().withinLimits) {
        const activeBots = Array.from(this.bots.values())
          .filter(bot => bot.isActive)
          .sort((a, b) => a.lastActiveAt.getTime() - b.lastActiveAt.getTime());

        for (const bot of activeBots) {
          console.log(`Removing active bot due to resource pressure: ${bot.username}`);
          this.removeBot(bot.id);

          if (this.checkResourceLimits().withinLimits) {
            break;
          }
        }
      }
    }
  }

  // Start default bot in room '1'
  async startDefaultBot(): Promise<void> {
    const config: BotConfig = {
      roomId: '1',
      botName: 'GenniaBot-Default',
      difficulty: 'medium',
      maxReactionTime: 1000
    };

    const result = await this.addBot(config);
    if (result.success) {
      console.log('Default bot started successfully in room 1');
    } else {
      console.error('Failed to start default bot:', result.message);
    }
  }

  // Cleanup inactive bots
  private cleanupInactiveBots(): void {
    const now = Date.now();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [botId, bot] of this.bots.entries()) {
      const timeSinceLastActive = now - bot.lastActiveAt.getTime();

      if (timeSinceLastActive > inactiveThreshold && !bot.isActive) {
        console.log(`Cleaning up inactive bot: ${bot.username}`);
        this.removeBot(botId);
      }
    }
  }

  // Start cleanup interval
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveBots();
      this.performResourceBasedCleanup();
    }, 30000); // Run every 30 seconds for better resource monitoring
  }

  // Shutdown all bots
  async shutdown(): Promise<void> {
    console.log('Shutting down all bots...');

    // Stop cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Remove all bots
    const botIds = Array.from(this.bots.keys());
    for (const botId of botIds) {
      await this.removeBot(botId);
    }

    console.log('All bots have been shut down');
  }

  // Set maximum bot limit
  setMaxBots(maxBots: number): void {
    this.maxBots = Math.min(maxBots, 20); // Hard limit of 20
    console.log(`Maximum bot limit set to: ${this.maxBots}`);
  }

  // Set memory threshold
  setMemoryThreshold(thresholdMB: number): void {
    this.memoryThreshold = thresholdMB;
    console.log(`Memory threshold set to: ${thresholdMB}MB`);
  }
}