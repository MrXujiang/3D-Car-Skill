---
name: 3d-car-config
description: 基于内置 Three.js 模板快速生成可交互、可动画的 3D 汽车配置器单页 HTML（程序化车身 + 物理车漆 + 贴花 + 灯光动画）。当用户要求创建/定制 3D 汽车展示页、3D 车型配置器、赛车/战舰风格 3D 页面、需要品牌化 3D 车辆落地页，或提到「3D 汽车」「3D 配置器」「Three.js 车」「汽车 3D 效果」时使用。Agent 编写一份 JSON 配置并通过 scripts/generate.mjs 注入模板即可产出页面，无需从零编写 3D 代码。
---

# 3D 汽车配置器生成（3d-car-config）

Copyright © JitWord 协同AI团队

产出一个**零构建、自包含的单 HTML 文件**：Three.js 程序化生成的 3D 汽车（车门/尾门可点击开启、轮毂转动、刹车点头、引擎抖动、大灯/警灯/氛围灯动画、6 位置车身贴花、右侧参数控制台），通过 CDN importmap 加载 three@0.160.0，浏览器直接打开即可运行。

## 核心原则

**不要从零手写 3D 代码，也不要直接复制模板改硬编码值。** 页面 = `template.html`（不可变基线）+ `config JSON`（唯一可变层）。你只需要描述需求 → 写配置 → 跑生成脚本。

## 工作流程

```
- [ ] 1. 理解需求：车型风格（竞速/越野/赛博/自定义品牌）、配色、初始状态
- [ ] 2. 取起点配置：node scripts/scaffold.mjs [default|racing|offroad|cyber] > my.config.json
- [ ] 3. 编辑 my.config.json（字段契约见 config.schema.json，勿改模板 HTML）
- [ ] 4. 生成：node scripts/generate.mjs my.config.json 输出.html
- [ ] 5. 校验：node scripts/validate.mjs 输出.html —— 必须通过才算完成
- [ ] 6. （可选）本地起 http 服务预览，确认渲染与交互正常
```

## 配置速查

完整字段与约束见 [config.schema.json](config.schema.json)（含枚举与格式校验）。常用字段：

```json
{
  "meta":     { "title": "页面标题", "copyright": "© JitWord 协同AI团队" },
  "branding": { "titleMain": "Volt", "titleAccent": "RS", "titleSuffix": "竞速版", "hudSubtitle": "TRACK EDITION" },
  "palette":  { "mainColors": [ { "name": "烈焰红", "c": "#c81e2c" } ],
                "accentColors": [], "wheelColors": [], "caliperColors": ["#e0b020"] },
  "initial":  { "paint": "#c81e2c", "finish": "pearl", "tint": "privacy", "decal": "racing",
                "decalPos": "all", "suspension": "low", "engineOn": true, "speed": 72 },
  "scene":    { "background": { "top": "#223344", "mid": "#0c1218", "bottom": "#040506" },
                "fogColor": "#070a0c", "exposure": 1.15 }
}
```

规则：
- 颜色一律 `#RRGGBB`；`palette` 中留空的数组会自动回退到模板内置色板（只覆盖你想改的部分）。
- `initial` 等价于「用户打开页面时代替他把控制台拨到这些值」。
- `meta.copyright` 默认保留 **「© JitWord 协同AI团队」**；除非用户明确要求变更署名，否则不得删除或篡改。

## 校验（必做）

```bash
node scripts/validate.mjs 输出.html
```

覆盖：结构标记、CAR_CONFIG JSON 可解析、枚举/颜色合法性、关键 DOM 依赖、内联 JS 语法（node --check）。失败则改配置重跑，**禁止交付未通过校验的产物**。

## 定制深度分级

| 级别 | 场景 | 做法 |
|------|------|------|
| L1 配置化 | 换品牌/配色/初始姿态/天幕氛围 | 只写 config JSON（本 skill 主路径） |
| L2 模板派生 | 新增内置贴花图案、加一组色板控件 | 复制 template.html 为项目基线，按 [reference.md](reference.md) 的「扩展配方」小改 |
| L3 深度改造 | 改车身轮廓参数、换车型形态、接入 GLTF 实车模型 | 依据 reference.md 的 `BODY` 参数化轮廓与材质库章节操作 |

## 附加资源

- 模板架构、程序化建模原理、扩展配方、故障排查：[reference.md](reference.md)
- 端到端示例（三种典型需求 → 配置 → 命令）：[examples.md](examples.md)
- 现成风格预设配置：[examples/](examples/) 目录
