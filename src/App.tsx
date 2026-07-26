/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Navbar from './components/Navbar';
import GameBoard from './components/GameBoard';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* 導覽列 */}
      <Navbar />

      {/* 主要內容區 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* 核心遊戲畫板 */}
        <GameBoard />
      </main>

      {/* 頁尾 */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-[11px] text-slate-500 font-mono mt-auto">
        <p>© 2026 COIN RANGERS-DEBT HERO. MODULARIZED BY GOOGLE AI STUDIO BUILD.</p>
        <p className="mt-1">SECURE CLIENT-SIDE OFFLINE SIMULATION GAMEPLAY</p>
      </footer>
    </div>
  );
}
