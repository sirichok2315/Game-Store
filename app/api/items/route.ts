import pool from "@/lib/db";

export async function GET() {
    try {
        // เลือกเฉพาะฟิลด์ที่ต้องใช้งานจริง หลีกเลี่ยงการใช้ SELECT * เพื่อป้องกัน Payload ใหญ่เกินไป
        const [rows] = await pool.query(`
            SELECT id, gameName, title, price, description, imageUrl, imageUrls, sellerName, createdAt, gameUsername, gamePassword 
            FROM game_items 
            ORDER BY createdAt DESC
        `);

        return Response.json(rows);
    } catch (error) {
        console.error("GET items error:", error);
        return Response.json(
            {
                success: false,
                error: "ไม่สามารถดึงข้อมูลสินค้าได้",
            },
            { status: 500 }
        );
    }
}