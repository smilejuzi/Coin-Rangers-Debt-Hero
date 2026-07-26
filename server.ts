/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { PassThrough } from 'stream';
import { createRequire } from 'module';
import fs from 'fs';
import AdmZip from 'adm-zip';

dotenv.config();

// 遞迴尋找並將檔案加入 ZIP 的輔助函數
function addDirectoryToZip(zip: AdmZip, dirPath: string, relativePath: string = '') {
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const zipPath = relativePath ? `${relativePath}/${item}` : item;
    
    // 排除不必要的系統、暫存或編譯輸出目錄
    if (
      item === 'node_modules' ||
      item === 'dist' ||
      item === '.git' ||
      item === '.github' ||
      item === 'tmp' ||
      item.endsWith('.log')
    ) {
      continue;
    }
    
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      addDirectoryToZip(zip, fullPath, zipPath);
    } else {
      // zip.addLocalFile 的第二個參數是 ZIP 內部的父目錄路徑
      zip.addLocalFile(fullPath, relativePath);
    }
  }
}

// 驗證 API 金鑰是否具備，不影響啟動但要在呼叫時提出警示
const aiApiKey = process.env.GEMINI_API_KEY;

// 延遲初始化（Lazy initialization）以確保無金鑰時不會在模組載入時就當機
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    if (!aiApiKey) {
      throw new Error('未設定 GEMINI_API_KEY 環境變數。請在 Settings > Secrets 面板中設定金鑰。');
    }
    aiClient = new GoogleGenAI({
      apiKey: aiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API 路由: 智慧解析與模組化重構遊戲代碼
  app.post('/api/parse-game', async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: '請提供要解析的代碼內容。' });
      }

      const ai = getAiClient();

      const systemInstruction = `
你是一位遊戲開發架構師，專精於文字冒險、模擬生存遊戲（特別是理財/債務模擬遊戲）。
你的任務是讀取一段 legacy 的 HTML/JS 遊戲代碼（通常是 3.DEMO.html），並抽絲剝繭地分析它的各個組成模組。
請將它重新設計、重構、並模組化拆分成符合以下 JSON 格式的系統：
1. careers: 職業背景（包括起點資金、負債、基本收支、信用分）
2. actions: 日常行動（例如拼命工作、理財、休息放鬆、人際社交等，包括成本消耗、成功機率、增益或減損效果）
3. events: 隨機事件（例如銀行催收、突發開銷、幸運事件，包含多選抉擇方案、其引發的狀態變化、以及結果敘事文字）

請確保輸出的 JSON 完全符合此 JSON Schema 規格：
{
  "careers": [
    {
      "name": "字串",
      "desc": "字串描述",
      "startCash": 數字,
      "startDebt": 數字,
      "creditScore": 數字(300-850),
      "baseIncome": 數字,
      "baseExpenses": 數字
    }
  ],
  "actions": [
    {
      "id": "英數字標記",
      "name": "行動名稱",
      "description": "行動描述",
      "category": "work" | "finance" | "rest" | "social",
      "cost": {
        "cash": 數字(可選),
        "health": 數字(可選),
        "stress": 數字(可選)
      },
      "effects": {
        "cash": 數字(可選),
        "debt": 數字(可選),
        "bankSaving": 數字(可選),
        "health": 數字(可選),
        "stress": 數字(可選),
        "creditScore": 數字(可選),
        "relationships": 數字(可選)
      },
      "successRate": 數字(0-100),
      "failEffects": {  "cash": 數字(可選), "stress": 數字(可選) ... }(可選),
      "successText": "字串(成功後的敘事)",
      "failText": "字串(失敗後的敘事)"
    }
  ],
  "events": [
    {
      "id": "事件ID",
      "title": "事件名稱",
      "description": "事件狀況描述",
      "category": "financial" | "health" | "career" | "relationship" | "random",
      "triggerChance": 數字(0-100),
      "choices": [
        {
          "id": "選項ID",
          "text": "選項按鈕文字",
          "effects": {
            "cash": 數字(可選),
            "debt": 數字(可選),
            "health": 數字(可選),
            "stress": 數字(可選),
            "creditScore": 數字(可選),
            "relationships": 數字(可選)
          },
          "consequenceText": "決定後的遭遇或結果描述"
        }
      ]
    }
  ]
}

請直接回傳符合上述結構的純 JSON。如果原代碼中缺乏某些部分，請根據你對「債務英雄生存遊戲」的理解，為其補足生動、平衡、富有教育意涵的職業、行動與事件，使該遊戲變得更好玩、更有教育深度。
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `請解析並重構這段程式碼：\n\n${content}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              careers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    desc: { type: Type.STRING },
                    startCash: { type: Type.NUMBER },
                    startDebt: { type: Type.NUMBER },
                    creditScore: { type: Type.NUMBER },
                    baseIncome: { type: Type.NUMBER },
                    baseExpenses: { type: Type.NUMBER },
                  },
                  required: ['name', 'desc', 'startCash', 'startDebt', 'creditScore', 'baseIncome', 'baseExpenses'],
                },
              },
              actions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: { type: Type.STRING },
                    cost: {
                      type: Type.OBJECT,
                      properties: {
                        cash: { type: Type.NUMBER },
                        health: { type: Type.NUMBER },
                        stress: { type: Type.NUMBER },
                      },
                    },
                    effects: {
                      type: Type.OBJECT,
                      properties: {
                        cash: { type: Type.NUMBER },
                        debt: { type: Type.NUMBER },
                        bankSaving: { type: Type.NUMBER },
                        health: { type: Type.NUMBER },
                        stress: { type: Type.NUMBER },
                        creditScore: { type: Type.NUMBER },
                        relationships: { type: Type.NUMBER },
                      },
                    },
                    successRate: { type: Type.NUMBER },
                    failEffects: {
                      type: Type.OBJECT,
                      properties: {
                        cash: { type: Type.NUMBER },
                        stress: { type: Type.NUMBER },
                      },
                    },
                    successText: { type: Type.STRING },
                    failText: { type: Type.STRING },
                  },
                  required: ['id', 'name', 'description', 'category', 'effects', 'successRate', 'successText', 'failText'],
                },
              },
              events: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: { type: Type.STRING },
                    triggerChance: { type: Type.NUMBER },
                    choices: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          text: { type: Type.STRING },
                          effects: {
                            type: Type.OBJECT,
                            properties: {
                              cash: { type: Type.NUMBER },
                              debt: { type: Type.NUMBER },
                              health: { type: Type.NUMBER },
                              stress: { type: Type.NUMBER },
                              creditScore: { type: Type.NUMBER },
                              relationships: { type: Type.NUMBER },
                            },
                          },
                          consequenceText: { type: Type.STRING },
                        },
                        required: ['id', 'text', 'effects', 'consequenceText'],
                      },
                    },
                  },
                  required: ['id', 'title', 'description', 'category', 'triggerChance', 'choices'],
                },
              },
            },
            required: ['careers', 'actions', 'events'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        return res.status(500).json({ error: 'Gemini 未回傳有效的解析結果。' });
      }

      const parsedConfig = JSON.parse(responseText);
      res.json({ config: parsedConfig });
    } catch (error: any) {
      console.error('API 解析出錯:', error);
      res.status(500).json({ error: error.message || '內部伺服器錯誤' });
    }
  });

  // 專案備份下載 API (Dynamic Project Zip Backup)
  app.get('/api/download-backup', (req, res) => {
    try {
      const zip = new AdmZip();
      addDirectoryToZip(zip, process.cwd());
      
      const zipBuffer = zip.toBuffer();

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=project-backup.zip');
      res.send(zipBuffer);
    } catch (error: any) {
      console.error('打包備份出錯:', error);
      if (!res.headersSent) {
        res.status(500).send('無法打包備份專案：' + error.message);
      }
    }
  });

  // 專案備份同步至 Google Drive API (Backup Project directly to Google Drive)
  app.post('/api/sync-to-drive', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未授權：缺少 Google Drive 存取權杖' });
      }
      const token = authHeader.substring(7);

      // 1. 壓縮整個專案
      const zip = new AdmZip();
      addDirectoryToZip(zip, process.cwd());
      const zipBuffer = zip.toBuffer();

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // 2. 尋找 'Google AI Studio' 資料夾 (於根目錄)
      const q1 = encodeURIComponent("name = 'Google AI Studio' and mimeType = 'application/vnd.google-apps.folder' and 'root' in parents and trashed = false");
      const searchParentRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q1}&fields=files(id)&pageSize=1`, { headers });
      if (!searchParentRes.ok) {
        throw new Error(`搜尋 Google AI Studio 資料夾失敗: ${searchParentRes.statusText}`);
      }
      const searchParentData: any = await searchParentRes.json();
      let parentFolderId = '';

      if (searchParentData.files && searchParentData.files.length > 0) {
        parentFolderId = searchParentData.files[0].id;
      } else {
        // 建立 'Google AI Studio' 資料夾
        const createParentRes = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: 'Google AI Studio',
            mimeType: 'application/vnd.google-apps.folder',
            parents: ['root']
          })
        });
        if (!createParentRes.ok) {
          throw new Error(`建立 Google AI Studio 資料夾失敗: ${createParentRes.statusText}`);
        }
        const createParentData: any = await createParentRes.json();
        parentFolderId = createParentData.id;
      }

      // 3. 尋找 'debt-hero-game' 資料夾 (在 'Google AI Studio' 下)
      const q2 = encodeURIComponent(`name = 'debt-hero-game' and mimeType = 'application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed = false`);
      const searchSubRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q2}&fields=files(id)&pageSize=1`, { headers });
      if (!searchSubRes.ok) {
        throw new Error(`搜尋 debt-hero-game 資料夾失敗: ${searchSubRes.statusText}`);
      }
      const searchSubData: any = await searchSubRes.json();
      let subFolderId = '';

      if (searchSubData.files && searchSubData.files.length > 0) {
        subFolderId = searchSubData.files[0].id;
      } else {
        // 建立 'debt-hero-game' 資料夾
        const createSubRes = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: 'debt-hero-game',
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId]
          })
        });
        if (!createSubRes.ok) {
          throw new Error(`建立 debt-hero-game 資料夾失敗: ${createSubRes.statusText}`);
        }
        const createSubData: any = await createSubRes.json();
        subFolderId = createSubData.id;
      }

      // 4. 尋找 'project-backup.zip' 檔案 (在 'debt-hero-game' 下)
      const q3 = encodeURIComponent(`name = 'project-backup.zip' and '${subFolderId}' in parents and trashed = false`);
      const searchZipRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q3}&fields=files(id)&pageSize=1`, { headers });
      if (!searchZipRes.ok) {
        throw new Error(`搜尋備份檔案失敗: ${searchZipRes.statusText}`);
      }
      const searchZipData: any = await searchZipRes.json();
      let zipFileId = '';

      if (searchZipData.files && searchZipData.files.length > 0) {
        zipFileId = searchZipData.files[0].id;
      } else {
        // 建立 project-backup.zip 檔案元數據
        const createZipMetaRes = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: 'project-backup.zip',
            parents: [subFolderId],
            mimeType: 'application/zip'
          })
        });
        if (!createZipMetaRes.ok) {
          throw new Error(`建立備份檔案元數據失敗: ${createZipMetaRes.statusText}`);
        }
        const createZipMetaData: any = await createZipMetaRes.json();
        zipFileId = createZipMetaData.id;
      }

      // 5. 上傳 zip 檔案內容
      const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${zipFileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/zip'
        },
        body: zipBuffer
      });

      if (!uploadRes.ok) {
        throw new Error(`上傳備份檔案內容失敗: ${uploadRes.statusText}`);
      }

      res.json({ success: true, folderId: subFolderId, fileId: zipFileId });
    } catch (error: any) {
      console.error('雲端硬碟同步失敗:', error);
      res.status(500).json({ error: error.message || '備份同步至 Google Drive 失敗' });
    }
  });

  // 靜態檔案與 Vite 中間件處理
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
