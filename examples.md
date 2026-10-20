# 端到端示例

三个典型需求 → 配置 → 命令。示例配置见 `examples/` 目录。

## 示例 1：原生品牌页（零定制，最快路径）

用户："给我一个能跑的 3D 汽车配置器页面"

```bash
node scripts/scaffold.mjs default > car.config.json
node scripts/generate.mjs car.config.json 3d-car.html
node scripts/validate.mjs 3d-car.html
```

## 示例 2：电竞战队周边页（改色 + 数码贴花 + 深色氛围）

关键配置片段（完整见 [example-cyber.json](examples/example-cyber.json)）：

```json
{
  "meta":     { "title": "Neon 01 赛博原型 · 3D" },
  "branding": { "titleMain": "Neon", "titleAccent": "01", "titleSuffix": "赛博原型", "hudSubtitle": "PROTOTYPE · LINK READY" },
  "palette":  { "mainColors": [
      { "name": "哑光黑", "c": "#16181c" }, { "name": "电光紫", "c": "#4d2a68" },
      { "name": "量子银", "c": "#c9ced4" }, { "name": "钛空灰", "c": "#3a3f44" } ] },
  "initial":  { "paint": "#16181c", "finish": "matte", "decal": "digital", "decalPos": "sideR", "engineOn": true, "speed": 45 },
  "scene":    { "background": { "top": "#2a1a4a", "mid": "#0c0a1e", "bottom": "#040308" }, "fogColor": "#0a0818" }
}
```

```bash
node scripts/generate.mjs examples/example-cyber.json neon-01.html && node scripts/validate.mjs neon-01.html
```

## 示例 3：交车演示（引擎默认点火、车辆行进中）

用户："打开页面车就是启动状态，跑着竞速拉花"

```json
{ "initial": { "engineOn": true, "speed": 72, "decal": "racing", "decalPos": "all",
               "suspension": "low", "finish": "pearl", "tint": "privacy" } }
```

对应现成预设：`node scripts/scaffold.mjs racing > race.config.json`（或直接用 [examples/example-racing.json](examples/example-racing.json)）。

## 常见需求 → 字段映射

| 用户说 | 动哪个字段 |
|--------|-----------|
| "换成我们品牌的颜色" | `palette.mainColors[0]` + `initial.paint` |
| "标题改成 XX" | `branding.*` + `meta.title` |
| "默认俯视图/自动旋转关掉" | `initial.autoRotate:false`（视角可配合 `scene` 或让用户手动拖动） |
| "夜景氛围" | `scene.background` 调暗 + `scene.exposure` 降到 0.9 |
| "只要红黑双配色就行" | `palette.mainColors` 只留两项（其余数组留空走内置） |
| "加一种涂鸦贴纸风格" | L2：见 reference.md「新增一种内置贴花图案」 |
