"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Mic, MicOff, Loader } from 'lucide-react';
import { getSupabaseClient } from '@/services/supabaseClient';
import { useAI } from '@/context/AIContext';
import { ChatbotMessage } from '@/types';

interface ChatbotWindowProps {
  onClose: () => void;
}

const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export default function ChatbotWindow({ onClose }: ChatbotWindowProps) {
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const supabase = getSupabaseClient();
  const { apiKey } = useAI();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      
      // Fallback to local storage
      const stored = localStorage.getItem('chatbot_messages');
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    }
    fetchHistory();
  }, [supabase]);

  const addMessage = (msg: ChatbotMessage) => {
    setMessages((prev) => [...prev, msg]);
    // Persist to Supabase if active, otherwise local storage
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

  const handleSend = async () => {
    if (!input.trim()) return;
    
    let userId = 'anonymous';
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) userId = data.user.id;
    }

    const userMsg: ChatbotMessage = {
      id: generateUUID(),
      user_id: userId,
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    };
    addMessage(userMsg);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `You are an AI hostel assistant. Answer queries about rooms, fees, attendance, mess menu, complaints, visitors, rules, and curfew. Keep responses concise and friendly.` },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: input.trim() },
          ],
          stream: true,
        }),
      });

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
      addMessage(assistantMsg);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        // OpenAI streams data prefixed with "data: "
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
        for (const line of lines) {
          const json = line.replace('data: ', '');
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              // update message in place
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMsgId ? { ...m, content: assistantContent } : m))
              );
            }
          } catch (e) {
            // ignore parse errors
          }
        }
      }

      // Persist final assistant message
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
    } finally {
      setLoading(false);
    }
  };

  // Voice input handling
  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
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
    recognition.onerror = (event: any) => {
      console.error('Speech error', event);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
  };

  return (
    <div className="fixed bottom-24 right-6 w-96 max-h-[70vh] bg-white dark:bg-zinc-900 glass-panel rounded-2xl shadow-lg flex flex-col z-40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-zinc-800">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Hostel Assistant</h3>
        <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <X size={18} />
        </button>
      </div>
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                msg.role === 'assistant' 
                  ? 'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200' 
                  : msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
              <Loader className="animate-spin" size={14} />
              <span>Thinking…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-zinc-800 p-3 flex items-center gap-2">
        <button
          onClick={toggleListening}
          className={`p-2 rounded-full ${listening ? 'bg-red-500' : 'bg-gray-200 dark:bg-zinc-700'} text-white`}
          aria-label="Voice input"
        >
          {listening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
          className="flex-1 rounded-full border border-gray-300 dark:border-zinc-600 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
          placeholder="Ask your hostel assistant…"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
