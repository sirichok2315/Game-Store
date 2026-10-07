'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { GameItem } from '@/types';
import Link from 'next/link';

function SellFormContent() {
    const router = useRouter();
    const { data: session, status } = useSession();

    const [gameName, setGameName] = useState('Valorant');
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [gameUsername, setGameUsername] = useState('');
    const [gamePassword, setGamePassword] = useState('');
    const [sellerName, setSellerName] = useState('');

    // =========================
    // รูปภาพสินค้า
    // =========================
    const [images, setImages] = useState<string[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    const [isEditing, setIsEditing] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);

    // =========================
    // โหลดข้อมูลสินค้าเดิมตอนแก้ไข
    // =========================
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
                    throw new Error(
                        'ไม่สามารถดึงข้อมูลสินค้าได้'
                    );
                }

                const data: GameItem[] = await response.json();

                const target = data.find(
                    (item) =>
                        String(item.id) === String(editId)
                );

                if (!target) {
                    alert('❌ ไม่พบสินค้าที่ต้องการแก้ไข');
                    router.push('/');
                    return;
                }

                setTitle(target.title || '');
                setGameName(target.gameName || 'Valorant');
                setPrice(String(target.price ?? ''));
                setDescription(target.description || '');
                setGameUsername(
                    target.gameUsername || ''
                );
                setGamePassword(
                    target.gamePassword || ''
                );
                setSellerName(
                    target.sellerName || ''
                );

                // โหลดรูปเดิม
                if (
                    target.imageUrls &&
                    target.imageUrls.length > 0
                ) {
                    setImages(target.imageUrls);
                } else if (target.imageUrl) {
                    setImages([target.imageUrl]);
                } else {
                    setImages([]);
                }

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

    // =========================
    // อัปโหลดรูปไป Cloudinary
    // =========================
    const uploadImageToCloudinary = async (
        file: File
    ): Promise<string> => {
        const cloudName =
            process.env
                .NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

        const uploadPreset =
            process.env
                .NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            throw new Error(
                'ยังไม่ได้ตั้งค่า Cloudinary ใน .env.local'
            );
        }

        if (!file.type.startsWith('image/')) {
            throw new Error(
                'กรุณาเลือกไฟล์รูปภาพเท่านั้น'
            );
        }

        if (file.size > 10 * 1024 * 1024) {
            throw new Error(
                'รูปภาพต้องมีขนาดไม่เกิน 10MB'
            );
        }

        const formData = new FormData();

        formData.append('file', file);
        formData.append(
            'upload_preset',
            uploadPreset
        );

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error(
                'Cloudinary error:',
                data
            );

            throw new Error(
                data?.error?.message ||
                'อัปโหลดรูปไม่สำเร็จ'
            );
        }

        return data.secure_url;
    };

    // =========================
    // เลือกและอัปโหลดหลายรูป
    // =========================
    const handleImageChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = Array.from(
            e.target.files || []
        );

        if (files.length === 0) {
            return;
        }

        if (images.length + files.length > 5) {
            alert(
                '❌ สามารถเพิ่มรูปได้สูงสุด 5 รูป'
            );

            e.target.value = '';
            return;
        }

        try {
            setUploadingImages(true);

            const uploadedUrls: string[] = [];

            for (const file of files) {
                const url =
                    await uploadImageToCloudinary(
                        file
                    );

                uploadedUrls.push(url);
            }

            setImages((prev) => [
                ...prev,
                ...uploadedUrls,
            ]);
        } catch (error) {
            console.error(
                'Upload image error:',
                error
            );

            alert(
                error instanceof Error
                    ? `❌ ${error.message}`
                    : '❌ อัปโหลดรูปไม่สำเร็จ'
            );
        } finally {
            setUploadingImages(false);

            // ทำให้เลือกไฟล์เดิมซ้ำได้
            e.target.value = '';
        }
    };

    // =========================
    // ลบรูป
    // =========================
    const handleRemoveImage = (
        index: number
    ) => {
        setImages((prev) =>
            prev.filter(
                (_, imageIndex) =>
                    imageIndex !== index
            )
        );
    };

    // =========================
    // Submit
    // =========================
    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        if (uploadingImages) {
            alert(
                '⏳ กรุณารอให้อัปโหลดรูปเสร็จก่อน'
            );
            return;
        }

        // ถ้าไม่ได้ใส่รูป ให้ใช้รูปเริ่มต้น
        const defaultImage =
            'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60';

        const finalImages =
            images.length > 0
                ? images
                : [defaultImage];

        // =========================
        // แก้ไขสินค้า
        // =========================
        if (isEditing && editId) {
            const updatedItem: GameItem = {
                id: editId,
                gameName,
                title,
                price: Number(price),
                description,
                gameUsername,
                gamePassword,

                // รูปแรก = รูปหลัก
                imageUrl: finalImages[0],

                // รูปทั้งหมด
                imageUrls: finalImages,

                sellerName:
                    sellerName ||
                    session?.user?.name ||
                    'Anonymous',

                createdAt: '',
            };

            try {
                const response =
                    await fetch('/api/items', {
                        method: 'PUT',
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                        body: JSON.stringify(
                            updatedItem
                        ),
                    });

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
                    error instanceof Error
                        ? `❌ ${error.message}`
                        : '❌ ไม่สามารถแก้ไขสินค้าได้'
                );
            }

            return;
        }

        // =========================
        // สร้างสินค้าใหม่
        // =========================
        const newItem: GameItem = {
            id: Date.now().toString(),

            gameName,

            title,

            price: Number(price),

            description,

            gameUsername,

            gamePassword,

            // รูปแรก
            imageUrl: finalImages[0],

            // รูปทั้งหมด
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
            const response =
                await fetch('/api/items', {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',
                    },

                    body: JSON.stringify(newItem),
                });

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
                error instanceof Error
                    ? `❌ ${error.message}`
                    : '❌ ไม่สามารถลงประกาศขายได้'
            );
        }
    };

    // =========================
    // Loading
    // =========================
    if (
        status === 'loading' ||
        loadingItem
    ) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                กำลังโหลดข้อมูล...
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
                                setGameName(
                                    e.target.value
                                )
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
                                setTitle(
                                    e.target.value
                                )
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
                                min="0"
                                placeholder="เช่น 1500"
                                value={price}
                                onChange={(e) =>
                                    setPrice(
                                        e.target.value
                                    )
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

                    {/* ========================= */}
                    {/* รูปภาพสินค้า */}
                    {/* ========================= */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            🖼️ รูปภาพสินค้า
                        </label>

                        <div className="border-2 border-dashed border-purple-300 rounded-xl p-5 bg-purple-50">

                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={
                                    handleImageChange
                                }
                                disabled={
                                    uploadingImages ||
                                    images.length >= 5
                                }
                                className="block w-full text-sm text-gray-600
                                    file:mr-4
                                    file:py-2
                                    file:px-4
                                    file:rounded-lg
                                    file:border-0
                                    file:bg-purple-600
                                    file:text-white
                                    file:font-semibold
                                    hover:file:bg-purple-700
                                    disabled:opacity-50"
                            />

                            <p className="text-xs text-gray-500 mt-2">
                                เลือกได้สูงสุด 5 รูป • รูปละไม่เกิน 10MB
                            </p>

                            {/* Uploading */}
                            {uploadingImages && (
                                <div className="mt-3 text-sm text-purple-700 font-medium">
                                    ⏳ กำลังอัปโหลดรูปไปยัง Cloudinary...
                                </div>
                            )}

                            {/* Preview */}
                            {images.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">

                                    {images.map(
                                        (
                                            image,
                                            index
                                        ) => (
                                            <div
                                                key={`${image}-${index}`}
                                                className="relative rounded-lg overflow-hidden border bg-white"
                                            >

                                                <img
                                                    src={
                                                        image
                                                    }
                                                    alt={`รูปสินค้า ${index +
                                                        1
                                                        }`}
                                                    className="w-full h-32 object-cover"
                                                />

                                                {/* รูปหลัก */}
                                                {index ===
                                                    0 && (
                                                        <span className="absolute bottom-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                                                            รูปหลัก
                                                        </span>
                                                    )}

                                                {/* ปุ่มลบ */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveImage(
                                                            index
                                                        )
                                                    }
                                                    className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full text-sm font-bold hover:bg-red-600"
                                                    title="ลบรูป"
                                                >
                                                    ×
                                                </button>

                                            </div>
                                        )
                                    )}

                                </div>
                            )}

                            {/* ยังไม่มีรูป */}
                            {images.length ===
                                0 &&
                                !uploadingImages && (
                                    <div className="text-center text-sm text-gray-400 py-6">
                                        ยังไม่ได้เลือกรูปสินค้า
                                    </div>
                                )}

                        </div>
                    </div>

                    {/* ========================= */}
                    {/* ข้อมูลไอดีเกม */}
                    {/* ========================= */}
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
                                value={
                                    gameUsername
                                }
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
                                value={
                                    gamePassword
                                }
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

                    {/* รายละเอียด */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            รายละเอียดไอเทม / สกิน
                        </label>

                        <textarea
                            rows={4}
                            placeholder="บอกรายละเอียดรหัส..."
                            value={
                                description
                            }
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
                        disabled={
                            uploadingImages
                        }
                        className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {uploadingImages
                            ? '⏳ กำลังอัปโหลดรูป...'
                            : isEditing
                                ? '💾 บันทึกการแก้ไข'
                                : 'ยืนยันการลงประกาศขาย'}
                    </button>

                </form>
            </div>
        </main>
    );
}

export default function SellPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    กำลังโหลดหน้าลงขาย...
                </div>
            }
        >
            <SellFormContent />
        </Suspense>
    );
}