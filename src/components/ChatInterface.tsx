import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Character, Message } from '../types';
import { Send, Plus, User, Bot, Trash2, Upload, Cat, X, Save, Edit2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';

interface ChatInterfaceProps {
  characters: Character[];
  selectedCharacterId: number | null;
  onSelectCharacter: (id: number | null) => void;
  onAddCharacter: (char: Partial<Character>) => void;
  onDeleteCharacter: (id: number) => void;
  onUpdateCharacter: (id: number, char: Partial<Character>) => void;
}

export default function ChatInterface({ 
  characters, 
  selectedCharacterId,
  onSelectCharacter,
  onAddCharacter, 
  onDeleteCharacter, 
  onUpdateCharacter 
}: ChatInterfaceProps) {
  const selectedChar = characters.find(c => c.id === selectedCharacterId) || null;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Character form state
  const [charName, setCharName] = useState('');
  const [charDesc, setCharDesc] = useState('');
  const [charPers, setCharPers] = useState('');
  const [charGreet, setCharGreet] = useState('');
  const [charAvatar, setCharAvatar] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedCharacterId) {
      fetchMessages(selectedCharacterId);
    }
  }, [selectedCharacterId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async (charId: number) => {
    try {
      const response = await fetch(`/api/messages/${charId}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedChar || isLoading) return;

    const userMsg = input;
    setInput('');
    setIsLoading(true);

    try {
      // Fetch settings for custom API Key and Model
      const settingsRes = await fetch('/api/settings');
      const settings = await settingsRes.json();
      const customKey = settings.GEMINI_API_KEY;
      const customModel = settings.GEMINI_MODEL || "gemini-3-flash-preview";

      // Fetch financial summary for context
      const summaryRes = await fetch('/api/summary');
      const summary = await summaryRes.json();

      const financialContext = `
Current Financial Status:
- Total Balance: ${summary.totalBalance}
- This Month (${summary.monthlyStats.month}): Income: ${summary.monthlyStats.income}, Expense: ${summary.monthlyStats.expense}
- Recent Transactions: ${summary.recentTransactions.slice(0, 3).map((t: any) => `${t.type === 'income' ? '+' : '-'}${t.amount} (${t.category}: ${t.note || '无备注'})`).join('; ')}
- Active Goals: ${summary.activeGoals.map((g: any) => `${g.name}: ${g.current_amount}/${g.target_amount}`).join('; ')}
      `.trim();

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_id: selectedChar.id,
          role: 'user',
          content: userMsg,
        }),
      });
      const { id } = await res.json();
      setMessages(prev => [...prev, { id, character_id: selectedChar.id, role: 'user', content: userMsg, timestamp: new Date().toISOString() }]);

      const ai = new GoogleGenAI({ apiKey: customKey || process.env.GEMINI_API_KEY });
      const genResponse = await ai.models.generateContent({
        model: customModel,
        contents: [
          { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: {
          systemInstruction: `You are roleplaying as ${selectedChar.name}. 
Personality: ${selectedChar.personality}. 
Description: ${selectedChar.description}.

User's Financial Context:
${financialContext}

Your goal is to be a helpful and cute bookkeeping companion. 
When appropriate, comment on the user's financial status, spending habits, or goal progress in your character's voice.
Keep your responses concise, engaging, and use emojis. 
If the user asks about their balance or spending, use the provided context to answer.`,
        }
      });

      const aiContent = genResponse.text || "喵... 我好像走丢了。";

      const aiRes = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_id: selectedChar.id,
          role: 'assistant',
          content: aiContent,
        }),
      });
      const { id: aiId } = await aiRes.json();
      setMessages(prev => [...prev, { id: aiId, character_id: selectedChar.id, role: 'assistant', content: aiContent, timestamp: new Date().toISOString() }]);

    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && selectedChar) {
      await onUpdateCharacter(selectedChar.id, {
        name: charName,
        description: charDesc,
        personality: charPers,
        greeting: charGreet,
        avatar: charAvatar,
      });
      setIsEditing(false);
    } else {
      await onAddCharacter({
        name: charName,
        description: charDesc,
        personality: charPers,
        greeting: charGreet,
        avatar: charAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${charName}`,
      });
      setIsCreating(false);
    }
    resetForm();
  };

  const resetForm = () => {
    setCharName('');
    setCharDesc('');
    setCharPers('');
    setCharGreet('');
    setCharAvatar('');
  };

  const openCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const openEdit = () => {
    if (!selectedChar) return;
    setCharName(selectedChar.name);
    setCharDesc(selectedChar.description);
    setCharPers(selectedChar.personality);
    setCharGreet(selectedChar.greeting);
    setCharAvatar(selectedChar.avatar);
    setIsEditing(true);
  };

  const handleImportCard = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onAddCharacter({
          name: json.name || json.char_name || "Unknown",
          description: json.description || json.char_persona || "",
          personality: json.personality || "",
          greeting: json.first_mes || "Hello!",
          avatar: json.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${json.name}`,
        });
      } catch (err) {
        alert("Invalid character card JSON");
      }
    };
    reader.readAsText(file);
  };

  const handleImageImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const jsonMatch = content.match(/\{"name":.*?\}/) || content.match(/\{"char_name":.*?\}/);
      if (jsonMatch) {
        try {
          const json = JSON.parse(jsonMatch[0]);
          onAddCharacter({
            name: json.name || json.char_name || "Unknown",
            description: json.description || json.char_persona || "",
            personality: json.personality || "",
            greeting: json.first_mes || "Hello!",
            avatar: json.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${json.name}`,
          });
          return;
        } catch (e) {}
      }
      
      const base64 = await toBase64(file);
      resetForm();
      setCharAvatar(base64);
      setIsCreating(true);
    };
    reader.readAsText(file);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await toBase64(file);
    setCharAvatar(base64);
  };

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-160px)] gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar flex-1">
          {characters.map((char) => (
              <button
                key={char.id}
                onClick={() => onSelectCharacter(char.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all ${
                  selectedCharacterId === char.id 
                    ? 'bg-white/20 border-white text-white' 
                    : 'bg-cat-dark border-white/5 text-white/40 hover:border-white/20'
                }`}
              >
              <img src={char.avatar} alt={char.name} className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
              <span className="font-bold text-sm">{char.name}</span>
            </button>
          ))}
          <button 
            onClick={openCreate}
            className="flex-shrink-0 p-2 rounded-2xl border border-dashed border-white/20 text-white/20 hover:text-white/60 hover:border-white/40 transition-all flex items-center gap-2 px-3"
          >
            <Plus size={18} />
            <span className="text-xs font-bold">新增</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 p-2 rounded-2xl border border-dashed border-white/20 text-white/20 hover:text-white/60 hover:border-white/40 transition-all flex items-center gap-2 px-3"
          >
            <Upload size={18} />
            <span className="text-xs font-bold">JSON</span>
          </button>
          <button 
            onClick={() => imageInputRef.current?.click()}
            className="flex-shrink-0 p-2 rounded-2xl border border-dashed border-white/20 text-white/20 hover:text-white/60 hover:border-white/40 transition-all flex items-center gap-2 px-3"
            title="支持导入包含元数据的图片或直接作为头像 (支持 GIF)"
          >
            <ImageIcon size={18} />
            <span className="text-xs font-bold">图片卡</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImportCard} accept=".json" className="hidden" />
          <input type="file" ref={imageInputRef} onChange={handleImageImport} accept="image/*" className="hidden" />
        </div>
      </div>

      <div className="flex-1 cat-card flex flex-col overflow-hidden p-0">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <img src={selectedChar?.avatar} alt={selectedChar?.name} className="w-10 h-10 rounded-2xl object-cover" referrerPolicy="no-referrer" />
            <div>
              <h3 className="font-bold">{selectedChar?.name}</h3>
              <p className="text-[10px] text-white/40 truncate max-w-[200px]">{selectedChar?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedChar && (
              <>
                <button 
                  onClick={openEdit}
                  className="p-2 text-white/20 hover:text-white transition-all"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={async () => {
                    if (selectedChar && confirm(`确定要删除角色 ${selectedChar.name} 吗？相关的聊天记录也将被删除。`)) {
                      const idToDelete = selectedChar.id;
                      // Find next character to select
                      const index = characters.findIndex(c => c.id === idToDelete);
                      const nextChar = characters[index + 1] || characters[index - 1] || null;
                      
                      await onDeleteCharacter(idToDelete);
                      onSelectCharacter(nextChar ? nextChar.id : null);
                    }
                  }}
                  className="p-2 text-white/20 hover:text-red-400 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
        >
          {messages.length === 0 && selectedChar && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white">
                <Cat size={32} />
              </div>
              <div className="max-w-xs">
                <p className="font-bold text-white mb-1">{selectedChar.name}</p>
                <p className="text-sm text-white/60 italic">"{selectedChar.greeting}"</p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-white text-black font-medium rounded-tr-none' 
                  : 'bg-white/5 text-white rounded-tl-none border border-white/5'
              }`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                <p className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-black/40' : 'text-white/20'}`}>
                  {format(parseISO(msg.timestamp), 'HH:mm')}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-white/40 rounded-full" />
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-white/40 rounded-full" />
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-white/40 rounded-full" />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/5 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`给 ${selectedChar?.name} 发消息...`}
            className="flex-1 bg-cat-black border border-white/10 rounded-xl px-4 py-3 focus:border-white outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="cat-btn px-4 py-3 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </form>
      </div>

      <AnimatePresence>
        {(isCreating || isEditing) && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-cat-dark border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold">{isEditing ? '编辑角色' : '新增角色'}</h2>
                <button onClick={() => { setIsCreating(false); setIsEditing(false); }} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveCharacter} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                <div className="flex justify-center mb-4">
                  <div className="relative group">
                    <img 
                      src={charAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=default'} 
                      alt="Avatar" 
                      className="w-24 h-24 rounded-3xl object-cover border-2 border-white/10"
                      referrerPolicy="no-referrer"
                    />
                    <button 
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="上传头像 (支持 JPG, PNG, GIF)"
                    >
                      <ImageIcon size={24} />
                    </button>
                    <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-wider">角色名称</label>
                  <input
                    type="text"
                    required
                    value={charName}
                    onChange={(e) => setCharName(e.target.value)}
                    placeholder="例如: 小黑猫"
                    className="w-full bg-cat-black border border-white/10 rounded-xl px-4 py-3 focus:border-white outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-wider">角色描述</label>
                  <textarea
                    value={charDesc}
                    onChange={(e) => setCharDesc(e.target.value)}
                    placeholder="描述一下这个角色..."
                    className="w-full bg-cat-black border border-white/10 rounded-xl px-4 py-3 focus:border-white outline-none h-20 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-wider">性格设定</label>
                  <textarea
                    value={charPers}
                    onChange={(e) => setCharPers(e.target.value)}
                    placeholder="设定角色的性格、说话方式..."
                    className="w-full bg-cat-black border border-white/10 rounded-xl px-4 py-3 focus:border-white outline-none h-20 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-wider">打招呼语</label>
                  <input
                    type="text"
                    value={charGreet}
                    onChange={(e) => setCharGreet(e.target.value)}
                    placeholder="角色第一次见面的话..."
                    className="w-full bg-cat-black border border-white/10 rounded-xl px-4 py-3 focus:border-white outline-none"
                  />
                </div>
                <button type="submit" className="w-full cat-btn py-4 mt-2 flex items-center justify-center gap-2">
                  <Save size={20} />
                  <span>{isEditing ? '保存修改' : '保存角色'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
