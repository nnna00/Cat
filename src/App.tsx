import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import AccountList from './components/AccountList';
import ChatInterface from './components/ChatInterface';
import Reports from './components/Reports';
import SettingsView from './components/SettingsView';
import SavingsGoals from './components/SavingsGoals';
import CalendarCheckIn from './components/CalendarCheckIn';
import { Transaction, Account, Character } from './types';
import { Plus, Cat, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, addMonths, subMonths, parseISO } from 'date-fns';

import AnimatedCat from './components/AnimatedCat';
import { motion } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [preSelectedGoalId, setPreSelectedGoalId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ... (fetchData and other handlers)

  const openAddTransaction = (goalId?: number) => {
    setPreSelectedGoalId(goalId || null);
    setIsAddingTransaction(true);
  };
  
  // Filtering state
  const [currentFilterMonth, setCurrentFilterMonth] = useState(new Date());

  useEffect(() => {
    fetchData(true);
  }, []);

  const fetchData = async (initial = false) => {
    if (initial) setIsLoading(true);
    try {
      const [tRes, aRes, cRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/accounts'),
        fetch('/api/characters'),
      ]);
      
      const [tData, aData, cData] = await Promise.all([
        tRes.json(),
        aRes.json(),
        cRes.json(),
      ]);

      setTransactions(tData);
      setAccounts(aData);
      setCharacters(cData);
      
      // Set initial selected character if not set
      if (cData.length > 0 && selectedCharacterId === null) {
        setSelectedCharacterId(cData[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      if (initial) setIsLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    const start = startOfMonth(currentFilterMonth);
    const end = endOfMonth(currentFilterMonth);
    return transactions.filter(t => 
      isWithinInterval(parseISO(t.timestamp), { start, end })
    );
  }, [transactions, currentFilterMonth]);

  const handleAddAccount = async (name: string, balance: number, icon: string) => {
    try {
      await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, balance, icon }),
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to add account:', error);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm('确定要删除这个账户吗？相关的交易明细将失去关联。')) return;
    try {
      await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('确定要删除这笔记录吗？')) return;
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleAddCharacter = async (char: Partial<Character>) => {
    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(char),
      });
      const data = await res.json();
      await fetchData();
      if (data.id) {
        setSelectedCharacterId(data.id);
      }
    } catch (error) {
      console.error('Failed to add character:', error);
    }
  };

  const handleUpdateCharacter = async (id: number, char: Partial<Character>) => {
    try {
      const res = await fetch(`/api/characters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(char),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to update character:', error);
    }
  };

  const handleDeleteCharacter = async (id: number) => {
    if (!confirm('确定要删除这个角色吗？相关的聊天记录也将被删除。')) return;
    try {
      const res = await fetch(`/api/characters/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to delete character:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cat-black flex flex-col items-center justify-center gap-6 text-white">
        <div className="relative">
          <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full" />
          <AnimatedCat size={120} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="font-bold tracking-[0.3em] text-sm animate-pulse">KURO NEKO LEDGER</p>
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-white"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'chat' && (
        <ChatInterface 
          characters={characters} 
          selectedCharacterId={selectedCharacterId}
          onSelectCharacter={setSelectedCharacterId}
          onAddCharacter={handleAddCharacter} 
          onDeleteCharacter={handleDeleteCharacter}
          onUpdateCharacter={handleUpdateCharacter}
        />
      )}

      {activeTab === 'ledger' && (
        <div className="space-y-6">
          <CalendarCheckIn />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">账单明细</h2>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-cat-dark border border-white/5 rounded-xl p-1">
                <button 
                  onClick={() => setCurrentFilterMonth(subMonths(currentFilterMonth, 1))}
                  className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="px-4 flex items-center gap-2 font-bold text-sm min-w-[120px] justify-center">
                  <CalendarIcon size={14} className="text-white" />
                  <span>{format(currentFilterMonth, 'yyyy年MM月')}</span>
                </div>
                <button 
                  onClick={() => setCurrentFilterMonth(addMonths(currentFilterMonth, 1))}
                  className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <button 
                onClick={() => openAddTransaction()}
                className="cat-btn flex items-center gap-2"
              >
                <Plus size={18} />
                <span>记一笔</span>
              </button>
            </div>
          </div>
          
          <TransactionList 
            transactions={filteredTransactions} 
            onDelete={handleDeleteTransaction} 
          />
        </div>
      )}

      {activeTab === 'accounts' && (
        <AccountList 
          accounts={accounts} 
          onAdd={handleAddAccount} 
          onDelete={handleDeleteAccount} 
        />
      )}

      {activeTab === 'goals' && (
        <SavingsGoals onAddTransaction={openAddTransaction} />
      )}

      {activeTab === 'reports' && (
        <Reports transactions={transactions} />
      )}

      {activeTab === 'settings' && (
        <SettingsView onSettingsChange={fetchData} />
      )}

      {isAddingTransaction && (
        <TransactionForm 
          accounts={accounts} 
          initialGoalId={preSelectedGoalId}
          onClose={() => {
            setIsAddingTransaction(false);
            setPreSelectedGoalId(null);
          }} 
          onSuccess={fetchData} 
        />
      )}
    </Layout>
  );
}
