import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalProps {
  logs: LogEntry[];
  isRunning: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({ logs, isRunning }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] rounded-lg border border-slate-700 font-mono text-sm shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-black">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
        </div>
        <div className="text-slate-400 text-xs">build-output — bash</div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto terminal-scroll space-y-1">
        {logs.length === 0 && (
          <div className="text-slate-500 italic">Waiting for build task...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex">
            <span className="text-slate-500 mr-3 select-none">[{log.timestamp}]</span>
            <span className={`${
              log.level === 'error' ? 'text-red-400 font-bold' :
              log.level === 'warn' ? 'text-yellow-400' :
              log.level === 'success' ? 'text-green-400 font-bold' :
              'text-slate-300'
            }`}>
              {log.level === 'info' && '> '}
              {log.message}
            </span>
          </div>
        ))}
        {isRunning && (
          <div className="animate-pulse text-android">_</div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};