'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { GameItem } from '@/types';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function ItemDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();

  const [item, setItem] = useState<GameItem | null>(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isInCart, setIsInCart] = useState(false);

  // ==========================================
  // โหลดข้อมูลสินค้าจาก MySQL
  // ==========================================
  useEffect(() => {
    if (!id) return;

    const fetchItem = async () => {
      try {
        setLoading(true);

        const response = await fetch('/api/items');

        if (!response.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลสินค้าได้');
        }

        const data: GameItem[] = await response.json();

        // หา item ตาม id
        const target = data.find(
          (item) => String(item.id) === String(id)
        );

        if (target) {
          setItem(target);

          // แปลง imageUrls กรณี MySQL ส่งมาเป็น string
          let images: string[] = [];

          if (Array.isArray(target.imageUrls)) {
            images = target.imageUrls;
          } else if (
            typeof target.imageUrls === 'string'
          ) {
            try {
              images = JSON.parse(target.imageUrls);
            } catch {
              images = [];
            }
          }

          const firstImage =
            images.length > 0
              ? images[0]
              : target.imageUrl;

          setSelectedImage(firstImage);
        } else {
          setItem(null);
        }
      } catch (error) {
        console.error(
          'Fetch item error:',
          error
        );

        setItem(null);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  // ==========================================
  // ตรวจสอบว่าสินค้านี้อยู่ในตะกร้าหรือไม่
  // ==========================================
  useEffect(() => {
    if (!item) return;

    const storedCart =
      localStorage.getItem('cartItems');

    if (!storedCart) {
      setIsInCart(false);
      return;
    }

    try {
      const parsedCart = JSON.parse(storedCart);

      // รองรับทั้งข้อมูลเก่าแบบ GameItem
      // และข้อมูลใหม่แบบ ID
      const cartIds: string[] = Array.isArray(parsedCart)
        ? parsedCart.map((cartItem: any) => {
            if (
              typeof cartItem === 'object' &&
              cartItem !== null
            ) {
              return String(cartItem.id);
            }

            return String(cartItem);
          })
        : [];

      const exists = cartIds.some(
        (cartId) =>
          String(cartId) === String(item.id)
      );

      setIsInCart(exists);

      // แปลงตะกร้าเก่าให้เหลือเฉพาะ ID
      // และป้องกันสินค้าซ้ำ
      const uniqueCartIds = [
        ...new Set(cartIds)
      ];

      localStorage.setItem(
        'cartItems',
        JSON.stringify(uniqueCartIds)
      );

    } catch {
      setIsInCart(false);
    }
  }, [item]);

  // ==========================================
  // เพิ่ม / ยกเลิกสินค้าในตะกร้า
  // ==========================================
  const handleCartToggle = (
    itemToToggle: GameItem
  ) => {
    const storedCart =
      localStorage.getItem('cartItems');

    let cartIds: string[] = [];

    try {
      const parsedCart = storedCart
        ? JSON.parse(storedCart)
        : [];

      // รองรับข้อมูลเก่าที่เป็น GameItem
      cartIds = Array.isArray(parsedCart)
        ? parsedCart.map((cartItem: any) => {
            if (
              typeof cartItem === 'object' &&
              cartItem !== null
            ) {
              return String(cartItem.id);
            }

            return String(cartItem);
          })
        : [];

    } catch {
      cartIds = [];
    }

    const itemId =
      String(itemToToggle.id);

    const isAlreadyInCart =
      cartIds.some(
        (cartId) =>
          String(cartId) === itemId
      );

    let updatedCartIds: string[];

    // ==========================================
    // ถ้ามีอยู่แล้ว → ลบออก
    // ==========================================
    if (isAlreadyInCart) {
      updatedCartIds = cartIds.filter(
        (cartId) =>
          String(cartId) !== itemId
      );

      setIsInCart(false);

    } else {

      // ==========================================
      // ถ้ายังไม่มี → เพิ่มเข้า
      // ==========================================
      updatedCartIds = [
        ...cartIds,
        itemId
      ];

      setIsInCart(true);
    }

    // ป้องกันสินค้าซ้ำ
    updatedCartIds = [
      ...new Set(updatedCartIds)
    ];

    localStorage.setItem(
      'cartItems',
      JSON.stringify(updatedCartIds)
    );

    // แจ้งหน้าอื่นให้รู้ว่าตะกร้าเปลี่ยน
    window.dispatchEvent(
      new Event('storage')
    );
  };

  // ==========================================
  // กำลังโหลด
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">

        <p className="text-gray-500">
          ⏳ กำลังโหลดข้อมูลสินค้า...
        </p>

      </div>
    );
  }

  // ==========================================
  // ไม่พบสินค้า
  // ==========================================
  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">

        <p className="text-gray-500">
          ไม่พบข้อมูลสินค้า หรือสินค้านี้อาจถูกขายไปแล้ว
        </p>

        <Link
          href="/"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          กลับหน้าแรก
        </Link>

      </div>
    );
  }

  // ==========================================
  // จัดการรูปภาพ
  // ==========================================
  let images: string[] = [];

  if (Array.isArray(item.imageUrls)) {
    images = item.imageUrls;

  } else if (
    typeof item.imageUrls === 'string'
  ) {
    try {
      images = JSON.parse(item.imageUrls);
    } catch {
      images = [];
    }
  }

  if (
    images.length === 0 &&
    item.imageUrl
  ) {
    images = [item.imageUrl];
  }

  // ==========================================
  // แสดงหน้า
  // ==========================================
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">

      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">

        {/* กลับหน้าแรก */}
        <Link
          href="/"
          className="text-sm text-blue-600 hover:underline mb-6 inline-block"
        >
          ← กลับไปหน้าเลือกซื้อ
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* ==========================================
              ฝั่งซ้าย : รูปภาพ
          ========================================== */}

          <div className="space-y-4">

            <div className="w-full h-72 md:h-80 bg-gray-100 rounded-xl overflow-hidden border shadow-inner">

              <img
                src={
                  selectedImage ||
                  item.imageUrl
                }
                alt={item.title}
                className="w-full h-full object-cover"
              />

            </div>

            {/* รูปย่อย */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">

                {images.map(
                  (img, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        setSelectedImage(img)
                      }
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition shrink-0 ${
                        selectedImage === img
                          ? 'border-blue-600 shadow-md'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >

                      <img
                        src={img}
                        alt={`รูปที่ ${index + 1}`}
                        className="w-full h-full object-cover"
                      />

                    </button>
                  )
                )}

              </div>
            )}

          </div>

          {/* ==========================================
              ฝั่งขวา : รายละเอียด
          ========================================== */}

          <div className="flex flex-col justify-between">

            <div>

              {/* เกม */}
              <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-medium">
                {item.gameName}
              </span>

              {/* ชื่อสินค้า */}
              <h1 className="text-2xl font-bold text-gray-800 mt-2">
                {item.title}
              </h1>

              {/* ผู้ขาย */}
              <p className="text-sm text-gray-500 mt-1">

                ผู้ขาย:{' '}

                <span className="font-semibold text-gray-700">
                  {item.sellerName}
                </span>

                {' | '}

                ลงประกาศเมื่อ:{' '}

                {item.createdAt
                  ? String(item.createdAt)
                  : '-'}

              </p>

              {/* ราคา */}
              <div className="my-6">

                <span className="text-3xl font-extrabold text-green-600">
                  ฿
                  {Number(
                    item.price
                  ).toLocaleString('th-TH')}
                </span>

              </div>

              {/* รายละเอียด */}
              <div className="border-t pt-4">

                <h3 className="text-sm font-bold text-gray-700 mb-2">
                  รายละเอียดไอเทม / สกิน:
                </h3>

                <p className="text-gray-600 text-sm whitespace-pre-line bg-gray-50 p-4 rounded-xl border">
                  {item.description ||
                    'ไม่มีรายละเอียด'}
                </p>

              </div>

            </div>

            {/* ==========================================
                ปุ่มซื้อ
            ========================================== */}

            <div className="mt-8 pt-4 border-t">

              {!session ? (

                <button
                  onClick={() =>
                    alert(
                      '⚠️ กรุณาเข้าสู่ระบบก่อนซื้อสินค้า'
                    )
                  }
                  className="w-full bg-gray-400 text-white font-semibold py-3 rounded-xl cursor-not-allowed"
                >
                  🔒 เข้าสู่ระบบเพื่อซื้อ
                </button>

              ) : session.user?.name?.trim() ===
                item.sellerName?.trim() ? (

                <p className="text-center text-xs text-gray-400 bg-gray-50 py-3 rounded-xl border">
                  นี่คือสินค้าของคุณเอง
                </p>

              ) : (

                <button
                  onClick={() =>
                    handleCartToggle(item)
                  }
                  className={`w-full ${
                    isInCart
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white font-semibold py-3 rounded-xl transition shadow`}
                >
                  {isInCart
                    ? '❌ ยกเลิกใส่ตะกร้า'
                    : '🛒 ใส่ตะกร้าสินค้า'}
                </button>

              )}

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}