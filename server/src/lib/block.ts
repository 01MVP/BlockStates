// import Player from "@/lib/Player";
// 循环引用..
import { TileType, TileProp, Point } from './types';

class Block extends Point {
  constructor(
    public x: number,
    public y: number,
    public type: TileType,
    public unit: number = 0,
    public player: any = null,
    public isAlwaysRevealed: boolean = false,
    public priority: number = 0,
    public unitsCountRevealed: boolean = true
  ) {
    super(x, y);
  }

  // Reset method for object pool reuse
  reset(
    x: number,
    y: number,
    type: TileType,
    unit: number = 0,
    player: any = null,
    isAlwaysRevealed: boolean = false,
    priority: number = 0,
    unitsCountRevealed: boolean = true
  ): void {
    this.x = x;
    this.y = y;
    this.type = type;
    this.unit = unit;
    this.player = player;
    this.isAlwaysRevealed = isAlwaysRevealed;
    this.priority = priority;
    this.unitsCountRevealed = unitsCountRevealed;
  }

  setUnit(unit: number): void {
    this.unit = unit;
  }

  setType(type: TileType): void {
    this.type = type;
  }

  kingBeDominated(): void {
    this.type = TileType.City;
  }

  beDominated(player: any, unit: number): void {
    if (this.player) {
      this.player.loseLand(this);
    }
    this.player = player;
    this.player.winLand(this);
  }

  initKing(player: any): void {
    this.type = TileType.King;
    this.unit = 1;
    this.player = player;
  }

  enterUnit(player: any, unit: number): void {
    if (this.player && this.player.team === player.team) {
      this.unit += unit;
      if (this.type !== TileType.King) this.beDominated(player, unit);
    } else {
      if (this.unit >= unit) {
        this.unit -= unit;
      } else if (this.unit < unit) {
        this.unit = unit - this.unit;
        this.beDominated(player, unit);
      }
    }
  }

  leaveUnit(unit: number): void {
    this.unit -= unit;
  }

  getMovableUnit(): number {
    return Math.max(this.unit - 1, 0);
  }

  getView(): TileProp {
    let unit = this.isAlwaysRevealed || this.unitsCountRevealed ? this.unit : null;

    return [this.type, this.player ? this.player.color : null, unit];
  }

  beNeutralized(): void {
    this.player = null;
  }
}

export default Block;
