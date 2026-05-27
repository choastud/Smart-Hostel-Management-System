"use client";

import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import ChatbotWindow from './ChatbotWindow';

export default function ChatbotButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl transition-colors duration-300"
        aria-label="Open AI assistant"
      >
        <MessageSquare size={24} />
      </button>
      {/* Chat window */}
      {open && <ChatbotWindow onClose={() => setOpen(false)} />}
    </>
  );
}
