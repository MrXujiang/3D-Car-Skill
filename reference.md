# 模板架构参考（template.html）

Copyright © JitWord 协同AI团队

`template.html` 是 skill 的不可变基线（约 2650 行单文件）。本文说明其分层结构、配置注入机制、程序化建模原理与扩展配方，供 L2/L3 定制时查阅。

## 分层结构

| 层 | 位置（顺序） | 说明 |
|----|--------------|------|
| 样式 | `<style>` | HUD、控制台面板（毛玻璃、可折叠）、色板/分段控件/滑块/开关 |
| DOM | `<body>` | `#hud` 品牌区（含 `#hudCopyright` 版权行）、`#tip` 操作提示、`#panel` 控制台 |
| 配置 | `<script>`（非 module，先于主脚本执行） | `window.__CAR_CONFIG__`，位于 `CAR_CONFIG:BEGIN/END` 锚点之间；generate.mjs 整体替换此段 |
| 依赖 | `<script type="importmap">` | three@0.160.0 + addons，CDN unpkg |
| 主逻辑 | `<script type="module">` | 下述 8 个区段 |

主逻辑区段（以 `/* ==== 区段名 ==== */` 注释分隔）：

1. **渲染器/场景/相机** — WebGLRenderer（ACES tone mapping、PCFSoft 阴影）、FogExp2、OrbitControls（阻尼、限制俯仰、autoRotate）；`hexInt()` 把 CONFIG 的 `#RRGGBB` 转成色值
2. **背景天幕** — 120 半径球 + 三段渐变 ShaderMaterial（top/mid/bottom 由 `scene.background` 驱动）
3. **灯光** — 主光（带阴影相机）+ 蓝色轮廓光 + 补光 + 顶部点光 + 半球光
4. **地面** — 清漆圆形地面 + Canvas 径向渐变伪阴影贴图 + GridHelper（车速>0 时网格流动制造行进感）
5. **材质库 `MAT`** — 物理车漆（clearcoat）、玻璃（transmission）、轮胎、轮毂双色、镀铬、自发光灯组、氛围灯等，`paint/paintBlack` 初值由 `initial.paint/accent` 驱动
6. **几何工具** — `roundedRectShape / extrudeRounded`（圆角挤出体，全车 90% 零件复用）
7. **车辆主体 `car: THREE.Group`** — 见下节
8. **状态与控制 + animate()** — CONFIG 驱动初始化（色板重建、HUD 文案、引擎/贴图/悬架初始态），事件绑定，单一 rAF 循环

## 程序化建模原理

车身不是硬编码 mesh，而是**参数化轮廓挤出**：

```js
const BODY = { uF: 2.16, uR: -2.18, vB: -0.525, vT: 0.525,
               archR: 0.52, axF: 1.42, axR: -1.45, archY: -0.577, y: 1.025 };
```

- `uF/uR` 前后端、`vB/vT` 上下缘、`archR` 轮拱半径、`axF/axR` 前后轮轴位
- `buildBodyShape()` 用 `noseCurve`（三次贝塞尔车头）+ `archPoints()`（轮拱圆弧）拼出侧轮廓 `THREE.Shape`，`ExtrudeGeometry` 沿车宽挤出 → 改 `BODY` 即改整车比例（L3）
- 座舱是第二个梯形挤出体；玻璃 `placeWindowGlass()` 用两点算法向量把 BoxGeometry 贴合斜面
- 门/尾门/轮毂等都是 Group 挂到 `car`，`registerClickable(root, anim)` 注册射线拾取，`doorAnims[]` 存 `{obj, axis, current, target, openAngle}`

**动画范式（重要）**：一切状态过渡都走 `current += (target - current) * min(1, dt*k)` 的指数趋近（色板点击只改 `targetXxx` 颜色变量，animate 里 `lerp`）。新增任何可调参数都遵循此模式，即可获得平滑动画且与控制台/CONFIG 天然兼容。

## 贴花系统

6 个位置平面（`hood/sideL/sideR/roof/trunk/front`），每位置独立材质（共享 `currentDecalTex`），`polygonOffset` 防 z-fighting。内置图案由 Canvas 2D 程序生成（`makeDecalTexture(type)`：mecha 斜切条纹 / racing 双条纹 / digital 像素块），支持用户上传图片、repeat/offset/透明度控制。

## CONFIG 注入机制

```html
<script>
/* CAR_CONFIG:BEGIN */
window.__CAR_CONFIG__ = { ...默认配置... };
/* CAR_CONFIG:END */
</script>
```

主 module 首行读取：`const CONFIG = window.__CAR_CONFIG__ || {}`。**所有消费点都有兜底默认值**，因此 config 缺任何字段页面都能正常运行。色板数组非空时 `innerHTML=''` 重建按钮并重新绑定，空/缺省则沿用 DOM 内置按钮——两种路径都会先解绑旧监听，避免双绑定。

## 扩展配方（L2）

### 新增一种内置贴花图案
在 `makeDecalTexture()` 加分支（Canvas 2D 绘制，返回前统一 `CanvasTexture` + sRGB），再到 DOM `#segDecal` 加 `<button data-v="你的key">`。若想让 `initial.decal` 直接用上它，把 key 同步加入 `decalTextures` 对象。

### 新增一控（滑块）
四步：DOM 加 `ctrl`（input#rngXxx + b#vXxx）→ 顶部目标值（仿 `steer = {target, current}`）→ `$('rngXxx').addEventListener('input')` 写 target → animate() 里趋近并应用。想让 CONFIG 预设它，就再加 `INITIAL.xxx` 读取。

### 换车型（SUV/轿车/跑车比例）
只调 `BODY`：`vT-vB` 车高、`uF-uR` 车长、`archR` 轮拱、`axF/axR` 轴距；同步检查 `BODY_DEPTH`（车宽）与座舱 `CAB_H/CAB_Z`。改完必跑 validate + 预览。

### 接入真实 GLTF 模型（替代程序化车身）
在「车辆主体」区段用 `GLTFLoader` 加载后 `scene.add` 替换 `car`，保留控制台逻辑时注意 `car.scale/rotation.y` 与 `wheelGroups/frontOuters/doorAnims` 的引用需重新建立。

## 版权署名

三处冗余存在，删除任一处其余仍能兜底：
1. `<title>` 下方 HTML 注释 `Copyright © JitWord 协同AI团队`
2. `#hud .copyright`（`#hudCopyright`，运行时受 `meta.copyright` 驱动）
3. SKILL.md / 各脚本头部注释

## 故障排查

| 症状 | 原因 | 修复 |
|------|------|------|
| 打开白屏 | CDN 不可达（unpkg 被墙） | 全局替换 importmap 为 jsdelivr/mirror 源 |
| 色板点击无效/双闪 | DOM 按钮与 CONFIG 重建双绑定 | 检查 template 中 `PALETTE.*` 分支是否被改动 |
| 贴图不显示 | `initial.decal` 枚举外 / `decalPos` 不匹配 | validate.mjs 会拦截，按提示改 |
| 车漆颜色不趋近初始值 | module 顶层 TDZ：`INITIAL` 声明须在使用前 | CONFIG 块必须在主脚本之前（锚点未动即可） |
| 生成脚本报"未找到锚点" | 模板 `CAR_CONFIG:BEGIN/END` 注释被改 | 从 skill 恢复原始 template.html |
