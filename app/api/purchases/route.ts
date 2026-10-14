
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const runtime = "nodejs";

type GameItem = RowDataPacket & {
  id: string | number;
  gameName: string;
  title: string;
  price: number | string;
  description: string | null;
  gameUsername: string | null;
  gamePassword: string | null;
  imageUrl: string | null;
  sellerName: string | null;
};

type BalanceRow = RowDataPacket & {
  balance: number | string;
};

function toCents(value: number | string): number {
  const price = Number(value);

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("ราคาสินค้าไม่ถูกต้อง");
  }

  return Math.round(price * 100);
}

// GET: ดูประวัติการซื้อของผู้ใช้ที่เข้าสู่ระบบ
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      { success: false, error: "กรุณาเข้าสู่ระบบก่อน" },
      { status: 401 }
    );
  }

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         itemId,
         buyerName,
         gameName,
         title,
         price,
         description,
         gameUsername,
         gamePassword,
         imageUrl,
         sellerName,
         purchasedAt
       FROM purchases
       WHERE buyerName = ?
       ORDER BY purchasedAt DESC`,
      [email]
    );

    return NextResponse.json({
      success: true,
      purchases: rows,
    });
  } catch (error) {
    console.error("GET purchases error:", error);

    return NextResponse.json(
      { success: false, error: "ไม่สามารถโหลดประวัติการซื้อได้" },
      { status: 500 }
    );
  }
}

// POST: ซื้อสินค้าจากตะกร้าโดยใช้ยอดเงินในระบบ
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      { success: false, error: "กรุณาเข้าสู่ระบบก่อนซื้อสินค้า" },
      { status: 401 }
    );
  }

  let body: { itemIds?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "ข้อมูลคำขอไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  if (
    !Array.isArray(body.itemIds) ||
    body.itemIds.length === 0 ||
    body.itemIds.length > 50 ||
    !body.itemIds.every(
      (id) =>
        (typeof id === "string" || typeof id === "number") &&
        String(id).trim().length > 0
    )
  ) {
    return NextResponse.json(
      { success: false, error: "กรุณาเลือกสินค้าอย่างน้อย 1 รายการ" },
      { status: 400 }
    );
  }

  const itemIds = [...new Set(body.itemIds.map(String))];

  if (itemIds.length !== body.itemIds.length) {
    return NextResponse.json(
      { success: false, error: "พบสินค้าซ้ำในรายการซื้อ" },
      { status: 400 }
    );
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // สร้างแถวเริ่มต้น หากผู้ใช้ยังไม่เคยมีบัญชียอดเงิน
    await connection.execute(
      `INSERT INTO user_balances (userEmail, balance)
       VALUES (?, 0.00)
       ON DUPLICATE KEY UPDATE userEmail = VALUES(userEmail)`,
      [email]
    );

    // ล็อกยอดเงิน ป้องกันการซื้อพร้อมกันจนใช้เงินเกินยอด
    const [balanceRows] = await connection.execute<BalanceRow[]>(
      `SELECT balance
       FROM user_balances
       WHERE userEmail = ?
       FOR UPDATE`,
      [email]
    );

    const balanceCents = toCents(balanceRows[0].balance);

    // ล็อกและตรวจสอบสินค้าทุกชิ้นจากฐานข้อมูล
    const items: GameItem[] = [];

    for (const itemId of [...itemIds].sort()) {
      const [rows] = await connection.execute<GameItem[]>(
        `SELECT
           id,
           gameName,
           title,
           price,
           description,
           gameUsername,
           gamePassword,
           imageUrl,
           sellerName
         FROM game_items
         WHERE CAST(id AS CHAR) = ?
         FOR UPDATE`,
        [itemId]
      );

      if (rows.length === 0) {
        throw new Error(`สินค้า ID ${itemId} ไม่มีอยู่แล้ว`);
      }

      items.push(rows[0]);
    }

    const pricedItems = items.map((item) => ({
      item,
      priceCents: toCents(item.price),
    }));

    const totalCents = pricedItems.reduce(
      (sum, entry) => sum + entry.priceCents,
      0
    );

    if (balanceCents < totalCents) {
      throw new Error("ยอดเงินไม่เพียงพอ กรุณาเติมเงินก่อนซื้อ");
    }

    // ตัดเงินโดยให้ฐานข้อมูลตรวจสอบยอดเงินอีกครั้ง
    const [debitResult] = await connection.execute<ResultSetHeader>(
      `UPDATE user_balances
       SET balance = balance - ?
       WHERE userEmail = ?
         AND balance >= ?`,
      [totalCents / 100, email, totalCents / 100]
    );

    if (debitResult.affectedRows !== 1) {
      throw new Error("ตัดยอดเงินไม่สำเร็จ กรุณาลองใหม่");
    }

    // บันทึกประวัติซื้อ และนำสินค้าออกจากระบบ
    for (const { item, priceCents } of pricedItems) {
      await connection.execute(
        `INSERT INTO purchases (
           itemId,
           buyerName,
           gameName,
           title,
           price,
           description,
           gameUsername,
           gamePassword,
           imageUrl,
           sellerName
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          String(item.id),
          email,
          item.gameName,
          item.title,
          priceCents / 100,
          item.description,
          item.gameUsername,
          item.gamePassword,
          item.imageUrl,
          item.sellerName,
        ]
      );

      const [deleteResult] =
        await connection.execute<ResultSetHeader>(
          `DELETE FROM game_items
           WHERE CAST(id AS CHAR) = ?`,
          [String(item.id)]
        );

      if (deleteResult.affectedRows !== 1) {
        throw new Error(`ไม่สามารถนำสินค้า ${item.title} ออกจากระบบได้`);
      }

      // ลบสินค้าออกจากตะกร้าของผู้ใช้ทุกคน
      await connection.execute(
        `DELETE FROM cart_items
         WHERE itemId = ?`,
        [String(item.id)]
      );
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "ซื้อสินค้าสำเร็จ",
      purchasedCount: items.length,
      total: totalCents / 100,
      remainingBalance: (balanceCents - totalCents) / 100,
    });
  } catch (error) {
    await connection.rollback();

    const message =
      error instanceof Error
        ? error.message
        : "เกิดข้อผิดพลาดระหว่างซื้อสินค้า";

    console.error("POST purchases error:", error);

    const status =
      message.includes("ยอดเงินไม่เพียงพอ") ||
        message.includes("ไม่มีอยู่แล้ว") ||
        message.includes("ไม่สามารถนำสินค้า")
        ? 400
        : 500;

    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  } finally {
    connection.release();
  }
}
