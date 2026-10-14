
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { GameItem } from '@/types';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [cartItems, setCartItems] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // โหลดตะกร้าจากฐานข้อมูล
  const loadCartItems = useCallback(async () => {
    if (status === 'loading') return;

    if (!session?.user?.email) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/cart', {
        method: 'GET',
        cache: 'no-store',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'ไม่สามารถโหลดตะกร้าได้');
      }

      setCartItems(Array.isArray(result.items) ? result.items : []);
    } catch (error) {
      console.error('Load cart error:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'ไม่สามารถโหลดตะกร้าได้'
      );
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email, status]);

  useEffect(() => {
    void loadCartItems();
  }, [loadCartItems]);

  // ลบสินค้าออกจากตะกร้า
  const handleRemove = async (id: string) => {
    if (removingId !== null || isCheckingOut) return;

    try {
      setRemovingId(id);

      const response = await fetch(
        `/api/cart?itemId=${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'ลบสินค้าไม่สำเร็จ');
      }

      setCartItems((previous) =>
        previous.filter((item) => String(item.id) !== id)
      );

      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Remove cart item error:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'ลบสินค้าไม่สำเร็จ'
      );
    } finally {
      setRemovingId(null);
    }
  };

  // คำนวณยอดรวมเพื่อแสดงผลเท่านั้น
  // API ฝั่งเซิร์ฟเวอร์จะคำนวณราคาจริงอีกครั้ง
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0),
    0
  );

  // ชำระเงิน
  const handleCheckout = async () => {
    if (isCheckingOut || removingId !== null || cartItems.length === 0) {
      return;
    }

    if (!session?.user?.email) {
      alert('กรุณาเข้าสู่ระบบก่อนชำระเงิน');
      return;
    }

    const confirmed = window.confirm(
      `ยืนยันชำระเงินยอดรวม ฿${totalPrice.toLocaleString('th-TH')} ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setIsCheckingOut(true);

      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemIds: cartItems.map((item) => String(item.id)),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'ซื้อสินค้าไม่สำเร็จ');
      }

      // ล้างตะกร้าบนหน้าจอเมื่อ API ยืนยันว่าซื้อสำเร็จ
      setCartItems([]);

      // แจ้ง Navbar ให้อัปเดตจำนวนสินค้าและยอดเงิน
      window.dispatchEvent(new Event('cartUpdated'));
      window.dispatchEvent(new Event('balanceUpdated'));

      const remainingBalance =
        result.remainingBalance ?? result.balance;

      const remainingText =
        remainingBalance !== undefined && remainingBalance !== null
          ? `\nยอดเงินคงเหลือ ฿${Number(remainingBalance).toLocaleString('th-TH')} บาท`
          : '';

      alert(
        `ซื้อสินค้าสำเร็จ ฿${Number(result.total).toLocaleString('th-TH')}` +
        remainingText
      );

      router.push('/purchases');
    } catch (error) {
      console.error('Checkout error:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'เกิดข้อผิดพลาดในการซื้อสินค้า'
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  // กำลังโหลดข้อมูล
  if (status === 'loading' || loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto flex max-w-4xl items-center justify-center py-20">
          <p className="text-gray-500">⏳ กำลังโหลดตะกร้า...</p>
        </div>
      </main>
    );
  }

  // ยังไม่ได้เข้าสู่ระบบ
  if (!session?.user?.email) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <h1 className="mb-3 text-2xl font-bold text-gray-800">
            กรุณาเข้าสู่ระบบ
          </h1>

          <p className="mb-5 text-gray-500">
            เข้าสู่ระบบ Google เพื่อดูตะกร้าสินค้าของคุณ
          </p>

          <Link
            href="/"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">
          🛒 ตะกร้าสินค้าของคุณ ({cartItems.length} รายการ)
        </h1>

        {cartItems.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
            <p className="mb-4 text-gray-500">
              ยังไม่มีสินค้าในตะกร้าของคุณ
            </p>

            <Link
              href="/"
              className="inline-block rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700"
            >
              เลือกซื้อรหัสเกมหน้าแรก
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-4 md:col-span-2">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-20 w-24 rounded-lg bg-gray-100 object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-24 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                      ไม่มีรูปภาพ
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      {item.gameName}
                    </span>

                    <h2 className="mt-1 line-clamp-1 font-bold text-gray-800">
                      {item.title}
                    </h2>

                    <p className="mt-0.5 text-xs text-gray-500">
                      ผู้ขาย: {item.sellerName}
                    </p>

                    <p className="mt-1 font-bold text-green-600">
                      ฿{Number(item.price || 0).toLocaleString('th-TH')}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isCheckingOut || removingId !== null}
                    onClick={() => handleRemove(String(item.id))}
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-500 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    {removingId === String(item.id)
                      ? 'กำลังลบ...'
                      : 'ลบ'}
                  </button>
                </div>
              ))}
            </div>

            <aside className="h-fit rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 border-b pb-2 text-lg font-bold text-gray-800">
                สรุปคำสั่งซื้อ
              </h2>

              <div className="mb-2 flex justify-between text-sm text-gray-600">
                <span>จำนวนสินค้าทั้งหมด</span>
                <span>{cartItems.length} รายการ</span>
              </div>

              <div className="mb-6 flex justify-between border-t pt-3 text-lg font-bold text-gray-800">
                <span>ยอดรวมทั้งสิ้น</span>
                <span className="text-green-600">
                  ฿{totalPrice.toLocaleString('th-TH')}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={
                  isCheckingOut ||
                  removingId !== null ||
                  cartItems.length === 0
                }
                className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white shadow transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isCheckingOut
                  ? 'กำลังชำระเงิน...'
                  : 'ยืนยันชำระเงิน'}
              </button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
