import React, { useState } from 'react';
import type { Procurement } from '@/types/domain/procurement';

interface Props {
  procurement: Procurement;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  time: string;
}

export default function DiskusiTab({ procurement }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: procurement.createdBy,
        message: input.trim(),
        time: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-300px)] min-h-[400px] bg-surface-container-lowest rounded-xl border border-border shadow-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">
              forum
            </span>
            <p className="text-sm text-secondary">
              Belum ada diskusi. Mulai diskusi dengan tim procurement.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                {m.sender.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-on-surface">
                    {m.sender}
                  </span>
                  <span className="text-[10px] text-outline">{m.time}</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {m.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="border-t border-border p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === 'Enter' &&
            !e.shiftKey &&
            (e.preventDefault(), handleSend())
          }
          placeholder="Tulis pesan..."
          className="flex-1 px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
        </button>
      </div>
    </div>
  );
}
