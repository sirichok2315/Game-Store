'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GameItem } from '@/types';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [cartItems, setCartItems] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // โหลดสินค้าจาก MySQL ตาม ID ในตะกร้า
  // ==========================================

  const loadCartItems = async () => {
    try {
      setLoading(true);

      // ------------------------------------------
      // 1. อ่าน ID จาก LocalStorage
      // ------------------------------------------

      const storedCart = JSON.parse(
        localStorage.getItem('cartItems') || '[]'
      );

      if (!Array.isArray(storedCart) || storedCart.length === 0) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      // ------------------------------------------
      // 2. รองรับข้อมูลเก่า
      // ถ้าเคยเก็บเป็น Object ให้ดึงเฉพาะ ID
      // ------------------------------------------

      const cartIds: string[] = storedCart
        .map((item: unknown) => {
          // ข้อมูลใหม่
          if (typeof item === 'string') {
            return item;
          }

          // ข้อมูลเก่า
          if (
            typeof item === 'object' &&
            item !== null &&
            'id' in item &&
            typeof (item as { id?: unknown }).id === 'string'
          ) {
            return (item as { id: string }).id;
          }

          return null;
        })
        .filter(
          (id): id is string =>
            typeof id === 'string'
        );

      // ถ้าไม่มี ID
      if (cartIds.length === 0) {
        localStorage.removeItem('cartItems');
        setCartItems([]);
        setLoading(false);
        return;
      }

      // ------------------------------------------
      // 3. ดึงสินค้าทั้งหมดจาก MySQL
      // ------------------------------------------

      const response = await fetch('/api/items', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(
          'ไม่สามารถโหลดข้อมูลสินค้าได้'
        );
      }

      const allItems: GameItem[] =
        await response.json();

      // ------------------------------------------
      // 4. เอาเฉพาะสินค้าที่อยู่ในตะกร้า
      // ------------------------------------------

      const matchedItems = cartIds
        .map((id) =>
          allItems.find(
            (item) => item.id === id
          )
        )
        .filter(
          (item): item is GameItem =>
            Boolean(item)
        );

      // ------------------------------------------
      // 5. ถ้าสินค้าบางรายการถูกลบจากตลาดแล้ว
      // เอา ID ที่ไม่มีอยู่ออกด้วย
      // ------------------------------------------

      const validIds = matchedItems.map(
        (item) => item.id
      );

      localStorage.setItem(
        'cartItems',
        JSON.stringify(validIds)
      );

      setCartItems(matchedItems);
    } catch (error) {
      console.error(
        'Load cart error:',
        error
      );

      setCartItems([]);

      alert(
        '❌ ไม่สามารถโหลดข้อมูลตะกร้าได้'
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // โหลดตะกร้าเมื่อเปิดหน้า
  // ==========================================

  useEffect(() => {
    loadCartItems();
  }, []);

  // ==========================================
  // ลบสินค้าออกจากตะกร้า
  // ==========================================

  const handleRemove = (id: string) => {
    const updatedCart =
      cartItems.filter(
        (item) => item.id !== id
      );

    setCartItems(updatedCart);

    // เก็บเฉพาะ ID
    const updatedIds =
      updatedCart.map(
        (item) => item.id
      );

    localStorage.setItem(
      'cartItems',
      JSON.stringify(updatedIds)
    );

    // อัปเดต Navbar
    window.dispatchEvent(
      new Event('storage')
    );
  };

  // ==========================================
  // คำนวณราคารวม
  // ==========================================

  const totalPrice =
    cartItems.reduce(
      (sum, item) =>
        sum + Number(item.price || 0),
      0
    );

  // ==========================================
  // ชำระเงิน
  // ==========================================

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      return;
    }

    // ------------------------------------------
    // ตรวจสอบ Login
    // ------------------------------------------

    if (
      !session ||
      !session.user?.email
    ) {
      alert(
        '⚠️ กรุณาเข้าสู่ระบบก่อนทำการชำระเงิน'
      );

      return;
    }

    const userEmail =
      session.user.email.trim();

    const userName =
      session.user.name?.trim() || '';

    // ------------------------------------------
    // ดึงยอดเงิน
    // ------------------------------------------

    const balances = JSON.parse(
      localStorage.getItem(
        'userBalances'
      ) || '{}'
    );

    // รองรับยอดเงินเก่าที่ใช้ชื่อ
    const currentBalance =
      Number(
        balances[userEmail] ??
        balances[userName] ??
        0
      );

    // ------------------------------------------
    // ตรวจสอบเงิน
    // ------------------------------------------

    if (
      currentBalance <
      totalPrice
    ) {
      alert(
        `❌ ยอดเงินคงเหลือไม่พอ!\n` +
        `(คุณมีอยู่ ฿${currentBalance.toLocaleString('th-TH')} / ` +
        `ต้องใช้ ฿${totalPrice.toLocaleString('th-TH')})\n` +
        `กรุณาเติมเงินก่อนทำรายการ`
      );

      return;
    }

    // ------------------------------------------
    // ยืนยันการซื้อ
    // ------------------------------------------

    const confirmed = confirm(
      `ยืนยันการชำระเงินยอดรวม ฿${totalPrice.toLocaleString(
        'th-TH'
      )} ใช่หรือไม่?`
    );

    if (!confirmed) {
      return;
    }

    try {
      // ==========================================
      // 1. บันทึกประวัติการซื้อเข้า MySQL
      // ==========================================

      for (
        const item of cartItems
      ) {
        const response =
          await fetch(
            '/api/purchases',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                itemId: item.id,

                // ใช้ email เป็นตัวระบุบัญชี
                buyerName: userEmail,

                gameName:
                  item.gameName,

                title:
                  item.title,

                price:
                  Number(
                    item.price || 0
                  ),

                description:
                  item.description,

                gameUsername:
                  item.gameUsername,

                gamePassword:
                  item.gamePassword,

                imageUrl:
                  item.imageUrl,

                sellerName:
                  item.sellerName,
              }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              'ไม่สามารถบันทึกประวัติการซื้อได้'
          );
        }
      }

      // ==========================================
      // 2. หักเงินของผู้ซื้อ
      // ==========================================

      const newBalance =
        currentBalance -
        totalPrice;

      balances[userEmail] =
        newBalance;

      localStorage.setItem(
        'userBalances',
        JSON.stringify(
          balances
        )
      );

      // ==========================================
      // 3. ลบสินค้าออกจาก MySQL
      // ==========================================

      for (
        const item of cartItems
      ) {
        const response =
          await fetch(
            `/api/items?id=${encodeURIComponent(
              item.id
            )}`,
            {
              method: 'DELETE',
            }
          );

        if (!response.ok) {
          throw new Error(
            'ไม่สามารถนำสินค้าออกจากตลาดได้'
          );
        }
      }

      // ==========================================
      // 4. ล้างตะกร้า
      // ==========================================

      localStorage.removeItem(
        'cartItems'
      );

      setCartItems([]);

      // ==========================================
      // 5. อัปเดต Navbar
      // ==========================================

      window.dispatchEvent(
        new Event('storage')
      );

      // ==========================================
      // 6. แจ้งสำเร็จ
      // ==========================================

      alert(
        '🎉 ชำระเงินสำเร็จ! หักเงิน ฿' +
          totalPrice.toLocaleString(
            'th-TH'
          ) +
          ' เรียบร้อย'
      );

      // ==========================================
      // 7. ไปหน้าประวัติการซื้อ
      // ==========================================

      router.push(
        '/purchases'
      );
    } catch (error) {
      console.error(
        'Checkout error:',
        error
      );

      alert(
        '❌ เกิดข้อผิดพลาดในการชำระเงิน\n' +
          'กรุณาลองใหม่อีกครั้ง'
      );
    }
  };

  // ==========================================
  // Loading
  // ==========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
          <p className="text-gray-500">
            ⏳ กำลังโหลดตะกร้า...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // หน้า Cart
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* ======================================
            หัวข้อ
        ======================================= */}

        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          🛒 ตะกร้าสินค้าของคุณ (
          {cartItems.length} รายการ)
        </h1>

        {/* ======================================
            ไม่มีสินค้า
        ======================================= */}

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">

            <p className="text-gray-500 mb-4">
              ยังไม่มีรหัสเกมในตะกร้าของคุณ
            </p>

            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              เลือกซื้อรหัสเกมหน้าแรก
            </Link>

          </div>
        ) : (

          /* ======================================
             มีสินค้า
          ======================================= */

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* ====================================
                ฝั่งซ้าย
            ===================================== */}

            <div className="md:col-span-2 space-y-4">

              {cartItems.map(
                (item) => (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center"
                  >

                    {/* รูปสินค้า */}

                    <img
                      src={
                        item.imageUrl
                      }
                      alt={
                        item.title
                      }
                      className="w-24 h-20 object-cover rounded-lg bg-gray-100"
                    />

                    {/* รายละเอียด */}

                    <div className="flex-1">

                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                        {
                          item.gameName
                        }
                      </span>

                      <h3 className="font-bold text-gray-800 mt-1 line-clamp-1">
                        {
                          item.title
                        }
                      </h3>

                      <p className="text-gray-500 text-xs mt-0.5">
                        ผู้ขาย:{' '}
                        {
                          item.sellerName
                        }
                      </p>

                      <p className="text-green-600 font-bold mt-1">
                        ฿
                        {Number(
                          item.price ||
                            0
                        ).toLocaleString(
                          'th-TH'
                        )}
                      </p>

                    </div>

                    {/* ลบ */}

                    <button
                      onClick={() =>
                        handleRemove(
                          item.id
                        )
                      }
                      className="text-red-500 hover:text-red-700 text-sm font-semibold px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition"
                    >
                      ลบ
                    </button>

                  </div>
                )
              )}

            </div>

            {/* ====================================
                ฝั่งขวา
            ===================================== */}

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">

              <h3 className="font-bold text-gray-800 text-lg mb-4 border-b pb-2">
                สรุปคำสั่งซื้อ
              </h3>

              <div className="flex justify-between text-gray-600 mb-2 text-sm">
                <span>
                  จำนวนสินค้าทั้งหมด
                </span>

                <span>
                  {cartItems.length}{' '}
                  รายการ
                </span>
              </div>

              <div className="flex justify-between text-lg font-bold text-gray-800 border-t pt-3 mb-6">

                <span>
                  ยอดรวมทั้งสิ้น
                </span>

                <span className="text-green-600">
                  ฿
                  {totalPrice.toLocaleString(
                    'th-TH'
                  )}
                </span>

              </div>

              <button
                onClick={
                  handleCheckout
                }
                className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition shadow"
              >
                ยืนยันชำระเงิน
              </button>

            </div>

          </div>
        )}
      </div>
    </main>
  );
}