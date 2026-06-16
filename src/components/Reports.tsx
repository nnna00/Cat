import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { format, parseISO, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface ReportsProps {
  transactions: Transaction[];
}

const COLORS = ['#ff79c6', '#bd93f9', '#8be9fd', '#50fa7b', '#f1fa8c', '#ffb86c', '#ff5555', '#6272a4'];

export default function Reports({ transactions }: ReportsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const currentMonthTransactions = transactions.filter(t => 
      isWithinInterval(parseISO(t.timestamp), { start: monthStart, end: monthEnd })
    );

    const income = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    currentMonthTransactions.filter(t => t.type === 'expense').forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    // Daily trend (last 30 days)
    const trendMap: Record<string, { income: number, expense: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(now, i), 'MM-dd');
      trendMap[date] = { income: 0, expense: 0 };
    }

    transactions.forEach(t => {
      const date = format(parseISO(t.timestamp), 'MM-dd');
      if (trendMap[date]) {
        if (t.type === 'income') trendMap[date].income += t.amount;
        else trendMap[date].expense += t.amount;
      }
    });

    const trendData = Object.entries(trendMap).map(([date, values]) => ({
      date,
      ...values
    }));

    return { income, expense, categoryData, trendData };
  }, [transactions]);

  return (
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="cat-card">
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">本月收入</p>
          <p className="text-2xl font-mono font-bold text-emerald-400">¥{stats.income.toFixed(2)}</p>
        </div>
        <div className="cat-card">
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">本月支出</p>
          <p className="text-2xl font-mono font-bold text-red-400">¥{stats.expense.toFixed(2)}</p>
        </div>
        <div className="cat-card">
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">结余</p>
          <p className="text-2xl font-mono font-bold text-cat-accent">¥{(stats.income - stats.expense).toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <div className="cat-card h-[400px] flex flex-col">
          <h3 className="text-lg font-bold mb-6">支出分类</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151515', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Trend Chart */}
        <div className="cat-card h-[400px] flex flex-col">
          <h3 className="text-lg font-bold mb-6">收支趋势 (近30天)</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trendData}>
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151515', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="expense" name="支出" stroke="#ff79c6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="income" name="收入" stroke="#50fa7b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
