import Block from './block';
import { TileProp, TilesProp, MapDiffData } from './types';

class MapDiff {
  data: MapDiffData = [];
  prevMap: TilesProp | null = null;
  curSameCnt: number = 0;
  curDiffArr: TilesProp = [];

  constructor() { }

  addSame(): void {
    ++this.curSameCnt;
  }

  addDiff(block: TileProp): void {
    this.data.push(block);
  }

  endSame(): void {
    if (this.curSameCnt > 0) {
      this.data.push(this.curSameCnt);
      this.curSameCnt = 0;
    }
  }

  // Fast array comparison without JSON.stringify
  private areTilesEqual(a: TileProp, b: TileProp): boolean {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  }

  patch(blockMap: Block[][]): Promise<void> {
    let curMap = blockMap.flat().map((b) => b.getView());
    if (!this.prevMap) {
      this.data = curMap;
    } else {
      this.data = [];
      for (let i = 0; i < curMap.length; ++i) {
        if (this.areTilesEqual(this.prevMap[i], curMap[i])) {
          this.addSame();
        } else {
          this.endSame();
          this.addDiff(curMap[i]);
        }
      }
      this.endSame();
    }
    this.prevMap = curMap;
    return new Promise((resolve) => {resolve()});
  }
}

export default MapDiff;