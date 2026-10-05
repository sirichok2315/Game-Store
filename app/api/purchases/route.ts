import pool from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buyerName = searchParams.get("buyerName");

    if (!buyerName) {
      return Response.json(
        { error: "ไม่พบชื่อผู้ซื้อ" },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT *
       FROM purchases
       WHERE buyerName = ?
       ORDER BY purchasedAt DESC`,
      [buyerName]
    );

    return Response.json(rows);
  } catch (error) {
    console.error("GET purchases error:", error);

    return Response.json(
      { error: "ไม่สามารถดึงประวัติการซื้อได้" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
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
    } = body;

    await pool.execute(
      `INSERT INTO purchases
      (
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
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        itemId,
        buyerName,
        gameName,
        title,
        Number(price),
        description,
        gameUsername,
        gamePassword,
        imageUrl,
        sellerName,
      ]
    );

    return Response.json(
      {
        success: true,
        message: "บันทึกประวัติการซื้อสำเร็จ",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST purchases error:", error);

    return Response.json(
      {
        success: false,
        error: "ไม่สามารถบันทึกประวัติการซื้อได้",
      },
      { status: 500 }
    );
  }
}