import React, { useState, useEffect } from 'react';
import { Goal } from '../types';
import { Plus, Target, Trash2, Fish, TrendingUp, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SavingsGoalsProps {
  onAddTransaction: (goalId: number) => void;
}

export default function SavingsGoals({ onAddTransaction }: SavingsGoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [icon, setIcon] = useState('Fish');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/goals');
      const data = await res.json();
      setGoals(data);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !target) return;

    try {
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          target_amount: parseFloat(target),
          current_amount: parseFloat(current) || 0,
          icon,
        }),
      });
      setIsAdding(false);
      setName('');
      setTarget('');
      setCurrent('');
      fetchGoals();
    } catch (error) {
      console.error('Failed to add goal:', error);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (!confirm('确定要删除这个攒钱目标吗？')) return;
    try {
      await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      fetchGoals();
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Fish className="text-white" />
          <span>小鱼干攒钱计划</span>
        </h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="cat-btn flex items-center gap-2"
        >
          <Plus size={18} />
          <span>新目标</span>
        </button>
      </div>

      {isLoading ? (
        <div className="animate-pulse text-white/40">加载目标中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
            const isCompleted = goal.status === 'completed';

            return (
              <motion.div 
                key={goal.id} 
                layout
                className="cat-card group relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40'
                    }`}>
                      <Fish size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{goal.name}</h3>
                      <p className="text-xs text-white/40">目标: ¥{goal.target_amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Progress Bowl */}
                <div className="relative h-24 bg-cat-black rounded-2xl border border-white/5 overflow-hidden mb-4">
                  {/* Water/Fish filling */}
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${progress}%` }}
                    className={`absolute bottom-0 left-0 right-0 transition-all ${
                      isCompleted ? 'bg-emerald-500/20' : 'bg-white/10'
                    }`}
                  >
                    {/* Animated Fish */}
                    {progress > 10 && (
                      <motion.div 
                        animate={{ x: [0, 20, 0], y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="absolute top-2 left-4 text-white/20"
                      >
                        <Fish size={16} />
                      </motion.div>
                    )}
                    {progress > 50 && (
                      <motion.div 
                        animate={{ x: [0, -20, 0], y: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 4, delay: 1 }}
                        className="absolute top-6 right-8 text-white/20"
                      >
                        <Fish size={14} />
                      </motion.div>
                    )}
                  </motion.div>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-mono font-bold">
                      {progress.toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">已攒 ¥{goal.current_amount}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onAddTransaction(goal.id)}
                    className="flex-1 cat-btn py-3 flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus size={16} />
                    <span>存入小鱼干</span>
                  </button>
                </div>

                {isCompleted && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 text-emerald-400"
                  >
                    <CheckCircle2 size={20} />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-cat-dark border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold">设立新目标</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddGoal} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-wider">目标名称</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例如: 买个大罐头"
                    className="w-full bg-cat-black border border-white/10 rounded-xl px-4 py-3 focus:border-white outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider">目标金额</label>
                    <input
                      type="number"
                      required
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-cat-black border border-white/10 rounded-xl px-4 py-3 focus:border-white outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider">已攒金额</label>
                    <input
                      type="number"
                      value={current}
                      onChange={(e) => setCurrent(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-cat-black border border-white/10 rounded-xl px-4 py-3 focus:border-white outline-none font-mono"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full cat-btn py-4 mt-2">
                  开始攒钱！
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
