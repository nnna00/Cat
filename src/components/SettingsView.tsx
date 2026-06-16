import React, { useState, useEffect } from 'react';
import { Save, Key, Cpu, Info, Trash2, AlertTriangle } from 'lucide-react';

interface SettingsProps {
  onSettingsChange: () => void;
}

export default function SettingsView({ onSettingsChange }: SettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-3-flash-preview');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.GEMINI_API_KEY) setApiKey(data.GEMINI_API_KEY);
      if (data.GEMINI_MODEL) setModel(data.GEMINI_MODEL);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await Promise.all([
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'GEMINI_API_KEY', value: apiKey }),
        }),
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'GEMINI_MODEL', value: model }),
        }),
      ]);
      onSettingsChange();
      // Using a temporary status instead of alert
      setResetStatus('success');
      setTimeout(() => setResetStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setResetStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (isResetting) return;
    
    setIsResetting(true);
    setResetStatus('loading');
    
    try {
      const response = await fetch('/api/system/reset', { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        setResetStatus('success');
        // Give user time to see success message
        setTimeout(() => {
          window.location.href = window.location.origin + '?reset=' + Date.now();
        }, 1000);
      } else {
        const data = await response.json().catch(() => ({ error: 'Unknown server error' }));
        setResetStatus('error');
        console.error('Reset failed:', data.error);
      }
    } catch (error) {
      console.error('Failed to reset system:', error);
      setResetStatus('error');
    } finally {
      setIsResetting(false);
      // We don't hide the confirm box here if it failed, so user can try again
      if (resetStatus === 'success') setShowConfirmReset(false);
    }
  };

  if (isLoading) return <div className="animate-pulse text-white/40">加载设置中...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold">系统设置</h2>
      </div>

      <div className="cat-card space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
              <Key size={14} /> 自定义 Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="输入你的 API Key (留空则使用系统默认)"
              className="w-full bg-cat-black border border-white/10 rounded-xl px-4 py-3 focus:border-white outline-none"
            />
            <p className="text-[10px] text-white/20">
              如果你有自己的 API Key，可以在这里设置。留空将使用系统预设的 Key。
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
              <Cpu size={14} /> 选择模型
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-cat-black border border-white/10 rounded-xl px-4 py-3 focus:border-white outline-none appearance-none"
            >
              <option value="gemini-3-flash-preview">Gemini 3 Flash (推荐)</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (更强推理)</option>
              <option value="gemini-2.5-flash-latest">Gemini 2.5 Flash (快速)</option>
            </select>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full cat-btn flex items-center justify-center gap-2"
            >
              <Save size={18} />
              <span>{isSaving ? '保存中...' : '保存设置'}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="cat-card border-red-500/20 bg-red-500/5 space-y-4">
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle size={18} />
          <h3 className="font-bold">危险区域</h3>
        </div>
        <p className="text-xs text-white/40">
          重置数据库将清除所有用户数据，包括账单、账户信息和聊天记录。
        </p>
        
        {!showConfirmReset ? (
          <button
            onClick={() => setShowConfirmReset(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm font-bold"
          >
            <Trash2 size={16} />
            <span>清除所有数据并重置</span>
          </button>
        ) : (
          <div className="space-y-3 p-4 bg-red-500/10 rounded-xl border border-red-500/30">
            <p className="text-sm font-bold text-red-400">确定要重置吗？此操作不可撤销！</p>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {isResetting ? '正在重置...' : '是的，立即重置'}
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-all"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {resetStatus === 'success' && (
          <p className="text-xs text-emerald-400 font-bold animate-pulse">操作成功！正在刷新...</p>
        )}
        {resetStatus === 'error' && (
          <p className="text-xs text-red-400 font-bold">操作失败，请重试。</p>
        )}
      </div>

      <div className="cat-card bg-white/5 border-dashed">
        <div className="flex gap-3">
          <Info className="text-white/40 shrink-0" size={20} />
          <div className="text-xs text-white/40 space-y-2">
            <p className="font-bold text-white/60">关于黑白主题</p>
            <p>
              我们已将应用切换为极致的黑白单色风格。所有的彩色元素已被替换为不同深浅的灰色和纯白色，以提供更纯粹的视觉体验。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
