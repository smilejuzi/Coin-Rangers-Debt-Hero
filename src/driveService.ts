/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, Auth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// 初始化 Firebase App & Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// 請求 Google Drive 唯讀權限
provider.addScope('https://www.googleapis.com/auth/drive.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('drive_access_token') : null;

export const getFirebaseAuth = (): Auth => {
  return auth;
};

// 監聽 Auth 狀態
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (!cachedAccessToken) {
        cachedAccessToken = localStorage.getItem('drive_access_token');
      }
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // 如果已登入但快取為空，且 localStorage 也沒有，則呼叫失敗處理
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      localStorage.removeItem('drive_access_token');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// 執行 Google 登入
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('無法從 Firebase Auth 取得存取權杖 (Access Token)');
    }

    cachedAccessToken = credential.accessToken;
    localStorage.setItem('drive_access_token', cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('登入失敗:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// 取得當前 Token
export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken && typeof window !== 'undefined') {
    cachedAccessToken = localStorage.getItem('drive_access_token');
  }
  return cachedAccessToken;
};

// 登出
export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  localStorage.removeItem('drive_access_token');
};

// ==========================================
// Google Drive API 串接服務
// ==========================================

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  createdTime?: string;
  size?: string;
}

/**
 * 搜尋 Google Drive 中名為 'debt-hero-game' 的資料夾
 */
export const searchDebtHeroFolder = async (token: string): Promise<DriveFile | null> => {
  try {
    const q = encodeURIComponent("name = 'debt-hero-game' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType)&pageSize=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`搜尋資料夾失敗: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0];
    }
    return null;
  } catch (error) {
    console.error('搜尋資料夾出錯:', error);
    return null;
  }
};

/**
 * 尋找指定資料夾下（或全雲端硬碟）名為 '3.DEMO.html' 的檔案
 */
export const findDemoFile = async (token: string, folderId?: string): Promise<DriveFile[]> => {
  try {
    let queryStr = "name = '3.DEMO.html' and trashed = false";
    if (folderId) {
      queryStr = `'${folderId}' in parents and ` + queryStr;
    }
    const q = encodeURIComponent(queryStr);
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,parents,createdTime,size)`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`尋找檔案失敗: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('尋找檔案出錯:', error);
    return [];
  }
};

/**
 * 列出指定資料夾內的所有 HTML/JSON 檔案
 */
export const listGameFiles = async (token: string, folderId: string): Promise<DriveFile[]> => {
  try {
    const q = encodeURIComponent(`'${folderId}' in parents and (mimeType = 'text/html' or mimeType = 'application/json' or name contains '.html' or name contains '.json') and trashed = false`);
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,parents,createdTime,size)`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`列出檔案失敗: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('列出檔案出錯:', error);
    return [];
  }
};

/**
 * 下載指定檔案的文字內容
 */
export const downloadFileContent = async (token: string, fileId: string): Promise<string> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`下載檔案內容失敗: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error('下載檔案出錯:', error);
    throw error;
  }
};
