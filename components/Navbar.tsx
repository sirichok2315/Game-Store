'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    const [cartCount, setCartCount] = useState(0);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        const updateNavbarData = () => {
            // ==========================================
            // 1. จำนวนสินค้าในตะกร้า
            // ==========================================

            try {
                const cart = JSON.parse(
                    localStorage.getItem('cartItems') || '[]'
                );

                setCartCount(
                    Array.isArray(cart)
                        ? cart.length
                        : 0
                );
            } catch {
                setCartCount(0);
            }

            // ==========================================
            // 2. ยอดเงินของผู้ใช้
            // ==========================================

            if (session?.user) {
                try {
                    const balances = JSON.parse(
                        localStorage.getItem('userBalances') || '{}'
                    );

                    const email =
                        session.user.email?.trim() || '';

                    const name =
                        session.user.name?.trim() || '';

                    // ใช้ email เป็นหลัก
                    // รองรับข้อมูลเก่าที่ใช้ชื่อ
                    const currentBalance =
                        balances[email] ??
                        balances[name] ??
                        0;

                    setBalance(
                        Number(currentBalance) || 0
                    );
                } catch {
                    setBalance(0);
                }
            } else {
                setBalance(0);
            }
        };

        updateNavbarData();

        window.addEventListener(
            'storage',
            updateNavbarData
        );

        return () => {
            window.removeEventListener(
                'storage',
                updateNavbarData
            );
        };
    }, [pathname, session]);

    return (
        <nav className="
            bg-[#f9f4f1]
            border-b
            border-[#ebdcd4]
            sticky
            top-0
            z-50
            shadow-xs
        ">

            <div className="
                max-w-300
                mx-auto
                px-4
                py-2
                flex
                justify-between
                items-center
            ">

                {/* ==========================================
                    LOGO
                =========================================== */}

                <Link
                    href="/"
                    className="flex items-center gap-2 shrink-0"
                >
                    <img
                        src="/image/bgn.png"
                        alt="BG TONG N"
                        className="w-24 h-12 object-contain"
                    />

                    <span className="
                        font-bold
                        text-xl
                        text-[#5B4545]
                        tracking-tight
                        whitespace-nowrap
                    ">
                        BG TONG N
                    </span>
                </Link>


                {/* ==========================================
                    เมนูนำทาง
                =========================================== */}

                <div className="
                    flex
                    items-center
                    gap-3
                    ml-4
                    shrink-0
                ">

                    {/* หน้าแรก */}

                    <Link
                        href="/"
                        className={`
                            px-3
                            py-2
                            rounded-lg
                            text-sm
                            font-medium
                            transition
                            whitespace-nowrap
                            ${pathname === '/'
                                ? 'bg-blue-50 text-[#5B4545] font-semibold'
                                : 'text-[#806666] hover:bg-gray-100'
                            }
                        `}
                    >
                        หน้าแรก
                    </Link>


                    {/* ตะกร้า */}

                    <Link
                        href="/cart"
                        className={`
                            relative
                            px-3
                            py-2
                            rounded-lg
                            text-sm
                            font-medium
                            transition
                            flex
                            items-center
                            gap-1
                            whitespace-nowrap
                            ${pathname === '/cart'
                                ? 'bg-blue-50 text-[#5B4545] font-semibold'
                                : 'text-[#806666] hover:bg-gray-100'
                            }
                        `}
                    >
                        🛒 ตะกร้า

                        {cartCount > 0 && (
                            <span className="
                                absolute
                                -top-1
                                -right-1
                                bg-red-500
                                text-white
                                text-[10px]
                                font-bold
                                w-5
                                h-5
                                rounded-full
                                flex
                                items-center
                                justify-center
                                shadow
                            ">
                                {cartCount}
                            </span>
                        )}
                    </Link>


                    {/* ประวัติการซื้อ */}

                    <Link
                        href="/purchases"
                        className="
                            flex
                            items-center
                            gap-1
                            text-[#806666]
                            hover:text-[#5B4545]
                            font-medium
                            whitespace-nowrap
                        "
                    >
                        📦 ประวัติการซื้อ
                    </Link>


                    {/* ลงขายรหัส */}

                    <Link
                        href="/sell"
                        className={`
                            px-3
                            py-2
                            rounded-lg
                            text-sm
                            font-medium
                            transition
                            whitespace-nowrap
                            ${pathname === '/sell'
                                ? 'bg-green-50 text-[#5B4545] font-semibold'
                                : 'text-[#806666] hover:bg-gray-100'
                            }
                        `}
                    >
                        + ลงขายรหัส
                    </Link>


                    {/* ======================================
                        ข้อมูลผู้ใช้
                    ======================================= */}

                    {session?.user ? (

                        <div className="
                            flex
                            items-center
                            gap-3
                            pl-2
                            border-l
                            border-gray-200
                            shrink-0
                        ">

                            {/* ==================================
                                ยอดเงิน
                            =================================== */}

                            <div className="
                                flex
                                items-center
                                gap-2
                                bg-white
                                px-3
                                py-1
                                rounded-lg
                                border
                                border-[#d9c8c0]
                                w-55
                                h-10
                                shrink-0
                            ">

                                <span
                                    className="
                                        text-xs
                                        font-bold
                                        text-[#6A4A4A]
                                        flex-1
                                        min-w-0
                                        whitespace-nowrap
                                        overflow-hidden
                                        text-ellipsis
                                    "
                                    title={`฿${balance.toLocaleString('th-TH')}`}
                                >
                                    ฿
                                    {balance.toLocaleString(
                                        'th-TH'
                                    )}
                                </span>

                                <Link
                                    href="/topup"
                                    className="
                                        bg-green-600
                                        hover:bg-green-700
                                        text-white
                                        text-[10px]
                                        font-semibold
                                        px-2
                                        py-1
                                        rounded
                                        transition
                                        shadow-sm
                                        whitespace-nowrap
                                        shrink-0
                                    "
                                >
                                    + เติมเงิน
                                </Link>

                            </div>


                            {/* ==================================
                                ชื่อผู้ใช้
                            =================================== */}

                            <div className="
                                text-right
                                hidden
                                sm:block
                                w-25
                                shrink-0
                            ">

                                <p
                                    className="
                                        text-xs
                                        font-bold
                                        text-[#5B4545]
                                        whitespace-nowrap
                                        overflow-hidden
                                        text-ellipsis
                                    "
                                    title={
                                        session.user.name ||
                                        ''
                                    }
                                >
                                    {session.user.name}
                                </p>

                                <span className="
                                    text-[10px]
                                    bg-green-100
                                    text-[#6E9B68]
                                    px-2
                                    py-0.5
                                    rounded
                                    font-medium
                                    whitespace-nowrap
                                ">
                                    Google Verified
                                </span>

                            </div>


                            {/* ==================================
                                รูปโปรไฟล์
                            =================================== */}

                            {session.user.image && (
                                <img
                                    src={session.user.image}
                                    alt="User Avatar"
                                    className="
                                        w-8
                                        h-8
                                        rounded-full
                                        border
                                        border-[#d9c8c0]
                                        shadow-sm
                                        shrink-0
                                    "
                                />
                            )}


                            {/* ==================================
                                ออกจากระบบ
                            =================================== */}

                            <button
                                onClick={() => signOut()}
                                className="
                                    bg-red-50
                                    text-[#8A4F4F]
                                    px-3
                                    py-1.5
                                    rounded-lg
                                    text-xs
                                    font-semibold
                                    hover:bg-red-100
                                    transition
                                    whitespace-nowrap
                                    shrink-0
                                "
                            >
                                ออกจากระบบ
                            </button>

                        </div>

                    ) : (

                        /* ==================================
                           ยังไม่ได้เข้าสู่ระบบ
                        =================================== */

                        <Link
                            href="/login"
                            className="
                                bg-blue-600
                                text-white
                                px-4
                                py-2
                                rounded-lg
                                text-sm
                                font-semibold
                                hover:bg-blue-700
                                transition
                                shadow-sm
                                whitespace-nowrap
                            "
                        >
                            เข้าสู่ระบบ
                        </Link>

                    )}

                </div>

            </div>

        </nav>
    );
}