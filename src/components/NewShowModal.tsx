'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, Tv, Check } from 'lucide-react';
import { CommercialShow } from '@/types/timeline';
import { BroadcastWeekdayPicker } from '@/components/BroadcastWeekdayPicker';

interface NewShowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateShow: (show: CommercialShow) => void;
}

export function NewShowModal({ isOpen, onClose, onCreateShow }: NewShowModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [channel, setChannel] = useState('Faith World TV');
  const [broadcastSchedule, setBroadcastSchedule] = useState('Wednesdays 22:00 GMT — Faith World TV');
  const [broadcastWeekdays, setBroadcastWeekdays] = useState<number[]>([3]);
  const [breakCount, setBreakCount] = useState(3);
  const [color, setColor] = useState<'emerald' | 'amber' | 'cyan' | 'purple' | 'rose' | 'indigo'>('emerald');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (broadcastWeekdays.length === 0) return;

    const newShow: CommercialShow = {
      id: `show-${Date.now()}`,
      title: title.trim(),
      code: code.trim().toUpperCase() || title.substring(0, 4).toUpperCase(),
      channel: channel.trim() || 'Broadcast TV',
      broadcastSchedule: broadcastSchedule.trim() || 'Weekly',
      broadcastWeekdays,
      breakCount: Number(breakCount) || 3,
      color,
      description: description.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onCreateShow(newShow);
    onClose();

    // Reset
    setTitle('');
    setCode('');
    setDescription('');
    setBroadcastWeekdays([3]);
    setBroadcastSchedule('Wednesdays 22:00 GMT — Faith World TV');
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="new-show-modal-title"
      className="backdrop:bg-black/80 backdrop:backdrop-blur-sm bg-transparent p-0 m-auto max-w-md w-full focus:outline-none overscroll-contain"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 text-zinc-100 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h2 id="new-show-modal-title" className="text-sm font-bold text-zinc-100">
                Add New TV Show
              </h2>
              <p className="text-[11px] text-zinc-400">
                Create a show and set the number of commercial breaks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Show title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ireland West Music TV"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-semibold"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Show code / abbreviation
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. IWMTV"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Number of commercial breaks *
              </label>
              <select
                value={breakCount}
                onChange={(e) => setBreakCount(parseInt(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value={1}>1 break</option>
                <option value={2}>2 breaks</option>
                <option value={3}>3 breaks (e.g. Ireland West Music TV)</option>
                <option value={4}>4 breaks</option>
                <option value={5}>5 breaks</option>
                <option value={6}>6 breaks</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Channel / distribution
            </label>
            <input
              type="text"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="e.g. Faith World TV"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Broadcast days (TX on timeline) *
            </label>
            <BroadcastWeekdayPicker value={broadcastWeekdays} onChange={setBroadcastWeekdays} />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Air time / slot (display text)
            </label>
            <input
              type="text"
              value={broadcastSchedule}
              onChange={(e) => setBroadcastSchedule(e.target.value)}
              placeholder="e.g. Wednesdays 22:00 GMT — Faith World TV"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Show colour marker
            </label>
            <div className="flex items-center space-x-2 pt-1">
              {(['emerald', 'amber', 'cyan', 'purple', 'rose', 'indigo'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white shadow-lg' : 'opacity-60 hover:opacity-100'
                  } ${
                    c === 'emerald'
                      ? 'bg-emerald-500'
                      : c === 'amber'
                      ? 'bg-amber-500'
                      : c === 'cyan'
                      ? 'bg-cyan-500'
                      : c === 'purple'
                      ? 'bg-purple-500'
                      : c === 'rose'
                      ? 'bg-rose-500'
                      : 'bg-indigo-500'
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Show description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Music format, regional slot..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none h-16"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Create show</span>
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

