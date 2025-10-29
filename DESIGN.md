# Block Empire 设计系统

> 灰色背景 + 黑色线条 + 多玩家色彩的策略游戏 UI 设计规范

## 📐 设计理念

### 核心原则
- **双色系统**：主界面使用灰色系统，游戏内使用多彩玩家系统
- **清晰线条**：无纹理，清晰锐利的黑色线条，对眼睛友好
- **圆角设计**：6px 圆角，现代且友好
- **SVG 优先**：所有图标使用 SVG，可缩放且清晰
- **色盲友好**：高对比度 + 图标辅助识别

---

## 🎨 配色系统

### 主色调 - 灰度系统（主界面）

| 用途 | 颜色代码 | CSS 变量 | 说明 |
|------|---------|----------|------|
| 浅背景 | `#FAFAFA` | `--bg-light` | 卡片、输入框背景 |
| 主背景 | `#F0F0F0` | `--bg-main` | 页面主背景 |
| 分割线 | `#E0E0E0` | `--border-subtle` | 细分割线 |
| 边框 | `#D0D0D0` | `--border-main` | 主要边框 |
| 次要元素 | `#8A8A8A` | `--text-secondary` | 次要文字 |
| 深灰 | `#4A4A4A` | `--text-muted` | 禁用状态 |
| 主文字/线条 | `#2A2A2A` | `--text-primary` | 主要文字、线条 |

**渐变背景**：
```css
background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
```

---

### 玩家颜色系统（游戏内，最多 8 个玩家）

| 玩家 | 主色 | 深色边框 | CSS 变量 |
|------|------|----------|----------|
| 玩家 1 | `#E74C3C` | `#C0392B` | `--player-1` / `--player-1-dark` |
| 玩家 2 | `#3498DB` | `#2980B9` | `--player-2` / `--player-2-dark` |
| 玩家 3 | `#2ECC71` | `#27AE60` | `--player-3` / `--player-3-dark` |
| 玩家 4 | `#F39C12` | `#E67E22` | `--player-4` / `--player-4-dark` |
| 玩家 5 | `#9B59B6` | `#8E44AD` | `--player-5` / `--player-5-dark` |
| 玩家 6 | `#1ABC9C` | `#16A085` | `--player-6` / `--player-6-dark` |
| 玩家 7 | `#E91E63` | `#C2185B` | `--player-7` / `--player-7-dark` |
| 玩家 8 | `#FF5722` | `#E64A19` | `--player-8` / `--player-8-dark` |

**特点**：
- 高对比度，色盲友好
- 主色用于填充，深色用于边框
- 配合图标增强识别（♔ 国王、◆ 城市）

---

## 🧩 组件规范

### 按钮

**主要按钮（Primary）**：
```css
background: #3a3a3a;
color: #ffffff;
border: 2px solid #2a2a2a;
border-radius: 6px;
padding: 12px 30px;
```

**次要按钮（Secondary）**：
```css
background: #fafafa;
color: #2a2a2a;
border: 2px solid #4a4a4a;
border-radius: 6px;
padding: 12px 30px;
```

**Hover 效果**：
```css
transform: translateY(-2px);
box-shadow: 0 4px 12px rgba(0,0,0,0.12);
```

---

### 卡片

```css
background: #fafafa;
border: 2px solid #d0d0d0;
border-radius: 8px;
padding: 25px;
box-shadow: 0 2px 8px rgba(0,0,0,0.06);
```

**Hover 效果**：
```css
transform: translateY(-3px);
box-shadow: 0 6px 16px rgba(0,0,0,0.1);
border-color: #b0b0b0;
```

---

### 输入框

```css
background: #ffffff;
border: 2px solid #b0b0b0;
border-radius: 6px;
padding: 10px 15px;
color: #2a2a2a;
```

**Focus 状态**：
```css
border-color: #4a4a4a;
box-shadow: 0 0 0 3px rgba(74, 74, 74, 0.1);
```

---

### 导航栏

```css
background: #ffffff;
border-bottom: 2px solid #d0d0d0;
border-radius: 8px;
padding: 15px 30px;
box-shadow: 0 2px 8px rgba(0,0,0,0.06);
```

---

## 🎮 游戏图标

