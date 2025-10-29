import Block from './block';
import Point from './point';
import Player from './player';
import { TileType, CustomMapData } from './types';

const directions = [
  new Point(-1, -1),
  new Point(0, -1),
  new Point(1, -1),
  new Point(-1, 0),
  new Point(0, 0),
  new Point(1, 0),
  new Point(-1, 1),
  new Point(0, 1),
  new Point(1, 1),
];

function calcDistance(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getRandomInt(min: number, max: number): number {
  const minInt = Math.ceil(min);
  const maxInt = Math.floor(max);
  return Math.floor(Math.random() * (maxInt - minInt)) + minInt;
}

class GameMap {
  map: Block[][];
  turn: number;
  minKingDistance: number;
  // Object pool for Block instances to reduce GC pressure
  private blockPool: Block[] = [];
  // Cache for player statistics to avoid O(n²) calculations
  private playerStatsCache: Map<any, { army: number; land: number; dirty: boolean }> = new Map();
  // Active tiles lists for efficient updateUnit()
  private kingTiles: Block[] = [];
  private cityTiles: Block[] = [];
  private swampTiles: Block[] = [];
  private occupiedPlains: Set<Block> = new Set();

  constructor(
    public id: string,
    public name: string,
    public width: number,
    public height: number,
    public mountain: number,
    public city: number,
    public swamp: number,
    public players: Player[],
    public revealKing: boolean
  ) {
    this.width = width;
    this.height = height;
    if (mountain + city === 0) {
      this.mountain = this.city = 0;
    } else {
      this.mountain = Math.ceil(
        (((this.width * this.height) / 4) * mountain) / (mountain + city)
      );
      this.city = Math.ceil(
        (((this.width * this.height) / 6) * city) / (mountain + city)
      );
      console.log('mountains', this.mountain, 'cities', this.city);
    }
    this.swamp = Math.ceil(
      ((this.width * this.height - this.mountain - this.city) / 3) * swamp
    );
    this.players = players;
    this.map = Array.from(Array(this.width), () =>
      Array(this.height).fill(null)
    );
    this.turn = 0;
    this.revealKing = revealKing;
    this.minKingDistance = Math.ceil(Math.sqrt(this.width * this.height) / this.players.length);
    console.log('Width:', this.width, 'Height:', this.height, "players:", this.players.length);
    console.log('minKingDistance', this.minKingDistance);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      width: this.width,
      height: this.height,
    };
  }

  getFather(conn: number[], curPoint: number): number {
    while (conn[curPoint] !== curPoint) {
      conn[curPoint] = conn[conn[curPoint]];
      curPoint = conn[curPoint];
    }
    return curPoint;
  }

  isObstacle(block: Block): boolean {
    return block.type === TileType.Mountain || block.type === TileType.City;
  }

  isPlain(block: Block): boolean {
    return block.type === TileType.Plain;
  }

  checkConnection(obstacleCount: number) {
    const conn = new Array(this.width * this.height)
      .fill(null)
      .map((_, i) => i);
    const size = new Array(this.width * this.height).fill(1);
    let connected = false;

    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        if (!this.isObstacle(this.map[i][j])) {
          const curPoint = i * this.height + j;
          const neighbors = [
            { x: i - 1, y: j },
            { x: i, y: j - 1 },
          ];
          for (const neighbor of neighbors) {
            const { x, y } = neighbor;
            if (
              this.withinMap(new Point(x, y)) &&
              !this.isObstacle(this.map[x][y])
            ) {
              const lastPoint = x * this.height + y;
              const curFather = this.getFather(conn, curPoint);
              const lastFather = this.getFather(conn, lastPoint);
              if (curFather !== lastFather) {
                if (size[lastFather] > size[curFather]) {
                  conn[curFather] = lastFather;
                  size[lastFather] += size[curFather];
                } else {
                  conn[lastFather] = curFather;
                  size[curFather] += size[lastFather];
                }
              }
            }
          }
        }
        if (
          size[this.getFather(conn, i * this.height + j)] >=
          this.width * this.height - obstacleCount
        ) {
          connected = true;
          break;
        }
      }
      if (connected) {
        break;
      }
    }

    return connected;
  }

  assign_random_king(): void {
    for (let i = 0; i < this.players.length; ++i) {
      let pos = null;
      if (this.players[i].king) continue;
      if (this.players[i].spectating()) continue;

      const maxAttempts = 100;  // Increased from 15 to reduce failure rate
      let placed = false;

      for (let attempts = 0; attempts < maxAttempts; attempts++) {
        let x = getRandomInt(0, this.width);
        let y = getRandomInt(0, this.height);
        pos = new Point(x, y);
        let block = this.getBlock(pos);
        if (block.type !== TileType.King
          && block.type !== TileType.Swamp
          && block.type !== TileType.Mountain
          && block.type !== TileType.City) {
          let flag = true;
          for (let j = 0; j < i; ++j) {
            const otherKing = this.players[j].king;
            if (
              otherKing &&
              calcDistance(
                new Point(otherKing.x, otherKing.y),
                new Point(x, y)
              ) <= this.minKingDistance
            ) {
              flag = false;
              break;
            }
          }
          if (flag) {
            block.initKing(this.players[i]);
            if (this.revealKing) block.isAlwaysRevealed = true;
            this.players[i].initKing(block);
            placed = true;
            break;
          }
        }
      }

      if (!placed) {
        throw new Error(`Failed to place king for player ${i} after ${maxAttempts} attempts. Map may be too small or too crowded.`);
      }
    }
  }

  static from_custom_map(customMapData: CustomMapData, players: Player[], revealKing: boolean): GameMap {
    const { id, name, width, height, mapTilesData } = customMapData;
    let map = new GameMap(id, name, width, height, 0, 0, 0, players, revealKing);

    // Initialize the map's blocks from the custom map data
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        const [tileType, team, unitsCount, isAlwaysRevealed, priority] = mapTilesData[i][j];
        map.map[i][j] = new Block(i, j, tileType, unitsCount, null, isAlwaysRevealed, priority);
      }
    }

    let kings = [];
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        let tileType = mapTilesData[i][j][0]
        if (map.map[i][j].type === TileType.King) {
          kings.push(map.map[i][j])
        }
      }
    }

    // sort by priority, if priority is same, randomly select
    kings.sort((a, b) => {
      if (a.priority === b.priority) {
        return Math.random() - 0.5;
      }
      return a.priority - b.priority
    });

    // Assign kings to players who is not spectating
    for (let i = 0; i < players.length; i++) {
      if (i < kings.length) {
        if (players[i].spectating()) continue;
        kings[i].initKing(players[i]);
        if (map.revealKing) kings[i].isAlwaysRevealed = true;
        players[i].initKing(kings[i]);
      }
    }
    // reset kings that not own by players to plain
    for (let i = 0; i < kings.length; i++) {
      if (!kings[i].player)
        kings[i].setType(TileType.Plain);
    }

    // random assign kings to other players
    if (players.length > kings.length)
      map.assign_random_king();

    // Initialize active tiles and player stats cache
    map.initActiveTiles();
    map.initPlayerStatsCache();

    return map;
  }

  generate(): void {
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        this.map[i][j] = new Block(i, j, TileType.Plain);
      }
    }
    // Generate the king
    this.assign_random_king();

    // Initialize player stats cache after kings are placed
    this.initPlayerStatsCache();

    // console.log('Kings generated successfully');
    // Generate the mountain
    for (let i = 1; i <= this.mountain; ++i) {
      let generated = false;
      for (let count = 3, x, y; count; --count) {
        // Add safety counter to prevent infinite loop
        let searchAttempts = 0;
        const maxSearchAttempts = this.width * this.height;
        while (searchAttempts < maxSearchAttempts) {
          x = getRandomInt(0, this.width);
          y = getRandomInt(0, this.height);
          if (this.isPlain(this.map[x][y])) break;
          searchAttempts++;
        }
        if (searchAttempts >= maxSearchAttempts) {
          console.warn(`Cannot find plain tile for mountain ${i}, stopping mountain generation`);
          break;
        }
        this.map[x][y].type = TileType.Mountain;
        if (this.checkConnection(i)) {
          generated = true;
          break;
        } else {
          this.map[x][y].type = TileType.Plain;
        }
      }
      if (!generated) {
        this.mountain = i - 1;
        // console.log('Mountain Interrupted', i);
        break;
      }
    }
    // console.log('Mountains generated successfully');
    // Generate the city
    for (let i = 1; i <= this.city; ++i) {
      let generated = false;
      for (let count = 3, x, y; count; --count) {
        // Add safety counter to prevent infinite loop
        let searchAttempts = 0;
        const maxSearchAttempts = this.width * this.height;
        while (searchAttempts < maxSearchAttempts) {
          x = getRandomInt(0, this.width);
          y = getRandomInt(0, this.height);
          if (this.isPlain(this.map[x][y])) break;
          searchAttempts++;
        }
        if (searchAttempts >= maxSearchAttempts) {
          console.warn(`Cannot find plain tile for city ${i}, stopping city generation`);
          break;
        }
        this.map[x][y].type = TileType.City;
        if (this.checkConnection(i + this.mountain)) {
          generated = true;
          this.map[x][y].unit = getRandomInt(35, 55);
          break;
        } else {
          this.map[x][y].type = TileType.Plain;
        }
      }
      if (!generated) {
        this.city = i - 1;
        // console.log('City Interrupted', i);
        break;
      }
    }
    // console.log('Cities generated successfully');
    // Generate the swamp.
    for (let i = 1, x, y; i <= this.swamp; ++i) {
      // Add safety counter to prevent infinite loop
      let searchAttempts = 0;
      const maxSearchAttempts = this.width * this.height;
      let found = false;
      while (searchAttempts < maxSearchAttempts) {
        x = getRandomInt(0, this.width);
        y = getRandomInt(0, this.height);
        if (this.isPlain(this.map[x][y])) {
          found = true;
          break;
        }
        searchAttempts++;
      }
      if (!found) {
        console.warn(`Cannot find plain tile for swamp ${i}, stopping at ${i - 1} swamps`);
        this.swamp = i - 1;
        break;
      }
      this.map[x][y].type = TileType.Swamp;
    }
    // console.log('Swamps generated successfully');

    // Initialize active tiles after map generation is complete
    this.initActiveTiles();
  }

  // Register a tile in the active lists for efficient updateUnit()
  private registerActiveTile(block: Block): void {
    switch (block.type) {
      case TileType.King:
        if (!this.kingTiles.includes(block)) {
          this.kingTiles.push(block);
        }
        break;
      case TileType.City:
        if (!this.cityTiles.includes(block)) {
          this.cityTiles.push(block);
        }
        break;
      case TileType.Swamp:
        if (!this.swampTiles.includes(block)) {
          this.swampTiles.push(block);
        }
        break;
      case TileType.Plain:
        if (block.player) {
          this.occupiedPlains.add(block);
        }
        break;
    }
  }

  // Initialize active tiles from the map
  private initActiveTiles(): void {
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        this.registerActiveTile(this.map[i][j]);
      }
    }
  }

  // Initialize player stats cache
  private initPlayerStatsCache(): void {
    for (const player of this.players) {
      this.playerStatsCache.set(player, { army: 0, land: 0, dirty: true });
    }
  }

  // Mark player stats as dirty (needs recalculation)
  private markPlayerStatsDirty(player: any): void {
    if (player) {
      const stats = this.playerStatsCache.get(player);
      if (stats) {
        stats.dirty = true;
      }
    }
  }

  getTotal(player: any): { army: number; land: number } {
    let stats = this.playerStatsCache.get(player);

    // Initialize if not in cache
    if (!stats) {
      stats = { army: 0, land: 0, dirty: true };
      this.playerStatsCache.set(player, stats);
    }

    // Only recalculate if data is dirty
    if (stats.dirty) {
      let total = 0, count = 0;
      for (let i = 0; i < this.width; ++i) {
        for (let j = 0; j < this.height; ++j) {
          if (this.map[i][j].player === player) {
            total += this.map[i][j].unit;
            ++count;
          }
        }
      }
      stats.army = total;
      stats.land = count;
      stats.dirty = false;
    }

    return { army: stats.army, land: stats.land };
  }

  getBlock(point: Point): Block {
    return this.map[point.x][point.y];
  }

  ownBlock(player: any, point: Point): boolean {
    return player === this.getBlock(point).player;
  }

  transferBlock(block: Block, player: any): void {
    const oldPlayer = block.player;
    // Mark both old and new players as dirty
    this.markPlayerStatsDirty(oldPlayer);
    this.markPlayerStatsDirty(player);

    this.map[block.x][block.y].player = player;
    if (block.type !== TileType.King) { // at this time, king have been dominated
      this.map[block.x][block.y].unit = Math.ceil(
        this.map[block.x][block.y].unit / 2
      );
    }

    // Update occupiedPlains set if this is a plain tile
    if (block.type === TileType.Plain) {
      if (player) {
        this.occupiedPlains.add(block);
      } else {
        this.occupiedPlains.delete(block);
      }
    }
  }

  withinMap(point: Point): boolean {
    return (
      0 <= point.x &&
      point.x < this.width &&
      0 <= point.y &&
      point.y < this.height
    );
  }

  updateTurn(): void {
    this.turn++;
  }

  updateUnit(): void {
    // Mark all players as dirty since units are updating
    for (const player of this.players) {
      this.markPlayerStatsDirty(player);
    }

    // Update King tiles (every 2 turns)
    if (this.turn % 2 === 0) {
      for (const block of this.kingTiles) {
        block.unit++;
      }

      // Update City tiles (every 2 turns, only if occupied)
      for (const block of this.cityTiles) {
        if (block.player) {
          block.unit++;
        }
      }

      // Update Swamp tiles (every 2 turns, decrease if occupied)
      for (const block of this.swampTiles) {
        if (block.player) {
          block.unit--;
          if (block.unit === 0) {
            block.player.loseLand(block);
            block.player = null;
            this.occupiedPlains.delete(block);  // Remove from occupied plains
          }
        }
      }
    }

    // Update Plain tiles (every 50 turns, only occupied)
    if (this.turn % 50 === 0) {
      for (const block of this.occupiedPlains) {
        if (block.player) {  // Double check player is still there
          block.unit++;
        }
      }
    }
  }

  commendable(player: any, focus: Point, newFocus: Point): boolean {
    const isOwner = this.ownBlock(player, focus);
    const possibleMove = this.withinMap(focus) && this.withinMap(newFocus);
    const notMountain = this.getBlock(newFocus).type !== TileType.Mountain;
    return isOwner && possibleMove && notMountain;
  }

  moveAllMovableUnit(player: any, focus: Point, newFocus: Point): void {
    const unit = this.getBlock(focus).getMovableUnit();
    this.moveUnit(player, unit, focus, newFocus);
  }

  moveHalfMovableUnit(player: any, focus: Point, newFocus: Point): void {
    const unit = this.getBlock(focus).getMovableUnit();
    const halfUnit = Math.ceil(unit / 2);
    this.moveUnit(player, halfUnit, focus, newFocus);
  }

  moveUnit(player: any, unit: number, focus: Point, newFocus: Point): void {
    this.getBlock(focus).leaveUnit(unit);
    this.getBlock(newFocus).enterUnit(player, unit);
  }

  // Object pool helper: acquire a block from pool or create new one
  private acquireBlock(
    x: number,
    y: number,
    type: TileType,
    unit: number = 0,
    player: any = null,
    isAlwaysRevealed: boolean = false
  ): Block {
    let block = this.blockPool.pop();
    if (block) {
      block.reset(x, y, type, unit, player, isAlwaysRevealed, 0, true);
      return block;
    }
    return new Block(x, y, type, unit, player, isAlwaysRevealed);
  }

  // Object pool helper: release blocks back to pool
  private releaseBlocks(blocks: Block[][]): void {
    for (let i = 0; i < blocks.length; i++) {
      for (let j = 0; j < blocks[i].length; j++) {
        if (blocks[i][j]) {
          this.blockPool.push(blocks[i][j]);
        }
      }
    }
  }

  getViewPlayer(player: any): Promise<Block[][]> {
    // Get the view of the player from the whole map
    const viewOfPlayer: Block[][] = Array.from(Array(this.width), () =>
      Array(this.height).fill(null)
    );

    // init - use object pool to reduce GC pressure
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        const origin = this.getBlock(new Point(i, j));
        const block = this.acquireBlock(
          origin.x,
          origin.y,
          origin.type,
          origin.unit,
          origin.player,
          origin.isAlwaysRevealed,
        );
        block.unitsCountRevealed = false; // default to false
        if (block.isAlwaysRevealed) {
          viewOfPlayer[i][j] = block;
          continue;
        }
        if (block.type === TileType.Mountain || block.type === TileType.City) {
          block.setType(TileType.Obstacle);
          block.setUnit(0);
          viewOfPlayer[i][j] = block;
        } else if (block.type === TileType.Swamp) {
          block.setUnit(0);
          viewOfPlayer[i][j] = block;
        } else {
          block.setType(TileType.Fog);
          block.setUnit(0);
          block.player = null;
          viewOfPlayer[i][j] = block;
        }
      }
    }
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        const point = new Point(i, j);
        const origin = this.getBlock(point);
        if (origin.player && origin.player.team === player.team) {
          const block = this.acquireBlock(
            origin.x,
            origin.y,
            origin.type,
            origin.unit,
            origin.player,
            origin.isAlwaysRevealed,
          );
          block.unitsCountRevealed = true;
          viewOfPlayer[i][j] = block;

          directions.forEach((dir) => {
            const newPoint = point.move(dir);
            if (this.withinMap(newPoint)) {
              const newOrigin = this.getBlock(newPoint);
              const block = this.acquireBlock(
                newOrigin.x,
                newOrigin.y,
                newOrigin.type,
                newOrigin.unit,
                newOrigin.player,
                newOrigin.isAlwaysRevealed,
              );
              block.unitsCountRevealed = true;
              viewOfPlayer[newPoint.x][newPoint.y] = block;
            }
          });
        }
      }
    }
    return new Promise(function (resolve, reject) {
      resolve(viewOfPlayer);
    });
  }
}

export default GameMap;
