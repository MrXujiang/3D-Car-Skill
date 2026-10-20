#!/usr/bin/env node
/**
 * generate.mjs — 将配置 JSON 注入 skill 模板，产出自包含的 3D 汽车配置器页面
 * 用法: node scripts/generate.mjs <config.json> [output.html] [--template <path>]
 * 版权: © JitWord 协同AI团队
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const tIdx = args.indexOf('--template');
const templatePath = tIdx >= 0 ? resolve(args.splice(tIdx, 2)[1]) : resolve(HERE, '..', 'template.html');
const [configPath, outPath = '3d-car.html'] = args;

if (!configPath) {
  console.error('用法: node scripts/generate.mjs <config.json> [output.html] [--template <path>]');
  process.exit(1);
}
if (!existsSync(templatePath)) {
  console.error(`✗ 模板不存在: ${templatePath}`);
  process.exit(1);
}

let config;
try {
  config = JSON.parse(readFileSync(resolve(configPath), 'utf8'));
} catch (e) {
  console.error(`✗ 配置 JSON 解析失败: ${e.message}`);
  process.exit(1);
}

const html = readFileSync(templatePath, 'utf8');

/* 1. 只替换 window.__CAR_CONFIG__ = 与 /* CAR_CONFIG:END *\/ 之间的 JSON 本体，
      保留 BEGIN/END 注释结构（避免破坏注释闭合符导致整页被注释吞掉） */
const cfgRe = /(window\.__CAR_CONFIG__\s*=\s*)([\s\S]*?)(;\s*\/\* CAR_CONFIG:END \*\/)/;
if (!cfgRe.test(html)) {
  console.error('✗ 模板损坏：未找到 CAR_CONFIG 注入区');
  process.exit(1);
}
const json = JSON.stringify(config, null, 2);
let out = html.replace(cfgRe, (m, p1, p2, p3) => p1 + json + p3);

/* 2. 页面标题与语言（安全整段替换；HUD 版权行由运行时按 meta.copyright 驱动，无需改 HTML） */
const meta = config.meta || {};
if (meta.title) {
  out = out.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escape(meta.title)}</title>`);
}
if (meta.lang) {
  out = out.replace(/<html lang="[^"]*">/, () => `<html lang="${escape(meta.lang)}">`);
}

function escape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

writeFileSync(resolve(outPath), out, 'utf8');
console.log(`✓ 已生成 ${outPath}`);
console.log(`  品牌: ${(config.branding || {}).titleMain || 'Jit'} ${(config.branding || {}).titleAccent || ''}  色板: 主体 ${(config.palette?.mainColors || []).length || '默认6'} / 副色 ${(config.palette?.accentColors || []).length || '默认6'} / 轮毂 ${(config.palette?.wheelColors || []).length || '默认4'} / 卡钳 ${(config.palette?.caliperColors || []).length || '默认4'}`);
console.log('  下一步: node scripts/validate.mjs ' + outPath);