### 图标清单

| 图标 | 文件路径 | 用途 | Unicode 字符 |
|------|---------|------|-------------|
| 国王 | `client/public/img/king.svg` | 玩家基地 | ♔ |
| 城市 | `client/public/img/city.svg` | 资源点 | ◆ |
| 山脉 | `client/public/img/mountain.svg` | 不可通过 | ▲ |
| 沼泽 | `client/public/img/swamp.svg` | 减速区域 | ≋ |
| 障碍 | `client/public/img/obstacle.svg` | 墙壁 | ◼ |
| Favicon | `client/public/img/favicon.svg` | 网站图标 | - |

### 图标规范
- **格式**：SVG
- **尺寸**：64x64 px
- **线条颜色**：`#2A2A2A`
- **背景**：`linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)`
- **圆角**：4px
- **可缩放**：无损

---

## 📏 间距与尺寸

### 圆角（Border Radius）
- **小元素**：`4px` - 图标、小按钮
- **标准元素**：`6px` - 按钮、输入框
- **大容器**：`8px` - 卡片、导航栏

### 边框宽度
- **细边框**：`1px` - 分割线
- **标准边框**：`2px` - 按钮、卡片、输入框
- **强调边框**：`2.5px` - Logo 外框

### 间距
- **小间距**：`8px` - 元素内部 padding
- **标准间距**：`20px` - 卡片间距
- **大间距**：`40px` - 区块间距

---

## 🖋 字体规范

### 字体族
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Arial', sans-serif;
```

### 字号
- **大标题**：`2.5em` (40px) - 页面主标题
- **中标题**：`1.8em` (28px) - 区块标题
- **小标题**：`1.3em` (20px) - 组件标题
- **正文**：`1em` (16px) - 主要文字
- **小字**：`0.85-0.95em` - 辅助信息

### 字重
- **Light**：`300` - 标题、优雅展示
- **Regular**：`400` - 正文
- **Medium**：`500` - 强调

---

## 🎯 地图单元格样式

### 空地（默认）
```css
background: #fafafa;
border: 1.5px solid #b0b0b0;
border-radius: 2px;
```

### 玩家领地
```css
background: var(--player-N); /* N = 1-8 */
border-color: var(--player-N-dark);
```

### 地形
- **山脉**：`background: #5a5a5a; border-color: #3a3a3a;`
- **沼泽**：`background: #7a7a7a; border-color: #5a5a5a;`

### Hover 效果
```css
transform: scale(1.15);
z-index: 10;
box-shadow: 0 2px 8px rgba(0,0,0,0.2);
```

---

## 📱 响应式断点

```css
/* 手机 */
@media (max-width: 768px) {
  /* 地图网格简化 */
  /* 导航栏垂直排列 */
  /* 按钮全宽 */
}
```

---

## 🔗 相关资源

- **完整设计展示**：`ui-design-system.html` - 可交互的完整设计系统
- **CSS 变量**：`design-tokens.css` - 可直接导入的 CSS 变量
- **Logo**：`logo.svg` - 官方 Logo（圆角柔和版）

---

## 💡 使用示例

### 导入 CSS 变量
```html
<link rel="stylesheet" href="design-tokens.css">
```

### 创建玩家颜色方块
```html
<div style="background: var(--player-1); border: 2px solid var(--player-1-dark);">
  玩家 1 的领地
</div>
```

### 创建按钮
```html
<button class="btn-primary">开始游戏</button>
<button class="btn-secondary">加入房间</button>
```

### 使用图标
```html
<img src="client/public/img/king.svg" width="64" height="64" alt="King">
```

---

## 📋 设计检查清单

开发新功能时，请确保：
- [ ] 使用灰度系统作为主界面配色
- [ ] 玩家相关使用 8 色系统
- [ ] 所有边框使用 2px 宽度
- [ ] 圆角统一为 4/6/8px
- [ ] 文字颜色对比度足够（WCAG AA 标准）
- [ ] 图标使用 SVG 格式
- [ ] Hover 效果有微动效
- [ ] 响应式布局在手机端正常显示

---

**最后更新**：2025-10-29
**设计版本**：v1.0
**Logo 版本**：`logo.svg` (block-empire-logo-clean-5)