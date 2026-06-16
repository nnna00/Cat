import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function CalendarCheckIn() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [checkInDays, setCheckInDays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCheckInData();
  }, [currentMonth]);

  const fetchCheckInData = async () => {
    setIsLoading(true);
    try {
      const monthStr = format(currentMonth, 'yyyy-MM');
      const res = await fetch(`/api/checkin/${monthStr}`);
      const data = await res.json();
      setCheckInDays(data);
    } catch (error) {
      console.error('Failed to fetch check-in data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Fill empty days at the start of the month
  const startDay = days[0].getDay();
  const padding = Array.from({ length: startDay === 0 ? 6 : startDay - 1 });

  return (
    <div className="cat-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold flex items-center gap-2">
          <span>🐾</span>
          <span>猫爪打卡历</span>
        </h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
            className="p-1 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold min-w-[80px] text-center">
            {format(currentMonth, 'yyyy年MM月')}
          </span>
          <button 
            onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
            className="p-1 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['一', '二', '三', '四', '五', '六', '日'].map(d => (
          <div key={d} className="text-[10px] font-bold text-white/20 text-center uppercase">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {padding.map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isChecked = checkInDays.includes(dateStr);
          const isCurrentDay = isToday(day);

          return (
            <div 
              key={dateStr} 
              className={`aspect-square relative flex items-center justify-center rounded-lg text-[10px] transition-all ${
                isCurrentDay ? 'bg-white/10 ring-1 ring-white/20' : ''
              }`}
            >
              <span className={isChecked ? 'opacity-20' : 'opacity-60'}>
                {format(day, 'd')}
              </span>
              {isChecked && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center text-white"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12,10c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S13.1,10,12,10z M18,10c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S19.1,10,18,10z M6,10 c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S7.1,10,6,10z M12,16c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S13.1,16,12,16z M18,16 c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S19.1,16,18,16z M6,16c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S7.1,16,6,16z M12,4 c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S13.1,4,12,4z" />
                  </svg>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-white/40">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-white/10" />
          <span>未记账</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-white">🐾</span>
          <span>已记账</span>
        </div>
      </div>
    </div>
  );
}
