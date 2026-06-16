import React, { useState } from 'react';
import { Account } from '../types';
import { Plus, Wallet, Trash2, CreditCard, Banknote, Landmark } from 'lucide-react';

interface AccountListProps {
  accounts: Account[];
  onAdd: (name: string, balance: number, icon: string) => void;
  onDelete: (id: number) => void;
}

const ICONS = ['Wallet', 'CreditCard', 'Banknote', 'Landmark'];

export default function AccountList({ accounts, onAdd, onDelete }: AccountListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [icon, setIcon] = useState('Wallet');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onAdd(name, parseFloat(balance) || 0, icon);
    setName('');
    setBalance('');
    setIsAdding(false);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wallet': return Wallet;
      case 'CreditCard': return CreditCard;
      case 'Banknote': return Banknote;
      case 'Landmark': return Landmark;
      default: return Wallet;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">我的账户</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="cat-btn flex items-center gap-2"
        >
          <Plus size={18} />
          <span>添加账户</span>
        </button>
      </div>

      {isAdding && (
        <div className="cat-card border-cat-accent/30 animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-wider">账户名称</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如: 支付宝"
                  className="w-full bg-cat-black border border-white/10 rounded-xl px-4 py-3 focus:border-cat-accent outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-wider">初始余额</label>
                <input
                  type="number"
                  step="0.01"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-cat-black border border-white/10 rounded-xl px-4 py-3 focus:border-cat-accent outline-none font-mono"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider">图标</label>
              <div className="flex gap-4">
                {ICONS.map((i) => {
                  const IconComp = getIcon(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIcon(i)}
                      className={`p-3 rounded-xl border transition-all ${
                        icon === i ? 'bg-cat-accent/20 border-cat-accent text-cat-accent' : 'bg-cat-black border-white/10 text-white/40'
                      }`}
                    >
                      <IconComp size={24} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="cat-btn flex-1">保存账户</button>
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="cat-btn-secondary"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((acc) => {
          const IconComp = getIcon(acc.icon);
          return (
            <div key={acc.id} className="cat-card group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-cat-accent/10 text-cat-accent rounded-2xl flex items-center justify-center">
                  <IconComp size={24} />
                </div>
                <button 
                  onClick={() => onDelete(acc.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-400 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <h3 className="text-lg font-bold mb-1">{acc.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-white/40 text-sm">¥</span>
                <span className="text-2xl font-mono font-bold">{acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
