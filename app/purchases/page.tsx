'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GameItem } from '@/types';
import { useSession } from 'next-auth/react';

interface PurchasedItem extends GameItem {
  itemId: string;
  buyerName: string;
  purchasedAt: string;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchasedItem[]>([]);
  const [showPassword, setShowPassword] = useState<{
    [key: string]: boolean;
  }>({});

  const [loading, setLoading] = useState(true);

  const { data: session, status } = useSession();

  // โหลดประวัติการซื้อจาก MySQL
  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    // ตรวจสอบว่ามี Login และมี email
    const userEmail = session?.user?.email?.trim();

    if (!userEmail) {
      setPurchases([]);
      setLoading(false);
      return;
    }

    const fetchPurchases = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/purchases?buyerName=${encodeURIComponent(userEmail)}`
        );

        if (!response.ok) {
          throw new Error(
            'ไม่สามารถดึงประวัติการซื้อได้'
          );
        }

        const data = await response.json();

        setPurchases(data);
      } catch (error) {
        console.error(
          'Fetch purchases error:',
          error
        );

        alert(
          '❌ ไม่สามารถโหลดประวัติการซื้อได้'
        );

        setPurchases([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [session, status]);

  // แสดง / ซ่อน Password
  const togglePassword = (id: string) => {
    setShowPassword((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // คัดลอกข้อมูล
  const copyToClipboard = (
    text: string,
    label: string
  ) => {
    navigator.clipboard.writeText(text);

    alert(`📋 คัดลอก ${label} แล้ว!`);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">

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

        {/* กำลังโหลด */}
        {loading ? (

          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">

            <p className="text-gray-500">
              ⏳ กำลังโหลดประวัติการซื้อ...
            </p>

          </div>

        ) : !session?.user?.email ? (

          /* ยังไม่ได้ Login */
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">

            <p className="text-gray-500 mb-4">
              ⚠️ กรุณาเข้าสู่ระบบก่อนดูประวัติการซื้อ
            </p>

            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              กลับหน้าแรก
            </Link>

          </div>

        ) : purchases.length === 0 ? (

          /* ไม่มีประวัติ */
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">

            <p className="text-gray-500 mb-4">
              คุณยังไม่มีประวัติการซื้อรหัสเกมในระบบ
            </p>

            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              เลือกซื้อรหัสเกมเลย
            </Link>

          </div>

        ) : (

          /* รายการประวัติการซื้อ */
          <div className="space-y-4">

            {purchases.map((item) => (

              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
              >

                {/* ข้อมูลสินค้าฝั่งซ้าย */}
                <div className="flex gap-4 items-center">

                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-20 h-20 object-cover rounded-lg border shrink-0"
                  />

                  <div>

                    <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-medium">
                      {item.gameName}
                    </span>

                    <h3 className="font-bold text-gray-800 text-lg mt-1">
                      {item.title}
                    </h3>

                    <p className="text-xs text-gray-400 mt-1">
                      ผู้ขาย: {item.sellerName}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      ซื้อเมื่อ:{' '}
                      {new Date(
                        item.purchasedAt
                      ).toLocaleString('th-TH')}
                    </p>

                    <span className="text-green-600 font-bold text-sm">
                      ฿{Number(item.price).toLocaleString()}
                    </span>

                  </div>

                </div>

                {/* กล่องข้อมูล Username / Password */}
                <div className="w-full md:w-auto bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-2 min-w-70">

                  <span className="text-xs font-bold text-amber-800">
                    🔐 ข้อมูลเข้าสู่ระบบ (รหัสของคุณ)
                  </span>

                  {/* Username */}
                  <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded border text-xs">

                    <span className="text-gray-600">
                      User:{' '}

                      <strong className="text-gray-800">
                        {item.gameUsername ||
                          'ไม่ได้ระบุ'}
                      </strong>
                    </span>

                    <button
                      onClick={() =>
                        copyToClipboard(
                          item.gameUsername || '',
                          'Username'
                        )
                      }
                      className="text-blue-600 hover:underline font-semibold ml-2"
                    >
                      คัดลอก
                    </button>

                  </div>

                  {/* Password */}
                  <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded border text-xs">

                    <span className="text-gray-600">
                      Pass:{' '}

                      <strong className="text-gray-800 ml-1">
                        {showPassword[item.id]
                          ? item.gamePassword ||
                          'ไม่ได้ระบุ'
                          : '••••••••'}
                      </strong>
                    </span>

                    <div className="flex gap-2">

                      <button
                        onClick={() =>
                          togglePassword(item.id)
                        }
                        className="text-gray-500 hover:text-gray-700 underline"
                      >
                        {showPassword[item.id]
                          ? 'ซ่อน'
                          : 'แสดง'}
                      </button>

                      <button
                        onClick={() =>
                          copyToClipboard(
                            item.gamePassword || '',
                            'Password'
                          )
                        }
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        คัดลอก
                      </button>

                    </div>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>
    </main>
  );
}