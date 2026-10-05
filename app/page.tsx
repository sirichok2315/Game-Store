'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GameItem } from '@/types';
import { useSession } from 'next-auth/react';

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  const [items, setItems] = useState<GameItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState('All');
  const [loading, setLoading] = useState(true);
  const [cartIds, setCartIds] = useState<string[]>([]);

  // ==========================================
  // ดึงข้อมูลสินค้าจาก MySQL
  // ==========================================

  const fetchItems = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/items', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(
          'ไม่สามารถดึงข้อมูลสินค้าได้'
        );
      }

      const data = await response.json();

      setItems(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        'Fetch items error:',
        error
      );

      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // ==========================================
  // โหลดตะกร้าจาก LocalStorage
  // เก็บเฉพาะ ID สินค้า
  // รองรับข้อมูลเก่าแบบ Object ด้วย
  // ==========================================

  useEffect(() => {
    try {
      const savedCart = JSON.parse(
        localStorage.getItem(
          'cartItems'
        ) || '[]'
      );

      if (!Array.isArray(savedCart)) {
        setCartIds([]);
        return;
      }

      // ถ้าเป็นตะกร้าแบบใหม่
      // ["id1", "id2", "id3"]
      if (
        savedCart.length === 0 ||
        typeof savedCart[0] === 'string'
      ) {
        setCartIds(
          savedCart.filter(
            (id) =>
              typeof id === 'string'
          )
        );

        return;
      }

      // ถ้าเป็นข้อมูลเก่า
      // [{ id: "...", ... }]
      const oldIds = savedCart
        .map(
          (item: GameItem) =>
            item?.id
        )
        .filter(
          (id): id is string =>
            typeof id === 'string'
        );

      setCartIds(oldIds);

      // แปลงข้อมูลเก่าให้เหลือเฉพาะ ID
      localStorage.setItem(
        'cartItems',
        JSON.stringify(oldIds)
      );
    } catch (error) {
      console.error(
        'Load cart error:',
        error
      );

      setCartIds([]);
    }
  }, []);

  // ==========================================
  // เพิ่ม / เอาออกจากตะกร้า
  // ==========================================

  const handleToggleCart = (
    item: GameItem
  ) => {
    if (!session) {
      alert(
        '⚠️ กรุณาเข้าสู่ระบบด้วย Google ก่อนใช้งานตะกร้าสินค้าครับ'
      );

      return;
    }

    try {
      const savedCart = JSON.parse(
        localStorage.getItem(
          'cartItems'
        ) || '[]'
      );

      const existingCart: string[] =
        Array.isArray(savedCart)
          ? savedCart
              .map((cartItem: unknown) => {
                if (
                  typeof cartItem ===
                  'string'
                ) {
                  return cartItem;
                }

                if (
                  typeof cartItem ===
                    'object' &&
                  cartItem !== null &&
                  'id' in cartItem &&
                  typeof (
                    cartItem as {
                      id?: unknown;
                    }
                  ).id === 'string'
                ) {
                  return (
                    cartItem as {
                      id: string;
                    }
                  ).id;
                }

                return null;
              })
              .filter(
                (
                  id
                ): id is string =>
                  typeof id ===
                  'string'
              )
          : [];

      const isInCart =
        existingCart.includes(
          item.id
        );

      let updatedCart: string[];

      if (isInCart) {
        updatedCart =
          existingCart.filter(
            (id) =>
              id !== item.id
          );

        alert(
          '❌ เอาสินค้าออกจากตะกร้าแล้วครับ'
        );
      } else {
        updatedCart = [
          ...existingCart,
          item.id,
        ];

        alert(
          '🛒 เพิ่มรหัสเกมลงในตะกร้าเรียบร้อยแล้วครับ'
        );
      }

      localStorage.setItem(
        'cartItems',
        JSON.stringify(
          updatedCart
        )
      );

      setCartIds(updatedCart);

      // แจ้ง Navbar
      window.dispatchEvent(
        new Event('storage')
      );
    } catch (error) {
      console.error(
        'Cart error:',
        error
      );

      alert(
        '❌ ไม่สามารถแก้ไขตะกร้าสินค้าได้'
      );
    }
  };

  // ==========================================
  // กรองสินค้า
  // ==========================================

  const filteredItems =
    items.filter((item) => {
      const search =
        searchTerm
          .toLowerCase()
          .trim();

      const title =
        String(
          item.title || ''
        ).toLowerCase();

      const gameName =
        String(
          item.gameName || ''
        ).toLowerCase();

      const sellerName =
        String(
          item.sellerName || ''
        ).toLowerCase();

      const matchesSearch =
        title.includes(search) ||
        gameName.includes(search) ||
        sellerName.includes(search);

      const matchesGame =
        selectedGame === 'All' ||
        item.gameName ===
          selectedGame;

      return (
        matchesSearch &&
        matchesGame
      );
    });

  // ==========================================
  // ลบสินค้า
  // ==========================================

  const handleDeleteItem = async (
    id: string,
    sellerName: string
  ) => {
    const currentName =
      session?.user?.name?.trim() ||
      '';

    const targetSeller =
      sellerName?.trim() || '';

    if (!currentName) {
      alert(
        '⚠️ กรุณาเข้าสู่ระบบก่อนดำเนินการครับ'
      );

      return;
    }

    if (
      currentName !==
      targetSeller
    ) {
      alert(
        '⚠️ คุณไม่มีสิทธิ์ลบสินค้าของผู้อื่นครับ'
      );

      return;
    }

    const confirmed = confirm(
      'คุณต้องการลบประกาศขายสินค้านี้ใช่หรือไม่?'
    );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/items?id=${encodeURIComponent(
            id
          )}`,
          {
            method: 'DELETE',
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            'ไม่สามารถลบสินค้าได้'
        );
      }

      // เอาสินค้าออกจากหน้าจอ
      setItems(
        (prevItems) =>
          prevItems.filter(
            (item) =>
              item.id !== id
          )
      );

      // เอาสินค้าออกจากตะกร้าด้วย
      const updatedCart =
        cartIds.filter(
          (cartId) =>
            cartId !== id
        );

      localStorage.setItem(
        'cartItems',
        JSON.stringify(
          updatedCart
        )
      );

      setCartIds(updatedCart);

      window.dispatchEvent(
        new Event('storage')
      );

      alert(
        '🗑️ ลบประกาศสำเร็จ'
      );
    } catch (error) {
      console.error(
        'Delete item error:',
        error
      );

      alert(
        '❌ ไม่สามารถลบสินค้าได้'
      );
    }
  };

  // ==========================================
  // แก้ไขสินค้า
  // ==========================================

  const handleEdit = (
    item: GameItem
  ) => {
    const currentName =
      session?.user?.name?.trim() ||
      '';

    const targetSeller =
      item.sellerName?.trim() ||
      '';

    if (!currentName) {
      alert(
        '⚠️ กรุณาเข้าสู่ระบบก่อนดำเนินการครับ'
      );

      return;
    }

    if (
      currentName !==
      targetSeller
    ) {
      alert(
        '⚠️ คุณไม่มีสิทธิ์แก้ไขสินค้าของผู้อื่นครับ'
      );

      return;
    }

    router.push(
      `/sell?edit=${encodeURIComponent(
        item.id
      )}`
    );
  };

  // ==========================================
  // Loading
  // ==========================================

  if (loading) {
    return (
      <main
        className="
          min-h-screen
          pastel-background
          flex
          items-center
          justify-center
        "
      >
        <div
          className="
            bg-white
            px-8
            py-5
            rounded-2xl
            shadow-md
            border-2
            border-[#FFCCB8]
            loading-text
          "
        >
          ⏳ กำลังโหลดสินค้า...
        </div>
      </main>
    );
  }

  // ==========================================
  // หน้าเว็บ
  // ==========================================

  return (
    <main
      className="
        min-h-screen
        pastel-background
        pb-12
      "
    >
      <div
        className="
          max-w-6xl
          mx-auto
          px-4
          mt-8
        "
      >
        {/* ======================================
            Banner
        ======================================= */}

        <div
          className="
            pastel-banner
            rounded-2xl
            p-6
            md:p-10
            shadow-lg
            mb-8
          "
        >
          <h2
            className="
              text-2xl
              md:text-3xl
              font-bold
              mb-2
              text-[#5B4545]
            "
          >
            🎮 แหล่งรวมซื้อ-ขายรหัสเกมปลอดภัย
          </h2>

          <p
            className="
              text-[#806666]
              text-sm
              md:text-base
            "
          >
            เลือกซื้อรหัสเกมที่คุณสนใจ
            หรือกดเข้าไปดูรายละเอียดและหยิบใส่ตะกร้าได้เลย
          </p>

          {/* Search / Filter */}

          <div
            className="
              mt-6
              flex
              flex-col
              md:flex-row
              gap-3
            "
          >
            <input
              type="text"
              placeholder="ค้นหาชื่อเกม, หัวข้อประกาศ, หรือผู้ขาย..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              className="
                flex-1
                pastel-search
              "
            />

            <select
              value={selectedGame}
              onChange={(e) =>
                setSelectedGame(
                  e.target.value
                )
              }
              className="
                pastel-select
                md:min-w-52.5
              "
            >
              <option value="All">
                ทุกเกมทั้งหมด
              </option>

              <option value="Valorant">
                Valorant
              </option>

              <option value="ROV">
                ROV
              </option>

              <option value="Genshin Impact">
                Genshin Impact
              </option>

              <option value="Roblox">
                Roblox
              </option>

              <option value="Pubg">
                Pubg
              </option>

              <option value="Ragnarok">
                Ragnarok
              </option>

              <option value="Reddead Redemption 2">
                Reddead Redemption 2
              </option>

              <option value="wuthering waves">
                Wuthering Waves
              </option>

              <option value="NBA 2K26">
                NBA 2K26
              </option>

              <option value="Jump Force">
                Jump Force
              </option>
            </select>
          </div>
        </div>

        {/* ======================================
            หัวข้อสินค้า
        ======================================= */}

        <div
          className="
            flex
            justify-between
            items-center
            mb-6
            gap-4
          "
        >
          <h3
            className="
              section-title
            "
          >
            🔥 รหัสเกมมาใหม่พร้อมส่ง
          </h3>

          <span
            className="
              section-count
              whitespace-nowrap
            "
          >
            พบทั้งหมด{' '}
            {filteredItems.length}{' '}
            รายการ
          </span>
        </div>

        {/* ======================================
            ไม่มีสินค้า
        ======================================= */}

        {filteredItems.length === 0 ? (
          <div
            className="
              empty-state
            "
          >
            <p className="mb-4">
              ยังไม่มีประกาศขายรหัสเกมในระบบ
              หรือไม่พบข้อมูลที่ค้นหา
            </p>

            <Link
              href="/sell"
              className="
                btn-primary
                inline-block
              "
            >
              ไปโพสต์ขายรหัสเกมคนแรกเลย
            </Link>
          </div>
        ) : (
          /* ======================================
             รายการสินค้า
          ======================================= */

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              md:grid-cols-3
              gap-6
            "
          >
            {filteredItems.map(
              (item) => {
                const currentName =
                  session?.user?.name?.trim() ||
                  '';

                const targetSeller =
                  item.sellerName?.trim() ||
                  '';

                const isOwner =
                  currentName !== '' &&
                  currentName ===
                    targetSeller;

                const isInCart =
                  cartIds.includes(
                    item.id
                  );

                return (
                  <div
                    key={item.id}
                    className="
                      product-card
                      flex
                      flex-col
                    "
                  >
                    {/* =================================
                        รูปสินค้า
                    ================================= */}

                    <Link
                      href={`/item/${item.id}`}
                      className="
                        product-image
                        relative
                        h-48
                        w-full
                        block
                        group
                      "
                    >
                      <img
                        src={
                          item.imageUrl
                        }
                        alt={
                          item.title
                        }
                        className="
                          w-full
                          h-full
                          object-cover
                        "
                      />

                      <span
                        className="
                          game-badge
                          absolute
                          top-3
                          left-3
                        "
                      >
                        {
                          item.gameName
                        }
                      </span>
                    </Link>

                    {/* =================================
                        รายละเอียด
                    ================================= */}

                    <div
                      className="
                        p-5
                        flex-1
                        flex
                        flex-col
                        justify-between
                      "
                    >
                      <div>
                        <Link
                          href={`/item/${item.id}`}
                        >
                          <h4
                            className="
                              product-title
                              line-clamp-1
                              mb-1
                            "
                          >
                            {
                              item.title
                            }
                          </h4>
                        </Link>

                        <p
                          className="
                            product-description
                            line-clamp-2
                            mb-4
                          "
                        >
                          {item.description ||
                            'ไม่มีรายละเอียดสินค้า'}
                        </p>
                      </div>

                      <div>
                        {/* Seller / Date */}

                        <div
                          className="
                            flex
                            justify-between
                            items-center
                            gap-3
                            seller-info
                            mb-3
                            border-t
                            pastel-divider
                            pt-3
                          "
                        >
                          <span>
                            ผู้ขาย:{' '}

                            <strong
                              className="
                                seller-name
                              "
                            >
                              {
                                item.sellerName
                              }
                            </strong>
                          </span>

                          <span className="whitespace-nowrap">
                            {
                              item.createdAt
                            }
                          </span>
                        </div>

                        {/* Price / Button */}

                        <div
                          className="
                            flex
                            items-center
                            justify-between
                            gap-2
                          "
                        >
                          <span
                            className="
                              product-price
                            "
                          >
                            ฿
                            {Number(
                              item.price
                            ).toLocaleString(
                              'th-TH'
                            )}
                          </span>

                          {/* ======================================
                              ปุ่ม
                          ======================================= */}

                          {!session ? (
                            <button
                              onClick={() =>
                                alert(
                                  '⚠️ กรุณาเข้าสู่ระบบด้วย Google ก่อนใช้งานตะกร้าสินค้าครับ'
                                )
                              }
                              className="
                                btn-cart
                                opacity-70
                              "
                            >
                              🔒 เข้าสู่ระบบเพื่อซื้อ
                            </button>
                          ) : isOwner ? (
                            <div
                              className="
                                flex
                                gap-2
                              "
                            >
                              <button
                                onClick={() =>
                                  handleEdit(
                                    item
                                  )
                                }
                                className="
                                  btn-edit
                                "
                              >
                                ✏️ แก้ไข
                              </button>

                              <button
                                onClick={() =>
                                  handleDeleteItem(
                                    item.id,
                                    item.sellerName
                                  )
                                }
                                className="
                                  btn-delete
                                "
                              >
                                🗑️ ลบ
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                handleToggleCart(
                                  item
                                )
                              }
                              className={
                                isInCart
                                  ? 'btn-remove-cart'
                                  : 'btn-cart'
                              }
                            >
                              {isInCart
                                ? '❌ ยกเลิกใส่ตะกร้า'
                                : '🛒 ใส่ตะกร้า'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </main>
  );
}