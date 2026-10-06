import pool from "@/lib/db";

export async function GET() {
    try {
        // ดึงเฉพาะฟิลด์สั้นๆ ที่จำเป็นต้องแสดงผลจริงๆ ตัด TEXT/JSON ก้อนโตออกเพื่อป้องกัน Payload เกินลิมิต
        const [rows] = await pool.query(`
            SELECT id, gameName, title, price, imageUrl, sellerName, createdAt, gameUsername, gamePassword 
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