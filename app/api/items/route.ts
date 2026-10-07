import pool from "@/lib/db";
import { NextResponse } from "next/server";

// ==========================================
// ดึงข้อมูลสินค้าทั้งหมด
// ==========================================
export async function GET() {
    try {
        const [rows] = await pool.query(`
            SELECT
                id,
                gameName,
                title,
                price,
                imageUrl,
                imageUrls,
                sellerName,
                createdAt,
                gameUsername,
                gamePassword,
                description
            FROM game_items
            ORDER BY createdAt DESC
        `);

        return NextResponse.json(rows);

    } catch (error) {
        console.error("GET items error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "ไม่สามารถดึงข้อมูลสินค้าได้"
            },
            {
                status: 500
            }
        );
    }
}


// ==========================================
// เพิ่มสินค้าใหม่
// ==========================================
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const now = new Date();

        const formattedCreatedAt =
            now.toISOString()
                .slice(0, 19)
                .replace("T", " ");

        const {
            id,
            gameName,
            title,
            price,
            imageUrl,
            imageUrls,
            sellerName,
            gameUsername,
            gamePassword,
            description
        } = body;

        console.log(
            "IMAGE URLS FROM SELL:",
            imageUrls
        );

        await pool.query(
            `
            INSERT INTO game_items (
                id,
                gameName,
                title,
                price,
                imageUrl,
                imageUrls,
                sellerName,
                createdAt,
                gameUsername,
                gamePassword,
                description
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                id,
                gameName,
                title,
                price,
                imageUrl,
                JSON.stringify(imageUrls || []),
                sellerName,
                formattedCreatedAt,
                gameUsername,
                gamePassword,
                description
            ]
        );

        return NextResponse.json({
            success: true,
            message: "เพิ่มสินค้าสำเร็จ"
        });

    } catch (error) {
        console.error(
            "POST item error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : String(error)
            },
            {
                status: 500
            }
        );
    }
}


// ==========================================
// แก้ไขสินค้า
// ==========================================
export async function PUT(request: Request) {
    try {
        const body = await request.json();

        const {
            id,
            gameName,
            title,
            price,
            imageUrl,
            imageUrls,
            sellerName,
            gameUsername,
            gamePassword,
            description
        } = body;

        let finalImageUrls: string[] = [];

        if (Array.isArray(imageUrls)) {
            finalImageUrls = imageUrls.filter(
                (url) =>
                    typeof url === "string" &&
                    url.trim() !== ""
            );
        }

        // ถ้าไม่มีหลายรูป ให้ใช้รูปหลัก
        if (
            finalImageUrls.length === 0 &&
            imageUrl
        ) {
            finalImageUrls = [imageUrl];
        }

        // รูปแรกเป็นรูปหลัก
        const mainImage =
            finalImageUrls[0] ||
            imageUrl ||
            "";

        await pool.query(
            `
            UPDATE game_items
            SET
                gameName = ?,
                title = ?,
                price = ?,
                imageUrl = ?,
                imageUrls = ?,
                sellerName = ?,
                gameUsername = ?,
                gamePassword = ?,
                description = ?
            WHERE id = ?
            `,
            [
                gameName,
                title,
                price,
                mainImage,
                JSON.stringify(finalImageUrls),
                sellerName,
                gameUsername,
                gamePassword,
                description,
                id
            ]
        );

        return NextResponse.json({
            success: true,
            message: "แก้ไขสินค้าสำเร็จ"
        });

    } catch (error) {
        console.error(
            "PUT item error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : String(error)
            },
            {
                status: 500
            }
        );
    }
}


// ==========================================
// ลบสินค้า
// ==========================================
export async function DELETE(request: Request) {
    try {
        const { searchParams } =
            new URL(request.url);

        const id =
            searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: "ไม่พบรหัสสินค้า"
                },
                {
                    status: 400
                }
            );
        }

        const [result] =
            await pool.execute(
                `
                DELETE FROM game_items
                WHERE id = ?
                `,
                [id]
            );

        const affectedRows =
            (result as any).affectedRows;

        if (!affectedRows) {
            return NextResponse.json(
                {
                    success: false,
                    error: "ไม่พบสินค้า"
                },
                {
                    status: 404
                }
            );
        }

        return NextResponse.json({
            success: true,
            message: "ลบสินค้าเรียบร้อยแล้ว"
        });

    } catch (error) {
        console.error(
            "DELETE items error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : String(error)
            },
            {
                status: 500
            }
        );
    }
}