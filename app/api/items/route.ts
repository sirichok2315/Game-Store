import pool from "@/lib/db";
import { NextResponse } from "next/server";

// ดึงข้อมูลสินค้าทั้งหมด
export async function GET() {
    try {
        const [rows] = await pool.query(`
            SELECT id, gameName, title, price, imageUrl, sellerName, createdAt, gameUsername, gamePassword, description
            FROM game_items
            ORDER BY createdAt DESC
        `);

        return NextResponse.json(rows);
    } catch (error) {
        console.error("GET items error:", error);
        return NextResponse.json(
            { success: false, error: "ไม่สามารถดึงข้อมูลสินค้าได้" },
            { status: 500 }
        );
    }
}

// เพิ่มสินค้าใหม่ (รองรับ POST)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const now = new Date();
        const formattedCreatedAt = now.toISOString().slice(0, 19).replace('T', ' ');
        const { id, gameName, title, price, imageUrl, sellerName, gameUsername, gamePassword, description } = body;

        await pool.query(
            `INSERT INTO game_items (id, gameName, title, price, imageUrl, sellerName, createdAt, gameUsername, gamePassword, description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, gameName, title, price, imageUrl, sellerName, formattedCreatedAt, gameUsername, gamePassword, description]
        );

        return NextResponse.json({ success: true, message: "เพิ่มสินค้าสำเร็จ" });
    } catch (error) {
        console.error("POST item error:", error);
        return NextResponse.json(
            { success: false, error: "ไม่สามารถเพิ่มสินค้าได้" },
            { status: 500 }
        );
    }
}

// แก้ไขสินค้า (รองรับ PUT)
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, gameName, title, price, imageUrl, sellerName, gameUsername, gamePassword, description } = body;

        await pool.query(
            `UPDATE game_items
             SET gameName = ?, title = ?, price = ?, imageUrl = ?, sellerName = ?, gameUsername = ?, gamePassword = ?, description = ?
             WHERE id = ?`,
            [gameName, title, price, imageUrl, sellerName, gameUsername, gamePassword, description, id]
        );

        return NextResponse.json({ success: true, message: "แก้ไขสินค้าสำเร็จ" });
    } catch (error) {
        console.error("PUT item error:", error);
        return NextResponse.json(
            { success: false, error: "ไม่สามารถแก้ไขสินค้าได้" },
            { status: 500 }
        );
    }
}