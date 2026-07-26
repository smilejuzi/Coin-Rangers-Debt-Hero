/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 px-6 py-4 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* 品牌 Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-amber-500 to-rose-500 p-2 rounded-xl shadow-lg shadow-amber-500/20">
            <ShieldAlert className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              金幣戰士之負債勇者
            </h1>
            <p className="text-xs text-slate-400 font-mono">Coin Rangers-Debt Hero • v2.0 ARCHITECT</p>
          </div>
        </div>

        {/* 右側資訊：精緻、純粹的離線版指示器 */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>離線標準版 (Offline Edition)</span>
          </div>
        </div>
      </div>
    </header>
  );
}
