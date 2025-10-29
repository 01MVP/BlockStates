# Server 性能优化思路

本文档提供对 server 代码中剩余性能问题的优化思路和建议。

---

## 1. O(n²) 算法优化 ⭐⭐⭐⭐

### 问题 1.1: `getTotal()` - 每帧遍历整个地图

**当前代码** (`map.ts:316-328`)：
```typescript
getTotal(player: any): { army: number; land: number } {
  let total = 0, count = 0;
  for (let i = 0; i < this.width; ++i) {
    for (let j = 0; j < this.height; ++j) {
      if (this.map[i][j].player === player) {
        total += this.map[i][j].unit;
        ++count;
      }
    }
  }
  return { army: total, land: count };
}
```

**性能分析**：
- 每个 game tick 调用 8 次（每个玩家一次）
- 100×100 地图 = 80,000 次迭代/tick
- 50 ticks/秒 = 4,000,000 次迭代/秒

**优化方案 A：增量缓存**
```typescript
class GameMap {
  // 添加缓存
  private playerStats: Map<Player, { army: number; land: number; dirty: boolean }> = new Map();

  // 初始化缓存
  initPlayerStats() {
    for (const player of this.players) {
      this.playerStats.set(player, { army: 0, land: 0, dirty: true });
    }
  }

  // 标记为脏
  markPlayerDirty(player: Player) {
    const stats = this.playerStats.get(player);
    if (stats) stats.dirty = true;
  }

  // 优化后的 getTotal
  getTotal(player: any): { army: number; land: number } {
    let stats = this.playerStats.get(player);

    if (!stats) {
      stats = { army: 0, land: 0, dirty: true };
      this.playerStats.set(player, stats);
    }

    if (stats.dirty) {
      // 只在需要时重新计算
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

  // 在每次地块变化时调用
  transferBlock(block: Block, player: any): void {
    const oldPlayer = block.player;
    if (oldPlayer) this.markPlayerDirty(oldPlayer);
    if (player) this.markPlayerDirty(player);

    // 原有逻辑
    this.map[block.x][block.y].player = player;
    // ...
  }
}
```

**预期提升**：
- 减少 90%+ 的计算量（大部分帧没有变化）
- CPU 使用率降低 30-50%

**风险**：
- 需要在所有修改玩家数据的地方标记为脏
- 如果遗漏某个修改点，会导致数据不一致

**更激进的优化方案 B：Player 维护自己的统计**
```typescript
class Player {
  private totalArmy: number = 0;
  private totalLand: number = 0;

  winLand(block: Block) {
    this.land.push(block);
    this.totalLand++;
    this.totalArmy += block.unit;
  }

  loseLand(block: Block) {
    const index = this.land.indexOf(block);
    if (index !== -1) {
      this.land.splice(index, 1);
      this.totalLand--;
      this.totalArmy -= block.unit;
    }
  }

  updateArmyCount(delta: number) {
    this.totalArmy += delta;
  }

  getTotal(): { army: number; land: number } {
    return { army: this.totalArmy, land: this.totalLand };
  }
}
```

**预期提升**：
- O(n²) → O(1)，完全消除遍历
- CPU 使用率降低 50-70%

**风险**：
- 需要大规模重构
- 在每个单位数量变化时更新（`updateUnit`）
- 更容易出现同步问题

---

### 问题 1.2: `updateUnit()` - 每帧遍历所有格子

**当前代码** (`map.ts:360-390`)：
```typescript
updateUnit(): void {
  for (let i = 0; i < this.width; i++) {
    for (let j = 0; j < this.height; j++) {
      switch (this.map[i][j].type) {
        case TileType.Plain:
          if (this.map[i][j].player && this.turn % 50 === 0)
            ++this.map[i][j].unit;
          break;
        case TileType.King:
          if (this.turn % 2 === 0) ++this.map[i][j].unit;
          break;
        // ...
      }
    }
  }
}
```

