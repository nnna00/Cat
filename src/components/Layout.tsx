import React from 'react';
import { LayoutDashboard, ReceiptText, Wallet, BarChart3, MessageSquare, Settings, Target } from 'lucide-react';
import { motion } from 'motion/react';
import AnimatedCat from './AnimatedCat';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const tabs = [
    { id: 'chat', label: 'AI 聊天', icon: MessageSquare },
    { id: 'ledger', label: '明细', icon: ReceiptText },
    { id: 'accounts', label: '账户', icon: Wallet },
    { id: 'goals', label: '目标', icon: Target },
    { id: 'reports', label: '报表', icon: BarChart3 },
    { id: 'settings', label: '设置', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-cat-black">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-cat-dark border-r border-white/5 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 bg-cat-dark border border-cat-accent/20 rounded-2xl flex items-center justify-center overflow-hidden">
            <AnimatedCat size={48} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">KuroNeko</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-cat-accent text-cat-black font-semibold' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-cat-purple flex items-center justify-center text-xs font-bold">
              KN
            </div>
            <div className="text-sm">
              <p className="font-medium">KuroNeko Ledger</p>
              <p className="text-white/40 text-xs">v1.0.0</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 bg-cat-dark border-b border-white/5">
          <div className="flex items-center gap-2">
            <AnimatedCat size={32} />
            <span className="font-bold">KuroNeko</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-cat-purple" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-5xl mx-auto"
          >
            {children}
          </motion.div>
        </div>

        {/* Bottom Nav for Mobile */}
        <nav className="md:hidden flex items-center justify-around p-2 bg-cat-dark border-t border-white/5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                  isActive ? 'text-cat-accent' : 'text-white/40'
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
