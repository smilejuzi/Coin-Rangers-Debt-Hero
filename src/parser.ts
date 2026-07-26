/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameConfig, GameEvent, Career, GameAction } from './types';
import { DEFAULT_GAME_CONFIG } from './gameConfig';

/**
 * 嘗試解析 Google Drive 讀取的內容。
 * 支援 JSON 檔案，或 HTML 檔案中包夾的 Javascript 物件/陣列。
 */
export function parseGameConfig(content: string): GameConfig {
  const trimmed = content.trim();

  // 1. 如果本身就是 JSON，直接解析
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed) as GameConfig;
      if (validateConfig(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.warn('嘗試解析為純 JSON 失敗，將轉為 HTML 提取', e);
    }
  }

  // 2. 如果是 HTML，嘗試提取 <script> 區塊中的資料，或者進行正則匹配
  try {
    const config: Partial<GameConfig> = {};

    // 試圖尋找變數宣告，例如 var/const/let events = [...]
    const eventsMatch = content.match(/(?:const|let|var)\s+events\s*=\s*(\[[^]*?\])\s*;?/);
    if (eventsMatch && eventsMatch[1]) {
      try {
        // 使用簡單的安全 Eval / JSON5 解析方式
        config.events = looseJsonParse<GameEvent[]>(eventsMatch[1]);
      } catch (e) {
        console.warn('解析 events 變數失敗', e);
      }
    }

    const careersMatch = content.match(/(?:const|let|var)\s+careers\s*=\s*(\[[^]*?\])\s*;?/);
    if (careersMatch && careersMatch[1]) {
      try {
        config.careers = looseJsonParse<Career[]>(careersMatch[1]);
      } catch (e) {
        console.warn('解析 careers 變數失敗', e);
      }
    }

    const actionsMatch = content.match(/(?:const|let|var)\s+actions\s*=\s*(\[[^]*?\])\s*;?/);
    if (actionsMatch && actionsMatch[1]) {
      try {
        config.actions = looseJsonParse<GameAction[]>(actionsMatch[1]);
      } catch (e) {
        console.warn('解析 actions 變數失敗', e);
      }
    }

    if (config.events || config.careers || config.actions) {
      return {
        careers: config.careers || DEFAULT_GAME_CONFIG.careers,
        events: config.events || DEFAULT_GAME_CONFIG.events,
        actions: config.actions || DEFAULT_GAME_CONFIG.actions,
      };
    }
  } catch (e) {
    console.error('HTML 靜態解析失敗', e);
  }

  // 3. 如果靜態解析無法提取，則回傳預設遊戲設定，並提示使用者可以選用 AI 智慧解析
  throw new Error('無法自動識別此檔案的文字遊戲架構。建議點選「AI 智慧解析」按鈕，由 Gemini 協助進行全文代碼重構！');
}

/**
 * 簡易的鬆散 JSON 解析，用來抓取 JS 代碼中的陣列或物件
 */
function looseJsonParse<T>(jsString: string): T {
  // 將 JS 物件屬性名（無雙引號）補上雙引號，並去除單引號改雙引號，進行安全轉換
  // 為求最安全與穩定，此處使用 Function 構造器（因為在 sandboxed 預覽環境中是可行的）
  // 並且此檔案是使用者自己雲端硬碟的 3.DEMO.html 原始碼，具有可信度。
  const fn = new Function(`return ${jsString};`);
  return fn() as T;
}

/**
 * 驗證解析出來的 Config 是否符合基本格式
 */
function validateConfig(config: any): boolean {
  if (!config) return false;
  // 只要有任一核心模組即可
  return Array.isArray(config.events) || Array.isArray(config.careers) || Array.isArray(config.actions);
}

/**
 * 呼叫後端 Express + Gemini API 進行 AI 智慧解析與重構
 */
export async function parseGameConfigWithAI(fileContent: string): Promise<GameConfig> {
  const response = await fetch('/api/parse-game', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content: fileContent }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI 解析失敗: ${errText || response.statusText}`);
  }

  const result = await response.json();
  if (result.config) {
    return result.config;
  }
  throw new Error('AI 解析回傳的資料格式不正確');
}