**优化方案：维护活跃格子列表**
```typescript
class GameMap {
  // 按类型维护活跃格子
  private kingTiles: Block[] = [];
  private cityTiles: Block[] = [];
  private swampTiles: Block[] = [];
  private occupiedPlains: Set<Block> = new Set();

  // 注册格子
  registerTile(block: Block) {
    switch (block.type) {
      case TileType.King:
        this.kingTiles.push(block);
        break;
      case TileType.City:
        this.cityTiles.push(block);
        break;
      case TileType.Swamp:
        this.swampTiles.push(block);
        break;
    }
  }

  // 当玩家占领平原时
  onPlainOccupied(block: Block) {
    if (block.player) {
      this.occupiedPlains.add(block);
    } else {
      this.occupiedPlains.delete(block);
    }
  }

  // 优化后的 updateUnit
  updateUnit(): void {
    // 更新 King（每 2 回合）
    if (this.turn % 2 === 0) {
      for (const block of this.kingTiles) {
        block.unit++;
      }
      for (const block of this.cityTiles) {
        if (block.player) block.unit++;
      }
      for (const block of this.swampTiles) {
        if (block.player) {
          block.unit--;
          if (block.unit === 0) {
            block.player.loseLand(block);
            block.player = null;
            this.occupiedPlains.delete(block);
          }
        }
      }
    }

    // 更新 Plain（每 50 回合）
    if (this.turn % 50 === 0) {
      for (const block of this.occupiedPlains) {
        if (block.player) block.unit++;
      }
    }
  }
}
```

**预期提升**：
- 从 O(width × height) → O(活跃格子数)
- 通常活跃格子 < 30% 总格子
- CPU 降低 50-70%

**实施步骤**：
1. 在 `generate()` 和 `from_custom_map()` 中注册所有格子
2. 在 `transferBlock()` 中更新占领状态
3. 重构 `updateUnit()` 使用新的列表
4. 充分测试确保逻辑一致

---

### 问题 1.3: `getViewPlayer()` - 雾战视野计算

**当前代码** (`map.ts:415-491`)：
```typescript
async getViewPlayer(player: any): Promise<Block[][]> {
  // 1. 创建整个地图的副本
  const viewOfPlayer: Block[][] = Array.from(Array(this.width), () =>
    Array(this.height).fill(null)
  );

  // 2. 初始化所有格子（O(n²)）
  for (let i = 0; i < this.width; i++) {
    for (let j = 0; j < this.height; j++) {
      const origin = this.getBlock(new Point(i, j));
      const block = new Block(...);  // 创建新对象
      viewOfPlayer[i][j] = block;
    }
  }

  // 3. 再次遍历显示可见区域（O(n²)）
  for (let i = 0; i < this.width; i++) {
    for (let j = 0; j < this.height; j++) {
      // 检查是否在视野内...
    }
  }

  return viewOfPlayer;
}
```

**问题**：
- 每个玩家每帧创建 width × height 个 Block 对象
- 8 玩家 × 10000 格子 = 80,000 对象分配/帧
- 大量 GC 压力

**优化方案 A：对象池**
```typescript
class BlockPool {
  private pool: Block[] = [];

  acquire(x: number, y: number, type: TileType, unit: number, player: any): Block {
    let block = this.pool.pop();
    if (!block) {
      block = new Block(x, y, type, unit, player);
    } else {
      // 重用对象
      block.reset(x, y, type, unit, player);
    }
    return block;
  }

  release(blocks: Block[][]) {
    for (const row of blocks) {
      for (const block of row) {
        this.pool.push(block);
      }
    }
  }
}

class GameMap {
  private blockPool = new BlockPool();

  async getViewPlayer(player: any): Promise<Block[][]> {
    const viewOfPlayer: Block[][] = Array.from(Array(this.width), () =>
      Array(this.height).fill(null)
    );

    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        const origin = this.getBlock(new Point(i, j));
        const block = this.blockPool.acquire(
          origin.x, origin.y, origin.type,
          origin.unit, origin.player
        );
        viewOfPlayer[i][j] = block;
      }
    }

    return viewOfPlayer;
  }
}
```

