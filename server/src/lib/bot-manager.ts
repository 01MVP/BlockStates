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
import { BlockStatesBotAI } from './bot-ai';
import { roomPool } from './room-pool';
import { forceStartOK } from './constants';
import { handleGame } from '../server';

export class BotManager {
  private static instance: BotManager;
  private bots: Map<string, BotInstance> = new Map();
  private aiInstances: Map<string, BlockStatesBotAI> = new Map();
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
  async addBot(config: BotConfig): Promise<{ success: boolean; botId?: string; message?: string; needCheckStart?: boolean }> {
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
        room: null, // Don't store room object to avoid circular reference
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
      const ai = new BlockStatesBotAI(bot);
      this.aiInstances.set(botId, ai);

      // Connect bot to room
      const connectedBot = await this.connectBotToRoom(bot, ai);
      if (!connectedBot) {
        this.aiInstances.delete(botId);
        return { success: false, message: 'Failed to connect bot to room' };
      }

      this.bots.set(botId, bot);
      console.log(`Bot ${bot.username} added to room ${config.roomId}`);

      return { success: true, botId, needCheckStart: true };

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
      const room = roomPool[bot.roomId];
      if (room && bot.myPlayerId) {
        const playerIndex = room.players.findIndex(p => p.id === bot.myPlayerId);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
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
  private async connectBotToRoom(bot: BotInstance, ai: BlockStatesBotAI): Promise<boolean> {
    try {
      // Get room from roomPool
      const room = roomPool[bot.roomId];
      if (!room) {
        console.error(`Room ${bot.roomId} not found`);
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
      const usedColors = room.players.map(p => p.color);
      const availableColor = availableColors.find(color => !usedColors.includes(color));

      if (availableColor === undefined) {
        console.error(`No available colors for bot ${bot.username}`);
        return false;
      }

      // Get available team
      const allTeam = Array.from({ length: 12 }, (_, i) => i + 1);
      const occupiedTeam = room.players.map((player) => player.team);
      const availableTeam = allTeam.filter((team) => !occupiedTeam.includes(team));
      const botTeam = availableTeam.length > 0 ? availableTeam[0] : 1;

      // Create a bot player object with all required methods
      const botPlayer = {
        id: bot.myPlayerId,
        socket_id: mockSocket.id,
        username: bot.username,
        color: availableColor,
        team: botTeam,
        isRoomHost: room.players.length === 0,
        forceStart: false, // Bot starts not ready, will send force_start like original bot
        isDead: false,
        operatedTurn: 0,
        land: [],
        king: null,
        patchView: null,
        disconnected: false,
        isBot: true, // Mark as bot player
        // Add all Player class methods
        setSpectate: function() { this.team = 13; }, // MaxTeamNum + 1 = 13
        spectating: function() { return this.team === 13; }, // MaxTeamNum + 1 = 13
        minify: function(withId?: boolean) {
          return withId
            ? { id: this.id, username: this.username, color: this.color }
            : { username: this.username, color: this.color };
        },
        toJSON: function() {
          const { land, king, patchView, isBot, ...json } = this;
          return json;
        },
        reset: function() {
          this.forceStart = false;
          this.isDead = false;
          this.operatedTurn = 0;
          this.land = [];
          this.king = null;
          this.patchView = null;
        },
        setRoomHost: function(value: boolean) {
          this.isRoomHost = value;
        },
        initKing: function(block: any) {
          this.king = block;
          this.winLand(block);
        },
        getNumberOfLand: function() {
          return this.land.length;
        },
        winLand: function(block: any) {
          this.land.push(block);
          block.player = this;
        },
        loseLand: function(block: any) {
          const pos = this.land.indexOf(block);
          if (pos !== -1) {
            this.land.splice(pos, 1);
          }
        },
        getTotalUnit: function() {
          const reducer = (value: number, land: any) => value + land.unit;
          return this.land.reduce(reducer, 0);
        },
        beDominated: function() {
          if (!this.king) {
            throw new Error('King is not initialized');
          }
          this.king.setType(1); // TileType.City
          this.land.forEach((block: any) => {
            if (this.king && this.king.player) {
              this.king.player.winLand(block);
            }
          });
        },
        beNeutralized: function() {
          this.land.forEach((block: any) => {
            block.beNeutralized();
          });
        }
      } as any;

      // Add bot to room
      room.players.push(botPlayer);
      bot.color = availableColor;
      bot.isActive = true;
      bot.lastActiveAt = new Date();

      // Simulate bot sending force_start event (like original bot does)
      // This will trigger the server's force_start logic and checkForcedStart
      setTimeout(() => {
        this.handleBotEvent(bot, ai, 'force_start');
      }, 100); // Small delay to ensure bot is fully joined

      console.log(`Bot ${bot.username} (color: ${availableColor}) joined room ${bot.roomId}`);

      // Notify real players in the room about the new bot
      this.io.to(bot.roomId).emit('update_room', room);
      this.io.to(bot.roomId).emit('room_message', botPlayer.minify(), 'joined the lobby.');

      // Simulate update_room event handling (like original bot)
      // This will trigger force_start and host transfer logic
      setTimeout(() => {
        this.handleUpdateRoomEvent(bot, ai, room);
      }, 200); // Small delay after room update

      return true;

    } catch (error) {
      console.error(`Error connecting bot ${bot.username} to room:`, error);
      return false;
    }
  }

  // Handle update_room event (like original bot)
  private handleUpdateRoomEvent(bot: BotInstance, ai: BlockStatesBotAI, room: Room): void {
    try {
      const botPlayer = room.players.find(p => p.id === bot.myPlayerId);
      if (!botPlayer) return;

      bot.color = botPlayer.color;
      console.log(`Bot ${bot.username} updated color to: ${bot.color} from player ${botPlayer.color}`);

      // Check if bot needs to ready up (like original bot line 85-87)
      if (!botPlayer.forceStart) {
        console.log(`Bot ${bot.username} is not ready, sending force_start`);
        setTimeout(() => {
          this.handleBotEvent(bot, ai, 'force_start');
        }, 100);
      }

      // Check if bot is host and should transfer to human player (like original bot line 88-92)
      if (botPlayer.isRoomHost && !room.gameStarted) {
        console.log(`Bot ${bot.username} is host, looking for human to transfer host to`);
        // Find human player by checking if socket_id doesn't start with "bot-"
        const humanPlayer = room.players.find(p => p.id !== bot.myPlayerId && !p.socket_id.startsWith('bot-'));
        if (humanPlayer) {
          console.log(`Bot ${bot.username} transferring host to ${humanPlayer.username}`);
          this.transferHost(bot, humanPlayer.id);
        }
      }

      // Check if bot is spectating and should stop (like original bot line 93-95)
      if (botPlayer.spectating()) {
        console.log(`Bot ${bot.username} is spectating, stopping spectate`);
        this.handleBotEvent(bot, ai, 'set_spectating', false);
      }

    } catch (error) {
      console.error(`Error handling update_room event for bot ${bot.username}:`, error);
    }
  }

  // Transfer host to another player
  private transferHost(bot: BotInstance, newHostId: string): void {
    const room = roomPool[bot.roomId];
    if (!room) return;

    // Find the bot player
    const botPlayerIndex = room.players.findIndex(p => p.id === bot.myPlayerId);
    if (botPlayerIndex === -1) return;

    // Find the new host
    const newHostIndex = room.players.findIndex(p => p.id === newHostId);
    if (newHostIndex === -1) return;

    // Transfer host
    room.players[botPlayerIndex].isRoomHost = false;
    room.players[newHostIndex].isRoomHost = true;

    console.log(`Bot ${bot.username} transferred host to ${room.players[newHostIndex].username}`);

    // Notify all players
    this.io.to(bot.roomId).emit('update_room', room);
    this.io.to(bot.roomId).emit('room_message',
      room.players[newHostIndex].minify(),
      'became the new room host.'
    );
  }

  // Handle bot events (simulated socket events)
  private handleBotEvent(bot: BotInstance, ai: BlockStatesBotAI, event: string, ...args: any[]): void {
    try {
      switch (event) {
        case 'force_start':
          // Handle bot force_start (toggle ready state)
          const forceStartRoom = roomPool[bot.roomId];
          if (forceStartRoom) {
            const playerIndex = forceStartRoom.players.findIndex(p => p.id === bot.myPlayerId);
            if (playerIndex !== -1 && !forceStartRoom.players[playerIndex].spectating()) {
              // Toggle forceStart state like the original server logic
              if (forceStartRoom.players[playerIndex].forceStart === true) {
                forceStartRoom.players[playerIndex].forceStart = false;
                forceStartRoom.forceStartNum--;
              } else {
                forceStartRoom.players[playerIndex].forceStart = true;
                forceStartRoom.forceStartNum++;
              }

              console.log(`Bot ${bot.username} toggled ready state to: ${forceStartRoom.players[playerIndex].forceStart}`);

              // Notify all players in room
              this.io.to(bot.roomId).emit('update_room', forceStartRoom);

              // Check if game can start (this is the key part that was missing!)
              this.checkForcedStart(forceStartRoom);
            }
          }
          break;

        case 'set_spectating':
          // Handle bot stopping spectate
          const spectateRoom = roomPool[bot.roomId];
          if (spectateRoom) {
            const playerIndex = spectateRoom.players.findIndex(p => p.id === bot.myPlayerId);
            if (playerIndex !== -1) {
              // Set team back to a valid team (not spectating team 13)
              const allTeam = Array.from({ length: 12 }, (_, i) => i + 1);
              const occupiedTeam = spectateRoom.players.map((player) => player.team);
              const availableTeam = allTeam.filter((team) => !occupiedTeam.includes(team));
              const botTeam = availableTeam.length > 0 ? availableTeam[0] : 1;

              spectateRoom.players[playerIndex].team = botTeam;
              console.log(`Bot ${bot.username} stopped spectating, set team to ${botTeam}`);

              // Notify all players in room
              this.io.to(bot.roomId).emit('update_room', spectateRoom);
            }
          }
          break;

        case 'attack':
          // Handle bot attack
          const room = roomPool[bot.roomId];
          if (room && room.gameStarted && room.map && args.length >= 3) {
            const [from, to, isHalf] = args;

            // Validate coordinates
            if (!from || !to || typeof isHalf !== 'boolean') {
              console.error(`Bot ${bot.username} invalid attack parameters`);
              return;
            }

            // Find bot player in room
            const playerIndex = room.players.findIndex(p => p.id === bot.myPlayerId);
            if (playerIndex === -1) {
              console.error(`Bot ${bot.username} not found in room players`);
              return;
            }

            const player = room.players[playerIndex];

            // Validate attack
            if (room.map.commendable(player, from, to) && player.operatedTurn < room.map.turn) {
              // Execute attack
              if (isHalf) {
                room.map.moveHalfMovableUnit(player, from, to);
              } else {
                room.map.moveAllMovableUnit(player, from, to);
              }

              player.operatedTurn = room.map.turn;
              bot.lastActiveAt = new Date();

              // console.log(`Bot ${bot.username} attacked from (${from.x},${from.y}) to (${to.x},${to.y})`);
            } else {
              // console.log(`Bot ${bot.username} invalid attack: not commendable or already operated this turn`);
            }
          }
          break;

        default:
          // Ignore other events
          break;
      }
    } catch (error) {
      console.error(`Error handling bot event ${event}:`, error);
    }
  }

  // Check if game can start (similar to server's checkForcedStart)
  private async checkForcedStart(room: Room): Promise<void> {
    const forceStartNum = forceStartOK[room.players.filter((player) => !player.spectating()).length];

    // Prevent race condition: only start if not already started or starting
    if (!room.gameStarted && !room.gameLoop && room.forceStartNum >= forceStartNum) {
      await handleGame(room, this.io);
    }
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
      botName: 'BlockStatesBot-Default',
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

  // Get AI instance for a bot
  getBotAI(botId: string): BlockStatesBotAI | undefined {
    return this.aiInstances.get(botId);
  }

  // Get AI instance by player ID
  getBotAIByPlayerId(playerId: string): BlockStatesBotAI | undefined {
    const bot = Array.from(this.bots.values()).find(b => b.myPlayerId === playerId);
    if (bot) {
      return this.aiInstances.get(bot.id);
    }
    return undefined;
  }

  // Handle game ended event (trigger bot re-ready logic)
  handleGameEnded(roomId: string): void {
    console.log(`Game ended in room ${roomId}, resetting bot states`);

    const botsInRoom = this.getBotsByRoom(roomId);
    for (const bot of botsInRoom) {
      const ai = this.aiInstances.get(bot.id);
      if (ai) {
        console.log(`Resetting bot ${bot.username} state for new game`);
        ai.reset();

        // Clear bot's game state
        bot.gameMap = null;
        bot.totalViewed = null;
        bot.myGeneral = null;
        bot.enemyGeneral = [];
        bot.initGameInfo = null;
        bot.leaderBoardData = null;
        bot.queue.clear();
        bot.attackColor = -1;
        bot.attackRoute = [];
        bot.myGeneralThreatened = false;
        bot.isActive = true;
        bot.lastActiveAt = new Date();
      }
    }

    // After a delay, trigger update_room logic to make bots ready up again
    setTimeout(() => {
      const room = roomPool[roomId];
      if (room && !room.gameStarted) {
        const botsInRoom = this.getBotsByRoom(roomId);
        for (const bot of botsInRoom) {
          const ai = this.aiInstances.get(bot.id);
          if (ai) {
            console.log(`Triggering re-ready logic for bot ${bot.username}`);
            this.handleUpdateRoomEvent(bot, ai, room);
          }
        }
      }
    }, 1000); // Wait 1 second for game state to fully reset
  }
}