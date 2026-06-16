import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Calendar, Wallet, Tag, FileText, Target } from 'lucide-react';
import { Account, CATEGORIES, Category, Goal } from '../types';
import { format } from 'date-fns';

interface TransactionFormProps {
  accounts: Account[];
  initialGoalId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransactionForm({ accounts, initialGoalId, onClose, onSuccess }: TransactionFormProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>(initialGoalId ? '攒钱' : '餐饮');
  const [accountId, setAccountId] = useState<number>(accounts[0]?.id || 0);
  const [goalId, setGoalId] = useState<number | null>(initialGoalId || null);
  const [timestamp, setTimestamp] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"));
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/goals');
      const data = await res.json();
      setGoals(data.filter((g: Goal) => g.status === 'active'));
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          type,
          category,
          timestamp,
          account_id: accountId,
          note,
          goal_id: goalId,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to save transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-cat-dark border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold">新增记账</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type Toggle */}
          <div className="flex p-1 bg-cat-black rounded-2xl border border-white/5">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                type === 'expense' ? 'bg-red-500/20 text-red-400 font-bold' : 'text-white/40'
              }`}
            >
              <Minus size={18} />
              <span>支出</span>
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                type === 'income' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-white/40'
              }`}
            >
              <Plus size={18} />
              <span>收入</span>
            </button>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">金额</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-white/20">¥</span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-cat-black border border-white/10 rounded-2xl pl-10 pr-4 py-4 text-3xl font-mono font-bold focus:border-cat-accent outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
                <Tag size={12} /> 分类
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-cat-black border border-white/10 rounded-xl px-4 py-3 focus:border-cat-accent outline-none appearance-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Account */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
                <Wallet size={12} /> 账户
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(parseInt(e.target.value))}
                className="w-full bg-cat-black border border-white/10 rounded-xl px-4 py-3 focus:border-cat-accent outline-none appearance-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Timestamp */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
              <Calendar size={12} /> 时间 (精确到秒)
            </label>
            <input
              type="datetime-local"
              step="1"
              required
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="w-full bg-cat-black border border-white/10 rounded-xl px-4 py-3 focus:border-cat-accent outline-none"
            />
          </div>

          {/* Goal Link */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
              <Target size={12} /> 关联攒钱目标 (可选)
            </label>
            <select
              value={goalId || ''}
              onChange={(e) => {
                const val = e.target.value;
                setGoalId(val ? parseInt(val) : null);
                if (val) setCategory('攒钱');
              }}
              className="w-full bg-cat-black border border-white/10 rounded-xl px-4 py-3 focus:border-cat-accent outline-none appearance-none"
            >
              <option value="">不关联目标</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>{goal.name} (已攒 ¥{goal.current_amount})</option>
              ))}
            </select>
            <p className="text-[10px] text-white/20 italic">关联后，支出将增加目标进度，收入将减少目标进度。</p>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
              <FileText size={12} /> 备注
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="写点什么..."
              className="w-full bg-cat-black border border-white/10 rounded-xl px-4 py-3 focus:border-cat-accent outline-none min-h-[80px] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-cat-accent text-cat-black font-bold py-4 rounded-2xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? '保存中...' : '确认入账'}
          </button>
        </form>
      </div>
    </div>
  );
}