**优化方案 B：只计算可见区域**
```typescript
async getViewPlayer(player: any): Promise<Block[][]> {
  // 使用 null 表示不可见
  const viewOfPlayer: (Block | null)[][] = Array.from(Array(this.width), () =>
    Array(this.height).fill(null)
  );

  // 只处理玩家拥有的格子及其周围
  for (const ownedBlock of player.land) {
    const { x, y } = ownedBlock;

    // 显示该格子及其周围 3×3 区域
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const nx = x + dx;
        const ny = y + dy;

        if (this.withinMap(new Point(nx, ny)) && !viewOfPlayer[nx][ny]) {
          const origin = this.map[nx][ny];
          viewOfPlayer[nx][ny] = new Block(
            origin.x, origin.y, origin.type,
            origin.unit, origin.player, origin.isAlwaysRevealed
          );
        }
      }
    }
  }

  // 填充不可见区域为默认 Block
  for (let i = 0; i < this.width; i++) {
    for (let j = 0; j < this.height; j++) {
      if (!viewOfPlayer[i][j]) {
        viewOfPlayer[i][j] = new Block(i, j, TileType.Fog);
      }
    }
  }

  return viewOfPlayer;
}
```

**预期提升**：
- 方案 A：减少 80% GC 压力
- 方案 B：减少 70% 对象创建（只创建可见区域）
- 组合使用效果更佳

---

## 2. 无限循环风险 ⭐⭐⭐⭐

### 问题 2.1: `assign_random_king()` - 可能死循环

**当前代码** (`map.ts:148-191`)：
```typescript
assign_random_king(): void {
  for (let i = 0; i < this.players.length; ++i) {
    // ...
    let attempts = 0;
    const maxAttempts = 15;
    while (true) {  // ⚠️ 无限循环
      if (attempts >= maxAttempts) {
        throw new Error('Failed to place king after ' + maxAttempts + ' attempts');
      }
      let x = getRandomInt(0, this.width);
      let y = getRandomInt(0, this.height);
      // ...
      if (/* 条件满足 */) {
        break;
      }
      attempts++;
    }
  }
}
```

**问题**：
- `attempts` 检查在循环内部，但循环条件是 `while(true)`
- 如果地图太小或障碍太多，可能找不到合适位置
- 抛出异常后游戏崩溃

**修复方案 A：修改循环条件**
```typescript
assign_random_king(): void {
  for (let i = 0; i < this.players.length; ++i) {
    let pos = null;
    if (this.players[i].king) continue;
    if (this.players[i].spectating()) continue;

    const maxAttempts = 100;  // 增加尝试次数
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
          if (otherKing && calcDistance(otherKing, pos) <= this.minKingDistance) {
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
      console.warn(`Failed to place king for player ${i} after ${maxAttempts} attempts`);
      // 降级策略：放宽距离限制
      this.assignKingWithRelaxedConstraints(this.players[i], i);
    }
  }
}

// 降级策略
private assignKingWithRelaxedConstraints(player: Player, playerIndex: number): void {
  // 尝试找任何空闲的 Plain 格子
  for (let i = 0; i < this.width; i++) {
    for (let j = 0; j < this.height; j++) {
      const block = this.map[i][j];
      if (block.type === TileType.Plain && !block.player) {
        block.initKing(player);
        if (this.revealKing) block.isAlwaysRevealed = true;
        player.initKing(block);
        console.warn(`Placed king for player ${playerIndex} at (${i},${j}) with relaxed constraints`);
        return;
      }
    }
  }
  throw new Error(`Cannot place king for player ${playerIndex} - no available space`);
}
```

**修复方案 B：预先验证地图可行性**
```typescript
// 在 generate() 开始时验证
generate(): void {
  // 验证地图大小足够放置所有玩家
  const requiredPlainTiles = this.players.length * (this.minKingDistance * this.minKingDistance);
  const availableTiles = this.width * this.height - this.mountain - this.city - this.swamp;

  if (availableTiles < requiredPlainTiles * 0.5) {
    throw new Error(
      `Map too small: ${this.width}×${this.height} with ${this.players.length} players. ` +
      `Required ~${requiredPlainTiles} plain tiles, but only ${availableTiles} available.`
    );
  }

  // 继续原有生成逻辑...
}
```

---

### 问题 2.2: 山脉/城市生成 - 潜在死循环

**当前代码** (`map.ts:256-302`)：
```typescript
// Generate the mountain
for (let i = 1; i <= this.mountain; ++i) {
  let generated = false;
  for (let count = 3, x, y; count; --count) {
    while (true) {  // ⚠️ 无限循环
      x = getRandomInt(0, this.width);
      y = getRandomInt(0, this.height);
      if (this.isPlain(this.map[x][y])) break;
    }
    // ...
  }
}
```

**问题**：
- 如果地图几乎没有 Plain 格子，`isPlain()` 永远不会返回 true
- 没有超时机制

