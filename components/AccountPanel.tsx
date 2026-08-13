'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Cloud, CloudOff, LogOut, Mail, X } from 'lucide-react';
import { useSync } from './SyncProvider';
import { PixelButton } from './ui/PixelButton';

export function AccountPanel() {
  const { status, email, sendMagicLink, signInWithGoogle, signOut } = useSync();
  const [open, setOpen] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSend() {
    const trimmed = inputEmail.trim();
    if (!trimmed) return;
    setSending(true);
    setError(null);
    const res = await sendMagicLink(trimmed);
    setSending(false);
    if (res.error) setError(res.error);
    else setSent(true);
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    const res = await signInWithGoogle();
    // On success the browser navigates away to Google, so this only resolves on failure.
    setGoogleLoading(false);
    if (res.error) setError(res.error);
  }

  const StatusIcon = email ? Cloud : CloudOff;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-400 hover:border-zinc-500"
        title="클라우드 동기화"
      >
        <StatusIcon className="h-3.5 w-3.5" />
        {email ? email.split('@')[0] : '동기화'}
      </button>

      {/* Portaled to <body> so `fixed` positions relative to the viewport, not Hud's backdrop-blur containing block. */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                onClick={() => setOpen(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-xs rounded border border-zinc-700 bg-zinc-950 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-300">클라우드 동기화</div>
                    <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {status === 'disabled' && (
                    <div className="text-xs text-zinc-500">
                      아직 클라우드 동기화가 설정되지 않았습니다. 지금은 이 기기의 브라우저에만 진행 상황이 저장됩니다.
                    </div>
                  )}

                  {status !== 'disabled' && !email && (
                    <div className="flex flex-col gap-2">
                      <p className="text-[11px] text-zinc-400">
                        로그인하면 집/사무실 기기 사이에 진행 상황이 자동으로 동기화됩니다.
                      </p>

                      <PixelButton
                        variant="ghost"
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading}
                        className="flex items-center justify-center gap-2"
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-black text-zinc-900">
                          G
                        </span>
                        {googleLoading ? '이동 중...' : 'Google로 계속하기'}
                      </PixelButton>

                      <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                        <div className="h-px flex-1 bg-zinc-800" />
                        또는 이메일 매직 링크
                        <div className="h-px flex-1 bg-zinc-800" />
                      </div>

                      {sent ? (
                        <div className="rounded border border-emerald-800 bg-emerald-950/50 p-2 text-[11px] text-emerald-300">
                          {inputEmail} 로 로그인 링크를 보냈습니다. 메일함을 확인해주세요.
                        </div>
                      ) : (
                        <>
                          <input
                            value={inputEmail}
                            onChange={(e) => setInputEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            type="email"
                            placeholder="you@example.com"
                            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
                          />
                          {error && <div className="text-[11px] text-rose-400">{error}</div>}
                          <PixelButton
                            onClick={handleSend}
                            disabled={sending}
                            className="flex items-center justify-center gap-1"
                          >
                            <Mail className="h-4 w-4" /> {sending ? '전송 중...' : '로그인 링크 받기'}
                          </PixelButton>
                        </>
                      )}
                    </div>
                  )}

                  {email && (
                    <div className="flex flex-col gap-3">
                      <div className="text-xs text-zinc-300">{email} 로 로그인됨</div>
                      <div className="text-[11px] text-zinc-500">
                        {status === 'syncing' ? '동기화 중...' : '모든 기기와 동기화됨'}
                      </div>
                      <PixelButton variant="ghost" onClick={signOut} className="flex items-center justify-center gap-1">
                        <LogOut className="h-4 w-4" /> 로그아웃
                      </PixelButton>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
