#!/usr/bin/env node
/**
 * validate.mjs — 校验生成的 3D 汽车配置器页面（结构 / 配置 JSON / JS 语法 / 版权）
 * 用法: node scripts/validate.mjs <output.html>
 * 退出码: 0 = 通过, 1 = 失败
 * 版权: © JitWord 协同AI团队
 */
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const target = process.argv[2];
if (!target) {
  console.error('用法: node scripts/validate.mjs <output.html>');
  process.exit(1);
}

let html;
try {
  html = readFileSync(resolve(target), 'utf8');
} catch {
  console.error(`✗ 文件不存在: ${target}`);
  process.exit(1);
}

const errors = [];
const warns = [];

/* 1. 结构标记 */
for (const [needle, label] of [
  ['<!DOCTYPE html>', 'DOCTYPE'],
  ['<script type="importmap">', 'three importmap'],
  ['<script type="module">', 'module 主脚本'],
  ['</html>', '文档闭合'],
  ['CAR_CONFIG:BEGIN', '配置锚点 BEGIN'],
  ['CAR_CONFIG:END', '配置锚点 END'],
]) {
  if (!html.includes(needle)) errors.push(`缺少 ${label}`);
}

/* 2. 版权信息 */
if (!/JitWord\s*协同AI团队/.test(html)) warns.push('未检测到「JitWord 协同AI团队」版权信息');

/* 2b. HTML 注释闭合平衡（防未闭合注释吞掉整页） */
{
  const open = (html.match(/<!--/g) || []).length;
  const close = (html.match(/-->/g) || []).length;
  if (open !== close) errors.push(`HTML 注释未闭合：<!-- ${open} 个 vs --> ${close} 个`);
}

/* 3. 配置 JSON 可解析 + 字段合法性 */
let config = null;
/* 确保 CAR_CONFIG:BEGIN 块注释在 window 赋值前已闭合（否则配置会被注释吞掉） */
{
  const bi = html.indexOf('CAR_CONFIG:BEGIN');
  const wi = html.indexOf('window.__CAR_CONFIG__');
  if (bi >= 0 && wi >= 0) {
    const seg = html.slice(bi, wi);
    if (!seg.includes('*/')) errors.push('CAR_CONFIG:BEGIN 块注释未在 window 赋值前闭合（配置会被注释掉）');
  }
}
const cfgMatch = html.match(/window\.__CAR_CONFIG__\s*=\s*([\s\S]*?);\s*\/\* CAR_CONFIG:END \*\//);
if (cfgMatch) {
  try {
    config = JSON.parse(cfgMatch[1]);
  } catch (e) {
    errors.push(`CAR_CONFIG JSON 解析失败: ${e.message}`);
  }
} else {
  errors.push('未能提取 window.__CAR_CONFIG__ 配置块');
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const Enums = {
  tint: ['clear', 'light', 'dark', 'privacy'],
  finish: ['matte', 'standard', 'pearl'],
  decal: ['none', 'mecha', 'racing', 'digital', 'custom'],
  decalPos: ['hood', 'sideL', 'sideR', 'roof', 'trunk', 'front', 'all'],
  suspension: ['low', 'std', 'off']
};
if (config) {
  const init = config.initial || {};
  for (const [k, list] of Object.entries(Enums)) {
    if (init[k] != null && !list.includes(init[k])) errors.push(`initial.${k}="${init[k]}" 非法，可选: ${list.join('/')}`);
  }
  for (const k of ['paint', 'accent', 'wheelRim', 'wheelBright', 'caliper']) {
    if (init[k] != null && !HEX.test(init[k])) errors.push(`initial.${k}="${init[k]}" 应为 #RRGGBB`);
  }
  if (init.speed != null && (init.speed < 0 || init.speed > 100)) errors.push('initial.speed 应在 0~100');
  const pal = config.palette || {};
  (pal.mainColors || []).forEach((c, i) => { if (!HEX.test(c.c)) errors.push(`palette.mainColors[${i}].c "${c.c}" 应为 #RRGGBB`); });
  (pal.accentColors || []).forEach((c, i) => { if (!HEX.test(c.c)) errors.push(`palette.accentColors[${i}].c "${c.c}" 应为 #RRGGBB`); });
  (pal.caliperColors || []).forEach((c, i) => {
    const hex = typeof c === 'string' ? c : c.c;
    if (!HEX.test(hex)) errors.push(`palette.caliperColors[${i}] "${hex}" 应为 #RRGGBB`);
  });
  (pal.wheelColors || []).forEach((c, i) => { if (!HEX.test(c.rim)) errors.push(`palette.wheelColors[${i}].rim "${c.rim}" 应为 #RRGGBB`); });
  const bg = (config.scene || {}).background || {};
  for (const k of ['top', 'mid', 'bottom']) {
    if (bg[k] != null && !HEX.test(bg[k])) errors.push(`scene.background.${k} "${bg[k]}" 应为 #RRGGBB`);
  }
}

/* 4. 关键交互元素 ID 齐全（脚本依赖） */
for (const id of ['panel', 'btnEngine', 'rngSpeed', 'swatchMain', 'swatchAccent', 'swatchWheel', 'swatchCaliper', 'segDecal', 'hudCopyright']) {
  if (!html.includes(`id="${id}"`)) errors.push(`缺少 DOM 元素 #${id}`);
}

/* 5. 内联脚本检查：importmap 按 JSON 校验，其余写临时文件跑 node --check */
{
  const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(([, attrs]) => !attrs.includes('src='))
    .map(([, attrs, code]) => ({ isMap: attrs.includes('importmap'), code }));
  const dir = mkdtempSync(join(tmpdir(), 'car-skill-'));
  scripts.forEach(({ isMap, code }, i) => {
    if (isMap) {
      try { JSON.parse(code); } catch (e) { errors.push(`importmap JSON 解析失败: ${e.message}`); }
      return;
    }
    const f = join(dir, `s${i}.${code.includes('import ') ? 'mjs' : 'js'}`);
    writeFileSync(f, code, 'utf8');
    const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    if (r.status !== 0) errors.push(`内联脚本 #${i + 1} 语法错误:\n${(r.stderr || '').split('\n').slice(0, 4).join('\n')}`);
  });
}

if (errors.length) {
  console.error(`✗ 校验失败（${errors.length} 个问题）: ${target}`);
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
}
warns.forEach(w => console.warn('  ⚠ ' + w));
console.log(`✓ 校验通过: ${target}`);
