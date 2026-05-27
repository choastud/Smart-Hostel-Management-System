"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Mic, MicOff, Loader, Sparkles, MessageSquare, Bot, ArrowDown } from 'lucide-react';
import { getSupabaseClient } from '@/services/supabaseClient';
import { useAI } from '@/context/AIContext';
import { useAuth } from '@/services/AuthContext';
import { ChatbotMessage } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatbotWindowProps {
  onClose: () => void;
}

const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Markdown Helper Component
function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 text-sm font-light">
      {lines.map((line, idx) => {
        let trimmed = line.trim();
        // Check list item
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start pl-2 gap-1.5">
              <span className="text-blue-400 mt-1.5">•</span>
              <span>{parseInlineMarkdown(trimmed.substring(2))}</span>
            </div>
          );
        }
        // Check headers
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-semibold text-zinc-100 mt-2 text-xs uppercase tracking-wider text-blue-400">
              {parseInlineMarkdown(trimmed.substring(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-bold text-zinc-100 mt-3 text-sm border-b border-zinc-800 pb-1">
              {parseInlineMarkdown(trimmed.substring(3))}
            </h3>
          );
        }
        // Normal paragraph
        return <p key={idx} className="leading-relaxed text-zinc-300">{parseInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-white bg-blue-500/10 px-1 rounded">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

// Role-based smart suggestions
const SUGGESTIONS: Record<string, string[]> = {
  student: [
    "Which rooms are vacant?",
    "Show my attendance",
    "What is today’s mess menu?",
    "Who are my roommates?",
    "When is my hostel fee due?"
  ],
  admin: [
    "How many students are registered?",
    "List all complaints and status",
    "Show latest visitor logs",
    "What is the hostel occupancy?"
  ],
  warden: [
    "List pending visitor requests",
    "List unresolved complaints",
    "Who is absent today?",
    "Show room allocations"
  ]
};

export default function ChatbotWindow({ onClose }: ChatbotWindowProps) {
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  
  const { user } = useAuth();
  const supabase = getSupabaseClient();
  const { apiKey } = useAI();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const role = user?.role || 'student';
  const roleKey = role === 'student' || role === 'admin' || role === 'warden' ? role : 'student';
  const suggestions = SUGGESTIONS[roleKey];

  // Scroll to bottom helper
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, loading]);

  // Load chat history on mount
  useEffect(() => {
    async function fetchHistory() {
      if (supabase) {
        const { data, error } = await supabase
          .from('chatbot_messages')
          .select('*')
          .order('created_at', { ascending: true });
        if (!error && data) {
          setMessages(data as ChatbotMessage[]);
          return;
        }
      }
      // Local fallback
      const stored = localStorage.getItem('chatbot_messages');
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    }
    fetchHistory();
  }, [supabase]);

  // Handle container scroll
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // Show button if user is scrolled up by more than 200px
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);
  };

  const addMessage = (msg: ChatbotMessage) => {
    setMessages((prev) => [...prev, msg]);
    if (supabase) {
      supabase.from('chatbot_messages').insert([msg]).then(({ error }) => {
        if (error) console.error("Error inserting message to supabase:", error);
      });
    } else {
      const stored = localStorage.getItem('chatbot_messages');
      const list = stored ? JSON.parse(stored) : [];
      list.push(msg);
      localStorage.setItem('chatbot_messages', JSON.stringify(list));
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim()) return;
    
    let userId = 'anonymous';
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) userId = data.user.id;
    }

    const userMsg: ChatbotMessage = {
      id: generateUUID(),
      user_id: userId,
      role: 'user',
      content: textToSend.trim(),
      created_at: new Date().toISOString(),
    };
    
    addMessage(userMsg);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'x-supabase-url': localStorage.getItem('shms_supabase_url') || '',
          'x-supabase-anon-key': localStorage.getItem('shms_supabase_anon_key') || '',
        },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: textToSend.trim() },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from chat API');
      }

      if (!response.body) throw new Error('No stream');
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let assistantContent = '';
      const assistantMsgId = generateUUID();
      const assistantMsg: ChatbotMessage = {
        id: assistantMsgId,
        user_id: 'assistant',
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, assistantMsg]);

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanedLine = line.trim();
          if (!cleanedLine) continue;
          if (cleanedLine === 'data: [DONE]') break;
          
          if (cleanedLine.startsWith('data: ')) {
            const dataStr = cleanedLine.slice(6);
            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantMsgId ? { ...m, content: assistantContent } : m))
                );
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      }

      // Final upsert to persist
      if (supabase) {
        await supabase.from('chatbot_messages').upsert([
          { ...assistantMsg, content: assistantContent, created_at: new Date().toISOString() },
        ]);
      } else {
        const stored = localStorage.getItem('chatbot_messages');
        const list = stored ? JSON.parse(stored) : [];
        const index = list.findIndex((m: any) => m.id === assistantMsgId);
        if (index > -1) {
          list[index].content = assistantContent;
          list[index].created_at = new Date().toISOString();
        } else {
          list.push({ ...assistantMsg, content: assistantContent, created_at: new Date().toISOString() });
        }
        localStorage.setItem('chatbot_messages', JSON.stringify(list));
      }
    } catch (err) {
      console.error(err);
      // fallback response
      const fallbackId = generateUUID();
      addMessage({
        id: fallbackId,
        user_id: 'assistant',
        role: 'assistant',
        content: "I'm sorry, I'm having trouble reaching the database or AI engine right now. Please verify your internet connection and API key configurations.",
        created_at: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  // Voice input
  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser. Please try Google Chrome.");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    if (!listening) {
      recognition.start();
      setListening(true);
    } else {
      recognition.stop();
      setListening(false);
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      className="fixed bottom-24 right-6 w-96 md:w-[420px] h-[600px] max-h-[80vh] bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl flex flex-col z-40 overflow-hidden ring-1 ring-white/10"
    >
      {/* Glow Effects */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between p-4 border-b border-zinc-800/60 bg-zinc-900/30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/10">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100 text-sm flex items-center gap-1.5">
              AuraHost AI <Sparkles size={13} className="text-blue-400" />
            </h3>
            <span className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">
              Hostel Copilot ({role})
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 transition-colors"
          aria-label="Close Assistant"
        >
          <X size={16} />
        </button>
      </div>

      {/* Chat messages */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 relative scrollbar-thin scrollbar-thumb-zinc-800"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400 shadow-inner">
                <MessageSquare size={22} />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-200 text-sm">How can I help you today?</h4>
                <p className="text-xs text-zinc-500 max-w-[280px] mt-1.5 leading-relaxed">
                  Ask me about room vacancies, today's mess menu, attendance records, visitor entries, or outstanding fees.
                </p>
              </div>
            </motion.div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-br-none shadow-lg shadow-blue-500/10'
                      : 'bg-zinc-900/60 border border-zinc-800/60 text-zinc-200 rounded-bl-none backdrop-blur-md'
                  }`}
                >
                  <MarkdownText text={msg.content} />
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-zinc-900/60 border border-zinc-800/60 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2 text-zinc-400 text-xs">
              <Loader className="animate-spin text-blue-400" size={13} />
              <span>Analyzing database...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll Button */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-32 right-6 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg z-50 animate-bounce"
        >
          <ArrowDown size={14} />
        </button>
      )}

      {/* Bottom Area: Suggestions + Input */}
      <div className="border-t border-zinc-800/60 bg-zinc-950 p-4 space-y-3">
        {/* Clickable Suggestions */}
        {messages.length === 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider block">
              Suggested Queries
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto scrollbar-none">
              {suggestions.map((sug, i) => (
                <motion.button
                  key={i}
                  onClick={() => handleSend(sug)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-[11px] text-zinc-400 bg-zinc-900/50 hover:bg-zinc-900 hover:text-zinc-200 border border-zinc-800/50 hover:border-zinc-700/80 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all duration-200"
                >
                  {sug}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Input Row */}
        <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-2 py-1.5">
          <motion.button
            onClick={toggleListening}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-lg transition-all ${
              listening ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/20 animate-pulse' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
            }`}
            aria-label="Voice input"
          >
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
          </motion.button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
            className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-zinc-200 placeholder-zinc-600 text-sm py-1.5 px-1"
            placeholder="Ask your hostel assistant..."
            disabled={loading}
          />
          
          <motion.button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all shadow-md shadow-blue-500/10"
            aria-label="Send message"
          >
            <Send size={16} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
