'use client';

import React from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">

        <div className="mb-6">
          <span className="text-4xl">🔐</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">เข้าสู่ระบบ GameStore</h1>
          <p className="text-gray-500 text-sm mt-1">เข้าสู่ระบบด้วยบัญชี Google เพื่อใช้งานระบบ</p>
        </div>

        {/* ปุ่มล็อกอินด้วย Google ของจริง */}
        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-50 transition shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.32 7.24 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.8 0 12s.43 3.9 1.19 5.42l4.09-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.24 0 3.17 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          เข้าสู่ระบบด้วย Google
        </button>

        <div className="text-center mt-6 pt-6 border-t border-gray-100">
          <Link href="/" className="text-sm text-gray-500 hover:underline">
            ← กลับสู่หน้าแรกโดยไม่เข้าสู่ระบบ
          </Link>
        </div>

      </div>
    </main>
  );
}