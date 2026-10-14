
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getEmail() {
    const session = await getServerSession(authOptions);

    return session?.user?.email?.trim().toLowerCase() || null;
}

// โหลดตะกร้าจาก Database
export async function GET() {
    try {
        const email = await getEmail();

        if (!email) {
            return NextResponse.json(
                { success: false, error: "กรุณาเข้าสู่ระบบก่อน" },
                { status: 401 }
            );
        }

        const [rows] = await pool.execute(
            `SELECT
         g.id,
         g.gameName,
         g.title,
         g.price,
         g.description,
         g.imageUrl,
         g.sellerName,
         c.addedAt
       FROM cart_items c
       INNER JOIN game_items g
         ON CAST(g.id AS CHAR) = c.itemId
       WHERE c.userEmail = ?
       ORDER BY c.addedAt DESC`,
            [email]
        );

        return NextResponse.json({
            success: true,
            items: rows,
        });
    } catch (error) {
        console.error("GET cart error:", error);

        return NextResponse.json(
            { success: false, error: "โหลดตะกร้าไม่สำเร็จ" },
            { status: 500 }
        );
    }
}

// เพิ่มสินค้าลงตะกร้า
export async function POST(request: Request) {
    try {
        const email = await getEmail();

        if (!email) {
            return NextResponse.json(
                { success: false, error: "กรุณาเข้าสู่ระบบก่อน" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const itemId = String(body.itemId ?? "").trim();

        if (!itemId || itemId.length > 255) {
            return NextResponse.json(
                { success: false, error: "รหัสสินค้าไม่ถูกต้อง" },
                { status: 400 }
            );
        }

        const [items] = await pool.execute(
            `SELECT id
       FROM game_items
       WHERE CAST(id AS CHAR) = ?
       LIMIT 1`,
            [itemId]
        );

        if ((items as unknown[]).length === 0) {
            return NextResponse.json(
                { success: false, error: "ไม่พบสินค้านี้" },
                { status: 404 }
            );
        }

        await pool.execute(
            `INSERT INTO cart_items (userEmail, itemId)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE itemId = VALUES(itemId)`,
            [email, itemId]
        );

        return NextResponse.json({
            success: true,
            message: "เพิ่มสินค้าลงตะกร้าแล้ว",
        });
    } catch (error) {
        console.error("POST cart error:", error);

        return NextResponse.json(
            { success: false, error: "เพิ่มสินค้าลงตะกร้าไม่สำเร็จ" },
            { status: 500 }
        );
    }
}

// ลบสินค้าออกจากตะกร้า
export async function DELETE(request: Request) {
    try {
        const email = await getEmail();

        if (!email) {
            return NextResponse.json(
                { success: false, error: "กรุณาเข้าสู่ระบบก่อน" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get("itemId");

        if (!itemId) {
            return NextResponse.json(
                { success: false, error: "กรุณาระบุรหัสสินค้า" },
                { status: 400 }
            );
        }

        await pool.execute(
            `DELETE FROM cart_items
       WHERE userEmail = ? AND itemId = ?`,
            [email, itemId]
        );

        return NextResponse.json({
            success: true,
            message: "นำสินค้าออกจากตะกร้าแล้ว",
        });
    } catch (error) {
        console.error("DELETE cart error:", error);

        return NextResponse.json(
            { success: false, error: "ลบสินค้าไม่สำเร็จ" },
            { status: 500 }
        );
    }
}
