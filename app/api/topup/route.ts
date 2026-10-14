
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        // ตรวจสอบว่าผู้ใช้เข้าสู่ระบบแล้ว
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                {
                    success: false,
                    error: "กรุณาเข้าสู่ระบบก่อนเติมเงิน",
                },
                { status: 401 }
            );
        }

        // รับจำนวนเงิน
        const body = await request.json();
        const amount = Number(body.amount);

        if (
            !Number.isSafeInteger(amount) ||
            amount <= 0 ||
            amount > 100000
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "จำนวนเงินต้องอยู่ระหว่าง 1 ถึง 100,000 บาท",
                },
                { status: 400 }
            );
        }

        // ใช้อีเมลจาก Session เท่านั้น
        const userEmail = session.user.email.trim().toLowerCase();

        // เพิ่มยอดเงินลง TiDB
        await pool.execute(
            `INSERT INTO user_balances (userEmail, balance)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE
       balance = balance + VALUES(balance)`,
            [userEmail, amount]
        );

        // อ่านยอดเงินล่าสุด
        const [rows] = await pool.execute(
            `SELECT balance
       FROM user_balances
       WHERE userEmail = ?`,
            [userEmail]
        );

        const result = (
            rows as { balance: string | number }[]
        )[0];

        if (!result) {
            throw new Error("ไม่พบยอดเงินหลังเติมเงิน");
        }

        return NextResponse.json({
            success: true,
            message: "เติมเงินจำลองสำเร็จ",
            balance: Number(result.balance),
        });
    } catch (error) {
        console.error("Topup API error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "ไม่สามารถเติมเงินได้ กรุณาลองใหม่",
            },
            { status: 500 }
        );
    }
}
