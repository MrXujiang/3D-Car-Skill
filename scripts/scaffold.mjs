#!/usr/bin/env node
/**
 * scaffold.mjs — 输出内置风格预设的配置 JSON，作为生成新页面的起点
 * 用法: node scripts/scaffold.mjs [preset] > my.config.json
 *       preset: default | racing | offroad | cyber   （默认 default）
 * 版权: © JitWord 协同AI团队
 */

const copyright = '© JitWord 协同AI团队';

const base = {
  meta: { pageKey: '', title: '', copyright, lang: 'zh-CN' },
  branding: { titleMain: '', titleAccent: '', titleSuffix: '', hudSubtitle: '' },
  initial: {
    paint: '#c9ced4', accent: '#1a1c1e', wheelRim: '#23272a', wheelBright: '#9aa3a8',
    caliper: '#cc2222', tint: 'dark', engineOn: false, speed: 0, autoRotate: true,
    lightsOn: true, blueOn: true, ambientOn: true, finish: 'standard',
    decal: 'none', decalPos: 'hood', suspension: 'std'
  },
  scene: { background: { top: '#223344', mid: '#0c1218', bottom: '#040506' }, fogColor: '#070a0c' }
};

const presets = {
  default: {
    ...base,
    branding: { titleMain: 'Jit', titleAccent: '400', titleSuffix: '即时战舰', hudSubtitle: 'OFF-ROAD · HYBRID' },
    meta: { ...base.meta, pageKey: 'jit400', title: 'Jit 400 即时战舰 · 3D' }
  },
  racing: {
    ...base,
    branding: { titleMain: 'Volt', titleAccent: 'RS', titleSuffix: '竞速版', hudSubtitle: 'TRACK EDITION · ZERO DRAG' },
    meta: { ...base.meta, pageKey: 'voltrs', title: 'Volt RS 竞速版 · 3D' },
    palette: {
      mainColors: [
        { name: '竞速白', c: '#eef0f2' }, { name: '烈焰红', c: '#c81e2c' },
        { name: '电镀黄', c: '#d8a614' }, { name: '夜煞黑', c: '#141618' }
      ],
      caliperColors: ['#e0b020', '#cc2222', '#2050c0']
    },
    initial: { ...base.initial, paint: '#c81e2c', finish: 'pearl', tint: 'privacy',
      caliper: '#e0b020', decal: 'racing', decalPos: 'all', suspension: 'low', engineOn: true, speed: 72 }
  },
  offroad: {
    ...base,
    branding: { titleMain: 'Terra', titleAccent: 'X', titleSuffix: '越野旗舰', hudSubtitle: 'ALL-TERRAIN · 4WD' },
    meta: { ...base.meta, pageKey: 'terrax', title: 'Terra X 越野旗舰 · 3D' },
    palette: {
      mainColors: [
        { name: '丛林绿', c: '#45523c' }, { name: '沙漠金', c: '#b39a63' },
        { name: '岩石灰', c: '#6a6f66' }, { name: '工程黄', c: '#c8a018' }
      ]
    },
    initial: { ...base.initial, paint: '#45523c', accent: '#2e3a26', finish: 'matte',
      suspension: 'off', decal: 'mecha', decalPos: 'hood', engineOn: true, speed: 28, blueOn: false }
  },
  cyber: {
    ...base,
    branding: { titleMain: 'Neon', titleAccent: '01', titleSuffix: '赛博原型', hudSubtitle: 'PROTOTYPE · LINK READY' },
    meta: { ...base.meta, pageKey: 'neon01', title: 'Neon 01 赛博原型 · 3D' },
    palette: {
      mainColors: [
        { name: '量子银', c: '#c9ced4' }, { name: '哑光黑', c: '#16181c' },
        { name: '电光紫', c: '#4d2a68' }, { name: '钛空灰', c: '#3a3f44' }
      ]
    },
    scene: { ...base.scene, background: { top: '#2a1a4a', mid: '#0c0a1e', bottom: '#040308' }, fogColor: '#0a0818' },
    initial: { ...base.initial, paint: '#16181c', finish: 'matte', tint: 'dark', decal: 'digital',
      decalPos: 'sideR', ambientOn: true, blueOn: true, engineOn: true, speed: 45 }
  }
};

const name = process.argv[2] || 'default';
if (!presets[name]) {
  console.error(`✗ 未知预设 "${name}"，可选: ${Object.keys(presets).join(' | ')}`);
  process.exit(1);
}
console.log(JSON.stringify(presets[name], null, 2));