**修复方案：添加安全计数器**
```typescript
generate(): void {
  // ... 初始化地图和 king ...

  // Generate the mountain
  for (let i = 1; i <= this.mountain; ++i) {
    let generated = false;

    for (let count = 3; count > 0; --count) {
      // 添加安全计数器
      let x, y;
      let searchAttempts = 0;
      const maxSearchAttempts = this.width * this.height;  // 最多尝试整个地图大小

      while (searchAttempts < maxSearchAttempts) {
        x = getRandomInt(0, this.width);
        y = getRandomInt(0, this.height);
        if (this.isPlain(this.map[x][y])) break;
        searchAttempts++;
      }

      if (searchAttempts >= maxSearchAttempts) {
        console.warn(`Cannot find plain tile for mountain ${i} after ${maxSearchAttempts} attempts`);
        break;  // 跳过这座山
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
      console.log(`Mountain generation stopped at ${i - 1} (requested ${this.mountain})`);
      break;
    }
  }

  // 同样的逻辑应用到 city 和 swamp 生成
}
```

**更好的方案：预先收集可用格子**
```typescript
generate(): void {
  // ... 初始化 ...

  // Generate the mountain
  for (let i = 1; i <= this.mountain; ++i) {
    let generated = false;

    for (let count = 3; count > 0; --count) {
      // 收集所有 Plain 格子
      const plainTiles: Point[] = [];
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          if (this.isPlain(this.map[x][y])) {
            plainTiles.push(new Point(x, y));
          }
        }
      }

      if (plainTiles.length === 0) {
        console.warn(`No plain tiles available for mountain ${i}`);
        break;
      }

      // 随机选择一个
      const randomIndex = getRandomInt(0, plainTiles.length);
      const { x, y } = plainTiles[randomIndex];

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
      break;
    }
  }
}
```

**预期效果**：
- 完全消除无限循环风险
- 在无法放置时优雅降级
- 提供清晰的错误信息

---

## 3. 额外建议

### 3.1: 使用 TypedArray 优化地图存储
```typescript
// 当前：Block[][]
// 优化：使用 Uint8Array 存储静态数据
class GameMap {
  // 分离静态和动态数据
  private tileTypes: Uint8Array;    // width × height
  private tileUnits: Uint16Array;   // width × height
  private tileOwners: Uint8Array;   // width × height (player index)

  // Block 对象仅在需要时创建
  getBlock(point: Point): Block {
    const index = point.x * this.height + point.y;
    return new Block(
      point.x, point.y,
      this.tileTypes[index],
      this.tileUnits[index],
      this.players[this.tileOwners[index]]
    );
  }
}
```

**优势**：
- 内存占用减少 60-80%
- 缓存友好，CPU 效率提升
- 更适合大地图

### 3.2: 实施性能监控
```typescript
class PerformanceMonitor {
  private metrics: Map<string, { count: number; totalTime: number }> = new Map();

  measure<T>(label: string, fn: () => T): T {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      const metric = this.metrics.get(label) || { count: 0, totalTime: 0 };
      metric.count++;
      metric.totalTime += duration;
      this.metrics.set(label, metric);

      // 每 100 次打印一次
      if (metric.count % 100 === 0) {
        console.log(`[Perf] ${label}: avg=${(metric.totalTime / metric.count).toFixed(2)}ms`);
      }
    }
  }
}

// 使用
const perf = new PerformanceMonitor();
perf.measure('getTotal', () => room.map.getTotal(player));
```

---

## 实施优先级

### 高优先级（立即实施）
1. ✅ 修复无限循环（安全性问题）
2. `getTotal()` 缓存优化（性能提升最明显）
3. `updateUnit()` 活跃格子列表

### 中优先级（1-2 周内）
4. `getViewPlayer()` 对象池
5. 性能监控系统

### 低优先级（长期改进）
6. TypedArray 重构（需要大量测试）
7. Player 自维护统计（架构性改动）

---

## 测试建议

每个优化都应该：
1. 编写单元测试验证逻辑正确性
2. 使用压力测试验证性能提升
3. 监控内存使用和 GC 行为
4. 与现有实现对比结果一致性

```bash
# 压力测试示例
npm run test:performance -- --players=8 --mapSize=100x100 --duration=5min
```
