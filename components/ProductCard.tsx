'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { GameItem } from '@/types';

interface ProductCardProps {
  item: GameItem;
  onAddToCart: (item: GameItem) => void;
  onDelete: (id: string, sellerName: string) => void;
  onEdit: (item: GameItem) => void;
}

export default function ProductCard({
  item,
  onAddToCart,
  onDelete,
  onEdit,
}: ProductCardProps) {
  const { data: session } = useSession();

  // ตรวจสอบว่าเป็นเจ้าของสินค้า
  const currentName = session?.user?.name
    ? session.user.name.trim()
    : '';

  const seller = item.sellerName
    ? item.sellerName.trim()
    : '';

  const isOwner =
    currentName !== '' &&
    currentName === seller;

  return (
    <div
      style={{
        backgroundColor: '#421765',
        borderColor: '#A78BFA',
      }}
      className="
        group
        flex
        flex-col
        justify-between
        overflow-hidden
        rounded-2xl
        border-2
        shadow-lg
        shadow-purple-950/30
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-2xl
        hover:shadow-purple-900/40
      "
    >
      {/* =========================================
          รูปสินค้า
         ========================================= */}

      <div
        className="
          relative
          h-52
          w-full
          overflow-hidden
          bg-purple-950
        "
      >
        <img
          src={item.imageUrl}
          alt={item.title}
          className="
            h-full
            w-full
            object-cover
            transition-transform
            duration-500
            group-hover:scale-105
          "
        />

        {/* เงาบนรูป */}
        <div
          className="
            absolute
            inset-0
            bg-linear-to-t
            from-black/50
            via-transparent
            to-transparent
          "
        />

        {/* ชื่อเกม */}
        <span
          className="
            absolute
            left-3
            top-3
            rounded-full
            bg-purple-600
            px-3
            py-1
            text-xs
            font-bold
            text-white
            shadow-lg
          "
        >
          {item.gameName}
        </span>
      </div>

      {/* =========================================
          ข้อมูลสินค้า
         ========================================= */}

      <div className="flex-1 p-5">

        {/* ชื่อสินค้า */}
        <h3
          className="
            line-clamp-1
            text-lg
            font-bold
            text-white
            transition-colors
            group-hover:text-purple-200
          "
        >
          {item.title}
        </h3>

        {/* รายละเอียด */}
        <p
          className="
            mt-1
            min-h-10
            line-clamp-2
            text-sm
            leading-relaxed
            text-purple-200
          "
        >
          {item.description || 'ไม่มีรายละเอียดสินค้า'}
        </p>

        {/* ผู้ขาย */}
        <div
          className="
            mt-4
            flex
            items-center
            justify-between
            border-t
            border-purple-300/20
            pt-3
          "
        >
          <span
            className="
              text-xs
              text-purple-300
            "
          >
            ผู้ขาย
          </span>

          <span
            className="
              max-w-40
              truncate
              text-xs
              font-semibold
              text-white
            "
          >
            {item.sellerName}
          </span>
        </div>
      </div>

      {/* =========================================
          ราคา + ปุ่ม
         ========================================= */}

      <div
        className="
          flex
          items-end
          justify-between
          gap-3
          px-5
          pb-5
        "
      >
        {/* ราคา */}
        <div>
          <p
            className="
              mb-0.5
              text-xs
              text-purple-300
            "
          >
            ราคา
          </p>

          <span
            className="
              text-xl
              font-extrabold
              text-green-400
            "
          >
            ฿
            {Number(item.price).toLocaleString('th-TH')}
          </span>
        </div>

        {/* =====================================
            เจ้าของสินค้า
           ===================================== */}

        {isOwner ? (
          <div className="flex gap-2">

            {/* แก้ไข */}
            <button
              onClick={() => onEdit(item)}
              className="
                rounded-lg
                bg-purple-500
                px-3
                py-2
                text-xs
                font-semibold
                text-white
                shadow-md
                transition
                hover:bg-purple-400
                hover:-translate-y-0.5
              "
            >
              ✏️ แก้ไข
            </button>

            {/* ลบ */}
            <button
              onClick={() =>
                onDelete(
                  item.id,
                  item.sellerName
                )
              }
              className="
                rounded-lg
                bg-red-500
                px-3
                py-2
                text-xs
                font-semibold
                text-white
                shadow-md
                transition
                hover:bg-red-400
                hover:-translate-y-0.5
              "
            >
              🗑️ ลบ
            </button>

          </div>
        ) : (

          /* =====================================
             ลูกค้าทั่วไป
             ===================================== */

          <button
            onClick={() => onAddToCart(item)}
            className="
              rounded-lg
              bg-purple-500
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              shadow-md
              transition
              hover:bg-purple-400
              hover:-translate-y-0.5
              hover:shadow-lg
              hover:shadow-purple-400/30
            "
          >
            🛒 ใส่ตะกร้า
          </button>

        )}
      </div>
    </div>
  );
}