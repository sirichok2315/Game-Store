'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import type { GameItem } from '@/types';

interface PurchasedItem extends GameItem {
  id: string | number;
  itemId: string;
  buyerName: string;
  purchasedAt: string;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchasedItem[]>([]);
  const [showPassword, setShowPassword] = useState<
    Record<string, boolean>
  >({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user?.email?.trim()) {
      setPurchases([]);
      setErrorMessage('');
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchPurchases() {
      try {
        setLoading(true);
        setErrorMessage('');

        const response = await fetch('/api/purchases', {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || 'ไม่สามารถโหลดประวัติการซื้อได้'
          );
        }

        if (!Array.isArray(data.purchases)) {
          throw new Error(
            'รูปแบบข้อมูลประวัติการซื้อไม่ถูกต้อง'
          );
        }

        setPurchases(data.purchases);
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === 'AbortError'
        ) {
          return;
        }

        console.error('Fetch purchases error:', error);

        setPurchases([]);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'เกิดข้อผิดพลาดในการโหลดประวัติการซื้อ'
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchPurchases();

    return () => controller.abort();
  }, [session, status]);

  const togglePassword = (id: string) => {
    setShowPassword((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToClipboard = async (
    text: string,
    label: string
  ) => {
    if (!text) {
      alert(`ไม่มีข้อมูล ${label} ให้คัดลอก`);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      alert(`คัดลอก ${label} แล้ว`);
    } catch (error) {
      console.error('Clipboard error:', error);
      alert('คัดลอกไม่สำเร็จ กรุณาตรวจสอบสิทธิ์ Clipboard');
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            📦 ประวัติการซื้อและข้อมูลไอดีเกมของคุณ
          </h1>

          <Link
            href="/"
            className="text-sm text-blue-600 hover:underline"
          >
            ← กลับหน้าแรก
          </Link>
        </div>

        {/* กำลังตรวจสอบ Session หรือโหลดข้อมูล */}
        {status === 'loading' || loading ? (
          <div className="rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
            <p className="text-gray-500">
              ⏳ กำลังโหลดประวัติการซื้อ...
            </p>
          </div>
        ) : !session?.user?.email ? (
          /* ยังไม่ได้เข้าสู่ระบบ */
          <div className="rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
            <p className="mb-4 text-gray-500">
              ⚠️ กรุณาเข้าสู่ระบบก่อนดูประวัติการซื้อ
            </p>

            <Link
              href="/"
              className="inline-block rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700"
            >
              กลับหน้าแรก
            </Link>
          </div>
        ) : errorMessage ? (
          /* โหลดข้อมูลไม่สำเร็จ */
          <div className="rounded-xl border border-red-200 bg-white p-12 text-center shadow-sm">
            <p className="mb-4 text-red-600">
              ⚠️ {errorMessage}
            </p>

            <button
              type="button"
              onClick={handleRetry}
              className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : purchases.length === 0 ? (
          /* ยังไม่มีประวัติการซื้อ */
          <div className="rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
            <p className="mb-4 text-gray-500">
              คุณยังไม่มีประวัติการซื้อรหัสเกมในระบบ
            </p>

            <Link
              href="/"
              className="inline-block rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700"
            >
              เลือกซื้อรหัสเกมเลย
            </Link>
          </div>
        ) : (
          /* รายการประวัติการซื้อ */
          <div className="space-y-4">
            {purchases.map((item, index) => {
              const itemKey = String(
                item.itemId || item.id || index
              );

              return (
                <div
                  key={`${itemKey}-${item.purchasedAt || index}`}
                  className="flex flex-col items-start justify-between gap-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm md:flex-row md:items-center"
                >
                  {/* ข้อมูลสินค้า */}
                  <div className="flex min-w-0 items-center gap-4">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title || 'รูปสินค้า'}
                        className="h-20 w-20 shrink-0 rounded-lg border object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border bg-gray-100 text-2xl">
                        🎮
                      </div>
                    )}

                    <div className="min-w-0">
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {item.gameName || 'ไม่ระบุเกม'}
                      </span>

                      <h3 className="mt-1 wrap-break-words text-lg font-bold text-gray-800">
                        {item.title || 'ไม่มีชื่อสินค้า'}
                      </h3>

                      <p className="mt-1 text-xs text-gray-400">
                        ผู้ขาย: {item.sellerName || 'ไม่ระบุ'}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        ซื้อเมื่อ:{' '}
                        {item.purchasedAt
                          ? new Date(
                            item.purchasedAt
                          ).toLocaleString('th-TH')
                          : 'ไม่ระบุวันที่'}
                      </p>

                      <span className="text-sm font-bold text-green-600">
                        ฿
                        {Number(item.price || 0).toLocaleString(
                          'th-TH',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </span>
                    </div>
                  </div>

                  {/* ข้อมูลบัญชีเกม */}
                  <div className="flex w-full min-w-0 flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 md:w-auto md:min-w-70">
                    <span className="text-xs font-bold text-amber-800">
                      🔐 ข้อมูลเข้าสู่ระบบเกมของคุณ
                    </span>

                    {/* Username */}
                    <div className="flex items-center justify-between gap-3 rounded border bg-white px-3 py-2 text-xs">
                      <span className="min-w-0 break-all text-gray-600">
                        User:{' '}
                        <strong className="text-gray-800">
                          {item.gameUsername || 'ไม่ได้ระบุ'}
                        </strong>
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            item.gameUsername || '',
                            'Username'
                          )
                        }
                        className="shrink-0 font-semibold text-blue-600 hover:underline"
                      >
                        คัดลอก
                      </button>
                    </div>

                    {/* Password */}
                    <div className="flex items-center justify-between gap-3 rounded border bg-white px-3 py-2 text-xs">
                      <span className="min-w-0 break-all text-gray-600">
                        Pass:{' '}
                        <strong className="text-gray-800">
                          {showPassword[itemKey]
                            ? item.gamePassword || 'ไม่ได้ระบุ'
                            : '••••••••'}
                        </strong>
                      </span>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            togglePassword(itemKey)
                          }
                          className="text-gray-500 underline hover:text-gray-700"
                        >
                          {showPassword[itemKey]
                            ? 'ซ่อน'
                            : 'แสดง'}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              item.gamePassword || '',
                              'Password'
                            )
                          }
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          คัดลอก
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}