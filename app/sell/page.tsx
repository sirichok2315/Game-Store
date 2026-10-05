'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { GameItem } from '@/types';
import Link from 'next/link';

export default function SellPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    const [gameName, setGameName] = useState('Valorant');
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');

    // Username / Password ของไอดีเกม
    const [gameUsername, setGameUsername] = useState('');
    const [gamePassword, setGamePassword] = useState('');

    // รูปภาพ
    const [images, setImages] = useState<string[]>(['']);

    // ผู้ขาย
    const [sellerName, setSellerName] = useState('');

    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    const [isEditing, setIsEditing] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);

    // ==========================================
    // โหลดข้อมูลเดิมจาก MySQL เมื่อแก้ไข
    // ==========================================
    useEffect(() => {
        if (session?.user?.name && !editId) {
            setSellerName(session.user.name);
        }

        if (!editId) {
            setIsEditing(false);
            return;
        }

        const fetchItem = async () => {
            try {
                setLoadingItem(true);

                const response = await fetch('/api/items');

                if (!response.ok) {
                    throw new Error('ไม่สามารถดึงข้อมูลสินค้าได้');
                }

                const data: GameItem[] = await response.json();

                const target = data.find(
                    (item) => String(item.id) === String(editId)
                );

                if (!target) {
                    alert('❌ ไม่พบสินค้าที่ต้องการแก้ไข');
                    router.push('/');
                    return;
                }

                // ==========================================
                // ใส่ข้อมูลเก่าลงในฟอร์ม
                // ==========================================

                setTitle(target.title || '');
                setGameName(target.gameName || '');
                setPrice(String(target.price ?? ''));
                setDescription(target.description || '');

                // Username / Password เก่า
                setGameUsername(target.gameUsername || '');
                setGamePassword(target.gamePassword || '');

                // ผู้ขาย
                setSellerName(target.sellerName || '');

                // ==========================================
                // โหลดรูปเก่า
                // ==========================================

                let oldImages: string[] = [];

                if (Array.isArray(target.imageUrls)) {
                    oldImages = target.imageUrls;
                } else if (
                    typeof target.imageUrls === 'string'
                ) {
                    try {
                        oldImages = JSON.parse(target.imageUrls);
                    } catch {
                        oldImages = [];
                    }
                }

                if (
                    oldImages.length === 0 &&
                    target.imageUrl
                ) {
                    oldImages = [target.imageUrl];
                }

                setImages(
                    oldImages.length > 0
                        ? oldImages
                        : ['']
                );

                setIsEditing(true);
            } catch (error) {
                console.error(
                    'Fetch edit item error:',
                    error
                );

                alert(
                    '❌ ไม่สามารถโหลดข้อมูลสินค้าได้'
                );

                router.push('/');
            } finally {
                setLoadingItem(false);
            }
        };

        fetchItem();
    }, [editId, session, router]);

    // ==========================================
    // อัปโหลดรูป
    // ==========================================
    const handleImageChange = (
        index: number,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onloadend = () => {
            const newImages = [...images];

            newImages[index] =
                reader.result as string;

            setImages(newImages);
        };

        reader.readAsDataURL(file);
    };

    // ==========================================
    // เพิ่มช่องรูป
    // ==========================================
    const handleAddImageField = () => {
        setImages([...images, '']);
    };

    // ==========================================
    // ลบรูป
    // ==========================================
    const handleRemoveImageField = (
        index: number
    ) => {
        const newImages = images.filter(
            (_, i) => i !== index
        );

        setImages(
            newImages.length > 0
                ? newImages
                : ['']
        );
    };

    // ==========================================
    // Submit
    // ==========================================
    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        const validImages = images.filter(
            (img) => img.trim() !== ''
        );

        const defaultImage =
            'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60';

        const finalImages =
            validImages.length > 0
                ? validImages
                : [defaultImage];

        // ==========================================
        // 1. แก้ไขสินค้า
        // ==========================================
        if (isEditing && editId) {
            const updatedItem: GameItem = {
                id: editId,
                gameName,
                title,
                price: Number(price),
                description,
                gameUsername,
                gamePassword,
                imageUrl: finalImages[0],
                imageUrls: finalImages,
                sellerName:
                    sellerName ||
                    session?.user?.name ||
                    'Anonymous',
                createdAt: '',
            };

            try {
                const response = await fetch(
                    '/api/items',
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                        body: JSON.stringify(
                            updatedItem
                        ),
                    }
                );

                const result =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.error ||
                        'แก้ไขสินค้าไม่สำเร็จ'
                    );
                }

                alert(
                    '✅ แก้ไขสินค้าเรียบร้อยแล้ว!'
                );

                router.push('/');
                router.refresh();
            } catch (error) {
                console.error(
                    'Update item error:',
                    error
                );

                alert(
                    '❌ ไม่สามารถแก้ไขสินค้าได้'
                );
            }

            return;
        }

        // ==========================================
        // 2. สร้างสินค้าใหม่
        // ==========================================

        const newItem: GameItem = {
            id: Date.now().toString(),
            gameName,
            title,
            price: Number(price),
            description,
            gameUsername,
            gamePassword,
            imageUrl: finalImages[0],
            imageUrls: finalImages,
            sellerName:
                session?.user?.name ||
                sellerName ||
                'Anonymous',
            createdAt:
                new Date().toLocaleDateString(
                    'th-TH',
                    {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    }
                ),
        };

        try {
            const response = await fetch(
                '/api/items',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json',
                    },
                    body: JSON.stringify(newItem),
                }
            );

            const result =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error ||
                    'เพิ่มสินค้าไม่สำเร็จ'
                );
            }

            alert(
                '🎉 ลงประกาศขายรหัสเกมสำเร็จ!'
            );

            router.push('/');
            router.refresh();
        } catch (error) {
            console.error(
                'Create item error:',
                error
            );

            alert(
                '❌ ไม่สามารถลงประกาศขายได้'
            );
        }
    };

    // ==========================================
    // กำลังโหลด Session
    // ==========================================
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                กำลังโหลดข้อมูล...
            </div>
        );
    }

    // ==========================================
    // กำลังโหลดสินค้าเก่า
    // ==========================================
    if (loadingItem) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                กำลังโหลดข้อมูลสินค้า...
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 py-10 px-4">

            <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-6 md:p-8 border border-gray-100">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">

                    <h1 className="text-2xl font-bold text-gray-800">
                        {isEditing
                            ? '✏️ แก้ไขประกาศขายรหัสเกม'
                            : '🛒 ลงประกาศขายรหัสเกม'}
                    </h1>

                    <Link
                        href="/"
                        className="text-sm text-blue-600 hover:underline"
                    >
                        ← กลับหน้าแรก
                    </Link>

                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >

                    {/* เลือกเกม */}
                    <div>

                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            เลือกเกม
                        </label>

                        <select
                            value={gameName}
                            onChange={(e) =>
                                setGameName(e.target.value)
                            }
                            className="w-full border rounded-lg p-2.5 text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
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
                                wuthering waves
                            </option>
                            
                            <option value="NBA 2K26">
                                NBA 2K26
                            </option>

                            <option value="Jump Force">
                                Jump Force
                            </option>
                        </select>

                    </div>

                    {/* หัวข้อ */}
                    <div>

                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            หัวข้อประกาศ
                        </label>

                        <input
                            type="text"
                            placeholder="เช่น ขายไอดีแรร์ แรงค์ Ascendant สกินครบ"
                            value={title}
                            onChange={(e) =>
                                setTitle(e.target.value)
                            }
                            className="w-full border rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />

                    </div>

                    {/* ราคา + ผู้ขาย */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div>

                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ราคา (บาท)
                            </label>

                            <input
                                type="number"
                                placeholder="เช่น 1500"
                                value={price}
                                onChange={(e) =>
                                    setPrice(e.target.value)
                                }
                                className="w-full border rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />

                        </div>

                        <div>

                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ผู้ขาย (จาก Google)
                            </label>

                            <input
                                type="text"
                                value={sellerName}
                                disabled
                                className="w-full border rounded-lg p-2.5 text-gray-500 bg-gray-100 cursor-not-allowed"
                            />

                        </div>

                    </div>

                    {/* Username / Password */}
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-3">

                        <h3 className="text-sm font-bold text-amber-800">
                            🔐 ข้อมูลไอดีเกม (สำหรับส่งให้ผู้ซื้ออัตโนมัติหลังชำระเงิน)
                        </h3>

                        <div>

                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Username / อีเมลเข้าเกม
                            </label>

                            <input
                                type="text"
                                placeholder="เช่น user_game@gmail.com"
                                value={gameUsername}
                                onChange={(e) =>
                                    setGameUsername(
                                        e.target.value
                                    )
                                }
                                className="w-full border rounded-lg p-2.5 text-gray-800 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />

                        </div>

                        <div>

                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Password / รหัสผ่านเข้าเกม
                            </label>

                            <input
                                type="text"
                                placeholder="รหัสผ่านไอดีนี้"
                                value={gamePassword}
                                onChange={(e) =>
                                    setGamePassword(
                                        e.target.value
                                    )
                                }
                                className="w-full border rounded-lg p-2.5 text-gray-800 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />

                        </div>

                    </div>

                    {/* รูปภาพ */}
                    <div>

                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            อัปโหลดรูปภาพสินค้า (เพิ่มได้หลายรูป)
                        </label>

                        {images.map(
                            (img, index) => (

                                <div
                                    key={index}
                                    className="flex items-center gap-2 mb-2"
                                >

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                            handleImageChange(
                                                index,
                                                e
                                            )
                                        }
                                        className="w-full border rounded-lg p-2 text-gray-700 bg-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-xs"
                                    />

                                    {images.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleRemoveImageField(
                                                    index
                                                )
                                            }
                                            className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
                                        >
                                            ลบ
                                        </button>
                                    )}

                                </div>

                            )
                        )}

                        <button
                            type="button"
                            onClick={handleAddImageField}
                            className="mt-1 text-xs text-blue-600 font-semibold hover:underline"
                        >
                            + เพิ่มช่องอัปโหลดรูปภาพอีก
                        </button>

                        {/* Preview */}
                        <div className="flex flex-wrap gap-2 mt-3">

                            {images.map(
                                (img, i) =>
                                    img && (
                                        <div
                                            key={i}
                                            className="relative"
                                        >
                                            <img
                                                src={img}
                                                alt={`Preview ${i}`}
                                                className="w-20 h-16 object-cover rounded-lg border shadow-sm"
                                            />
                                        </div>
                                    )
                            )}

                        </div>

                    </div>

                    {/* รายละเอียด */}
                    <div>

                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            รายละเอียดไอเทม / สกิน
                        </label>

                        <textarea
                            rows={4}
                            placeholder="บอกรายละเอียดรหัส..."
                            value={description}
                            onChange={(e) =>
                                setDescription(
                                    e.target.value
                                )
                            }
                            className="w-full border rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />

                    </div>

                    {/* ปุ่ม */}
                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition shadow-md"
                    >
                        {isEditing
                            ? '💾 บันทึกการแก้ไข'
                            : 'ยืนยันการลงประกาศขาย'}
                    </button>

                </form>

            </div>

        </main>
    );
}