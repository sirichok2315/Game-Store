
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: "กรุณาเข้าสู่ระบบ" },
                { status: 401 }
            );
        }

        const userEmail = session.user.email.trim().toLowerCase();

        const [rows] = await pool.execute(
            `SELECT balance
       FROM user_balances
       WHERE userEmail = ?`,
            [userEmail]
        );

        const row = (
            rows as { balance: string | number }[]
        )[0];

        return NextResponse.json({
            success: true,
            balance: row ? Number(row.balance) : 0,
        });
    } catch (error) {
        console.error("GET balance error:", error);

        return NextResponse.json(
            { success: false, error: "ไม่สามารถโหลดยอดเงินได้" },
            { status: 500 }
        );
    }
}
