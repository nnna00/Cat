import React from 'react';
import { Transaction } from '../types';
import { format, parseISO } from 'date-fns';
import { Trash2, ShoppingBag, Coffee, Gamepad2, Car, TrendingUp, Shirt, HeartPulse, GraduationCap, MoreHorizontal, Home, Target } from 'lucide-react';

interface TransactionListProps {
  transactions: (Transaction & { goal_name?: string })[];
  onDelete: (id: number) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  '餐饮': Coffee,
  '服装': Shirt,
  '氪金': Gamepad2,
  '交通': Car,
  '投资': TrendingUp,
  '购物': ShoppingBag,
  '娱乐': MoreHorizontal,
  '医疗': HeartPulse,
  '教育': GraduationCap,
  '住房': Home,
  '攒钱': Target,
  '其他': MoreHorizontal,
};

export default function TransactionList({ transactions, onDelete }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/20">
        <ShoppingBag size={48} className="mb-4 opacity-20" />
        <p>还没有账单明细哦</p>
      </div>
    );
  }

  // Group by date
  const grouped = transactions.reduce((acc, t) => {
    const date = format(parseISO(t.timestamp), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">{date}</h3>
            <div className="text-[10px] font-mono text-white/20">
              {items.length} 笔交易
            </div>
          </div>
          
          <div className="space-y-2">
            {items.map((t) => {
              const Icon = CATEGORY_ICONS[t.category] || MoreHorizontal;
              const isExpense = t.type === 'expense';
              
              return (
                <div key={t.id} className="cat-card flex items-center gap-4 group">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isExpense ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    <Icon size={24} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold truncate">{t.category}</h4>
                      <span className={`font-mono font-bold text-lg ${
                        isExpense ? 'text-white' : 'text-emerald-400'
                      }`}>
                        {isExpense ? '-' : '+'}{t.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/40">
                      <div className="flex items-center gap-2">
                        <span>{format(parseISO(t.timestamp), 'HH:mm:ss')}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span>{t.account_name}</span>
                        {t.goal_name && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <span className="flex items-center gap-1 text-emerald-400/60">
                              <Target size={10} />
                              {t.goal_name}
                            </span>
                          </>
                        )}
                      </div>
                      <button 
                        onClick={() => onDelete(t.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {t.note && (
                      <p className="mt-2 text-xs text-white/60 bg-white/5 p-2 rounded-lg italic">
                        "{t.note}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
