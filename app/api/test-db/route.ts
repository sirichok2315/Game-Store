import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT 1 AS connected");

    return Response.json({
      success: true,
      message: "MySQL connected!",
      data: rows,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: "MySQL connection failed",
      },
      { status: 500 }
    );
  }
}