import {
  BotInstance,
  Position,
  initGameInfo,
  MapDiffData,
  LeaderBoardTable,
  TileType,
  TileProp,
  Room,
  QuePurpose,
  QueItem,
  BFSQueItem,
  ExBFSQueItem,
  ExPosition,
  VlPosition,
  AttackQueue
} from './types';

export class BlockStatesBotAI {
  private bot: BotInstance;
  private eventQueue: Array<{
    mapDiff: MapDiffData;
    turnsCount: number;
    leaderBoardData: LeaderBoardTable;
  }> = [];
  private isProcessing = false;
  private lastReactionTime = 0;

  private directions = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ];

  constructor(bot: BotInstance) {
    this.bot = bot;
  }

  // Initialize the bot's game state
  onGameStarted(initGameInfo: initGameInfo): void {
    this.bot.initGameInfo = initGameInfo;
    this.initMap(initGameInfo.mapWidth, initGameInfo.mapHeight);

    // Set initial general position from game info
    if (initGameInfo.king && (initGameInfo.king.x !== 0 || initGameInfo.king.y !== 0)) {
      this.bot.myGeneral = { x: initGameInfo.king.x, y: initGameInfo.king.y };
    }
  }

  // Handle game updates
  onGameUpdate(mapDiff: MapDiffData, turnsCount: number, leaderBoardData: LeaderBoardTable): void {
    const startTime = Date.now();

    this.bot.leaderBoardData = leaderBoardData;
    this.bot.lastActiveAt = new Date();

    this.eventQueue.push({ mapDiff, turnsCount, leaderBoardData });
    this.handleGameUpdate();

    // Track reaction time
    this.lastReactionTime = Date.now() - startTime;
  }

  private async handleGameUpdate(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    const currEvent = this.eventQueue.shift();

    if (currEvent) {
      try {
        await this.patchMap(currEvent.mapDiff);
        await this.handleMove(currEvent.turnsCount);
        this.isProcessing = false;
        return this.handleGameUpdate(); // Process next event
      } catch (error: any) {
        console.error(`Error in bot ${this.bot.username} game update:`, error.message);
        this.isProcessing = false;
      }
    } else {
      this.isProcessing = false;
    }
  }

  private initMap(mapWidth: number, mapHeight: number): void {
    this.bot.gameMap = Array.from(Array(mapWidth), () =>
      Array(mapHeight).fill([TileType.Fog, null, null])
    );
    this.bot.totalViewed = Array.from(Array(mapWidth), () =>
      Array(mapHeight).fill(false)
    );
  }

  private async patchMap(mapDiff: MapDiffData): Promise<void> {
    if (!this.bot.gameMap || !this.bot.totalViewed || !this.bot.initGameInfo) return;

    const mapWidth = this.bot.initGameInfo.mapWidth;
    const mapHeight = this.bot.initGameInfo.mapHeight;
    const flattened = this.bot.gameMap.flat();
    const newState = [...this.bot.gameMap];

    for (let i = 0, j = 0; i < mapDiff.length; i++) {
      const tmp = mapDiff[i];
      if (typeof tmp === "number") {
        j += tmp;
      } else {
        flattened[j++] = tmp;
      }
    }

    for (let i = 0; i < mapWidth; ++i) {
      for (let j = 0; j < mapHeight; ++j) {
        newState[i][j] = flattened[i * mapHeight + j];
        if (!this.bot.totalViewed[i][j] && !this.isUnRevealed(newState[i][j]))
          this.bot.totalViewed[i][j] = true;

        if (newState[i][j][0] === TileType.King && newState[i][j][1]) {
          if (newState[i][j][1] === this.bot.color) {
            this.bot.myGeneral = { x: i, y: j };
          } else if (
            this.bot.enemyGeneral.filter((a) => a.color === newState[i][j][1]).length === 0
          ) {
            this.bot.enemyGeneral.push({
              x: i,
              y: j,
              color: newState[i][j][1] as number,
            });
          }
        }
      }
    }

    // Clean up enemy generals that are no longer visible or conquered
    this.bot.enemyGeneral = this.bot.enemyGeneral.filter(
      (g) =>
        newState[g.x][g.y][1] === g.color ||
        newState[g.x][g.y][0] === TileType.Fog
    );

    this.bot.gameMap = [...newState];
  }

  private async handleMove(turnsCount: number): Promise<void> {
    try {
      if (!this.bot.gameMap || !this.bot.initGameInfo || this.bot.color === null || this.bot.color === undefined || !this.bot.myGeneral) {
        return;
      }

      const mapWidth = this.bot.initGameInfo.mapWidth;
      const mapHeight = this.bot.initGameInfo.mapHeight;

      if (await this.handleAttack()) return;

      if (this.bot.enemyGeneral.length > 0 && this.bot.queue) {
        let booked = false;
        for (const a of this.bot.enemyGeneral) {
          this.bot.queue.que = [];
          if (a.color === this.bot.attackColor) {
            booked ||= await this.gatherArmies(
              QuePurpose.AttackGeneral,
              5,
              { x: a.x, y: a.y },
              2 * (mapWidth + mapHeight)
            );
          }
          booked ||= await this.gatherArmies(
            QuePurpose.AttackGeneral,
            100,
            { x: a.x, y: a.y },
            2 * (mapWidth + mapHeight),
            true
          );
        }
        if (booked) {
          return;
        } else {
          await this.handleLandExpand(turnsCount);
          return;
        }
      }

      if (await this.kingInDanger()) return;

      if (
        this.bot.attackColor !== -1 &&
        this.bot.attackRoute.length > 0 &&
        this.bot.queue &&
        this.bot.totalViewed
      ) {
        console.log(`Bot ${this.bot.username} attack mode.`);
        // Continue attack logic...
      }

      if (await this.detectThreat(turnsCount)) return;
      if (await this.determineExpand(turnsCount)) return;

      await this.handleLandExpand(turnsCount);
      return;
    } catch (error) {
      console.error(`Error in bot ${this.bot.username} move handling:`, error);
    }
  }

  private async handleAttack(): Promise<boolean> {
    if (!this.bot.gameMap || !this.bot.initGameInfo || !this.bot.color || !this.bot.myGeneral)
      return false;

    if (this.bot.queue && !this.bot.queue.isEmpty()) {
      while (!this.bot.queue.isEmpty()) {
        const item = this.bot.queue.que[0];
        if (this.bot.gameMap[item.from.x][item.from.y][1] !== this.bot.color) {
          if (item.purpose === QuePurpose.Attack) {
            this.bot.attackColor = -1;
            this.bot.attackRoute = [];
          }
          this.bot.queue.popFront();
          console.log(
            `Bot ${this.bot.username}: (${item.from.x}, ${item.from.y}): expect`,
            this.bot.color,
            "but",
            this.bot.gameMap[item.from.x][item.from.y][1]
          );
        }
        if (
          (item.purpose === QuePurpose.AttackGeneral ||
            item.purpose === QuePurpose.ExpandLand) &&
          this.bot.gameMap[item.target.x][item.target.y][1] === this.bot.color
        ) {
          this.bot.queue.popFront();
          console.log(
            `Bot ${this.bot.username}: (${item.from.x}, ${item.from.y}): already occupied by me`
          );
        } else break;
      }

      const a = this.bot.queue.popFront();
      if (a && this.bot.socket) {
        let half = false;
        if (
          this.bot.myGeneralThreatened &&
          a.from.x === this.bot.myGeneral.x &&
          a.from.y === this.bot.myGeneral.y
        )
          half = true;

        // Emit attack through socket
        this.bot.socket.emit("attack", a.from, a.to, half);

        if (a.purpose !== QuePurpose.Attack) {
          return true;
        }
      }
    }
    return false;
  }

  private async handleLandExpand(turnsCount: number): Promise<boolean> {
    let flag = false;
    if ((turnsCount + 1) % 17 === 0) {
      if ((await this.quickExpand()) > 0) flag = true;
    } else if (turnsCount + 1 > 17) {
      if (await this.expandLand()) flag = true;
    }
    if (!flag && turnsCount + 1 > 17) {
      return (await this.quickExpand()) > 0;
    }
    return false;
  }

  private async quickExpand(): Promise<number> {
    if (
      !this.bot.gameMap ||
      !this.bot.totalViewed ||
      !this.bot.queue ||
      !this.bot.myGeneral ||
      !this.bot.initGameInfo
    )
      return 0;

    const mapWidth = this.bot.initGameInfo.mapWidth;
    const mapHeight = this.bot.initGameInfo.mapHeight;
    const queue = new Array<ExBFSQueItem>();
    const book = new Array<string>();

    queue.push({ step: 0, pos: this.bot.myGeneral, way: [this.bot.myGeneral] });
    let front = 0, end = 0;

    while (front <= end) {
      const a = queue[front++];
      for (const d of this.directions.sort(() => Math.random() - 0.5)) {
        const b: Position = { x: a.pos.x + d[0], y: a.pos.y + d[1] };
        if (
          this.posOutOfRange(b) ||
          this.isUnMoveable(this.bot.gameMap[b.x][b.y], true) ||
          book.includes(JSON.stringify(b))
        )
          continue;
        queue.push({ step: a.step + 1, pos: b, way: [...a.way, b] }), ++end;
        book.push(JSON.stringify(b));
      }
    }

    const maxWay = queue[end].way;
    let prev: Position | null = null;
    for (const next of maxWay) {
      if (prev) {
        this.bot.queue.pushBack({
          from: prev,
          to: next,
          purpose: QuePurpose.ExpandLand,
          priority: 50,
          target: maxWay[maxWay.length - 1],
        });
      }
      prev = next;
    }

    await this.handleAttack();
    return maxWay.length;
  }

  private async expandLand(): Promise<boolean> {
    if (!this.bot.gameMap || !this.bot.initGameInfo) return false;
    const tiles = new Array<Position>();
    const mapWidth = this.bot.initGameInfo.mapWidth;
    const mapHeight = this.bot.initGameInfo.mapHeight;

    for (let i = 0; i < mapWidth; ++i)
      for (let j = 0; j < mapHeight; ++j)
        if (
          this.bot.gameMap[i][j][0] === TileType.Plain &&
          this.bot.gameMap[i][j][1] !== this.bot.color
        )
          tiles.push({ x: i, y: j });

    if (tiles.length === 0) return false;
    tiles.sort(() => Math.random() - 0.5);
    let ok = false;
    for (const tile of tiles)
      if (await this.gatherArmies(QuePurpose.ExpandLand, 10, tile, 1)) ok = true;
    if (ok) return true;
    else return await this.gatherArmies(QuePurpose.ExpandLand, 10, tiles[0], 10);
  }

  private async kingInDanger(): Promise<boolean> {
    if (!this.bot.myGeneral || !this.bot.gameMap || !this.bot.initGameInfo || !this.bot.queue)
      return false;

    const exDirections = [...this.directions, [-1, -1], [-1, 1], [1, -1], [1, 1]];

    for (const d of exDirections) {
      const tile: Position = {
        x: this.bot.myGeneral.x + d[0],
        y: this.bot.myGeneral.y + d[1],
      };
      if (
        !this.posOutOfRange(tile) &&
        this.bot.gameMap[tile.x][tile.y][1] &&
        this.bot.gameMap[tile.x][tile.y][1] !== this.bot.color
      ) {
        console.log(`Bot ${this.bot.username} king is in danger`, this.bot.gameMap[tile.x][tile.y][1]);
        this.bot.myGeneralThreatened = true;
        await this.gatherArmies(QuePurpose.Defend, 999, tile, 10);
        await this.gatherArmies(QuePurpose.Defend, 999, this.bot.myGeneral, 10);
        return true;
      }
    }
    return false;
  }

  private async determineExpand(turnsCount: number): Promise<boolean> {
    if (
      !this.bot.leaderBoardData ||
      !this.bot.initGameInfo ||
      !this.bot.gameMap ||
      !this.bot.myGeneral
    )
      return false;

    let maxArmyCount = 0, myArmyCount = 0;
    for (const a of this.bot.leaderBoardData) {
      if (a[0] === this.bot.color) myArmyCount = a[2];
      if (this.bot.attackColor === a[0] || a[2] > maxArmyCount) maxArmyCount = a[2];
    }

    if (this.bot.attackColor !== -1 && Math.random() > 0.5) {
      await this.handleLandExpand(turnsCount);
    } else if (Math.random() > 0.7) {
      await this.conquerCity();
    }
    return false;
  }

  private async conquerCity(): Promise<boolean> {
    if (!this.bot.initGameInfo || !this.bot.gameMap || !this.bot.myGeneral) return false;
    const mapWidth = this.bot.initGameInfo.mapWidth;
    const mapHeight = this.bot.initGameInfo.mapHeight;
    let bestCity: VlPosition = { x: -1, y: -1, unit: Infinity };

    for (let i = 0; i < mapWidth; i++) {
      for (let j = 0; j < mapHeight; j++) {
        if (
          this.bot.gameMap[i][j][0] === TileType.City &&
          this.bot.gameMap[i][j][1] !== this.bot.color &&
          (this.bot.gameMap[i][j][2] as number) +
            this.calcDist({ x: i, y: j }, this.bot.myGeneral) <
            bestCity.unit
        ) {
          bestCity = { x: i, y: j, unit: this.bot.gameMap[i][j][2] as number };
        }
      }
    }

    if (
      bestCity.x !== -1 &&
      (await this.gatherArmies(QuePurpose.ExpandCity, 1, bestCity as Position, 34))
    ) {
      return true;
    }
    return false;
  }

  private async detectThreat(turnsCount: number): Promise<boolean> {
    if (!this.bot.myGeneral || !this.bot.gameMap || !this.bot.leaderBoardData) return false;

    let queue = new Array<BFSQueItem>(),
      book = new Array<string>();
    queue.push({ pos: this.bot.myGeneral, step: 0 }),
      book.push(JSON.stringify(this.bot.myGeneral));
    let front = 0, end = 0;
    let selected = new Array<{tile: TileProp; pos: Position; val: number}>();

    while (front <= end) {
      const a = queue[front++];
      for (const d of this.directions.sort(() => Math.random() - 0.5)) {
        const b: Position = { x: a.pos.x + d[0], y: a.pos.y + d[1] };
        if (
          book.includes(JSON.stringify(b)) ||
          this.posOutOfRange(b) ||
          this.isUnRevealed(this.bot.gameMap[b.x][b.y]) ||
          this.isUnMoveable(this.bot.gameMap[b.x][b.y], false)
        )
          continue;
        queue.push({ pos: b, step: a.step + 1 });
        book.push(JSON.stringify(b));
        ++end;
        if (
          this.bot.gameMap[b.x][b.y][1] &&
          this.bot.gameMap[b.x][b.y][1] !== this.bot.color
        ) {
          selected.push({
            tile: this.bot.gameMap[b.x][b.y],
            pos: b,
            val:
              (this.bot.gameMap[b.x][b.y][2] as number) - this.calcDist(this.bot.myGeneral, b),
          });
        }
      }
    }

    selected.sort((a, b) => b.val - a.val);

    const threat = selected[0];
    if (threat) {
      const myArmyCount = this.bot.leaderBoardData.filter(
        (x) => x[0] === this.bot.color
      )[0][2];
      const enemyArmyCount = this.bot.leaderBoardData.filter(
        (x) => x[0] === threat.tile[1]
      )[0][2];
      if (enemyArmyCount > myArmyCount * 1.5 && Math.random() > 0.5) {
        await this.handleLandExpand(turnsCount);
        return true;
      }
      await this.gatherArmies(QuePurpose.Defend, threat.val, threat.pos, 25, true);
      this.bot.attackColor = threat.tile[1] as number;
      this.bot.attackRoute.push(threat.pos);
    }

    return selected.length > 0;
  }

  private async gatherArmies(
    purpose: QuePurpose,
    priority: number,
    toPos: Position,
    limit: number,
    attackMode?: boolean
  ): Promise<boolean> {
    if (!this.bot.gameMap || !this.bot.queue || !this.bot.initGameInfo) return false;

    const mapWidth = this.bot.initGameInfo.mapWidth;
    const mapHeight = this.bot.initGameInfo.mapHeight;
    const queue = new Array<BFSQueItem>();
    queue.push({ step: 0, pos: toPos });

    const possibleWay: Array<Array<{val: number; way: Array<Position>; tag: boolean}>> = [];
    for (let i = 0; i < mapWidth; i++) {
      possibleWay[i] = [];
      for (let j = 0; j < mapHeight; j++) {
        possibleWay[i][j] = {
          val: -9999999,
          way: [],
          tag: false,
        };
      }
    }

    if (this.bot.gameMap[toPos.x][toPos.y][1] !== this.bot.color) {
      possibleWay[toPos.x][toPos.y] = {
        val: -(this.bot.gameMap[toPos.x][toPos.y][2] as number),
        way: [toPos],
        tag: false,
      };
    } else {
      possibleWay[toPos.x][toPos.y] = {
        val: this.bot.gameMap[toPos.x][toPos.y][2] as number,
        way: [toPos],
        tag: false,
      };
    }

    let front = 0, end = 0;
    let maxWay = { val: 0, way: [] as Position[] };

    while (front <= end) {
      const a = queue[front++];
      possibleWay[a.pos.x][a.pos.y].tag = true;
      if (a.step >= limit) break;

      for (const d of this.directions.sort(() => Math.random() - 0.5)) {
        const b: Position = { x: a.pos.x + d[0], y: a.pos.y + d[1] };
        if (
          this.posOutOfRange(b) ||
          this.isUnMoveable(this.bot.gameMap[b.x][b.y], false) ||
          possibleWay[b.x][b.y].tag
        )
          continue;

        let newVal = possibleWay[a.pos.x][a.pos.y].val - 1;
        if (this.bot.gameMap[b.x][b.y][1] !== this.bot.color) {
          if (this.bot.gameMap[b.x][b.y][0] === TileType.City) continue;
          newVal -= this.bot.gameMap[b.x][b.y][2] as number;
        } else {
          newVal += this.bot.gameMap[b.x][b.y][2] as number;
        }
        if (possibleWay[b.x][b.y].val >= newVal) continue;

        const newWay = [b, ...possibleWay[a.pos.x][a.pos.y].way];
        queue.push({ step: a.step + 1, pos: b }), ++end;
        possibleWay[b.x][b.y] = {
          val: newVal,
          way: newWay,
          tag: false,
        };
        if (newVal > maxWay.val) maxWay = possibleWay[b.x][b.y];
      }
    }

    if (maxWay.val <= 0) return false;

    // Create attack queue from the best path
    let prev: Position | null = null;
    const way = maxWay.way;
    for (const next of way) {
      if (prev) {
        this.bot.queue.pushBack({
          from: prev,
          to: next,
          purpose,
          priority,
          target: way[way.length - 1],
        });
      }
      prev = next;
    }

    await this.handleAttack();
    return maxWay.way.length > 0;
  }

  // Helper methods
  private isUnRevealed = (tile: TileProp) =>
    tile[0] === TileType.Fog || tile[0] === TileType.Obstacle;

  private isUnMoveable = (tile: TileProp, ignoreCity: boolean) =>
    tile[0] === TileType.Mountain ||
    tile[0] === TileType.Obstacle ||
    (ignoreCity && tile[0] === TileType.City);

  private posOutOfRange = (pos: Position) => {
    if (!this.bot.gameMap || !this.bot.initGameInfo) return true;
    const mapWidth = this.bot.initGameInfo.mapWidth;
    const mapHeight = this.bot.initGameInfo.mapHeight;
    if (pos.x < 0 || pos.x >= mapWidth) return true;
    if (pos.y < 0 || pos.y >= mapHeight) return true;
    return false;
  };

  private calcDist = (a: Position, b: Position) =>
    Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  public getLastReactionTime(): number {
    return this.lastReactionTime;
  }

  public reset(): void {
    this.bot.queue?.clear();
    this.bot.attackColor = -1;
    this.bot.attackRoute = [];
    this.bot.myGeneralThreatened = false;
    this.bot.enemyGeneral = [];
    this.eventQueue = [];
    this.isProcessing = false;
  }
}