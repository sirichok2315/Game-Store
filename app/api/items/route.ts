import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM game_items ORDER BY createdAt DESC"
    );

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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      id,
      gameName,
      title,
      price,
      description,
      gameUsername,
      gamePassword,
      imageUrl,
      imageUrls,
      sellerName,
    } = body;

    await pool.execute(
      `INSERT INTO game_items
      (
        id,
        gameName,
        title,
        price,
        description,
        gameUsername,
        gamePassword,
        imageUrl,
        imageUrls,
        sellerName
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        gameName,
        title,
        Number(price),
        description,
        gameUsername,
        gamePassword,
        imageUrl,
        JSON.stringify(imageUrls || []),
        sellerName,
      ]
    );

    return Response.json(
      {
        success: true,
        message: "เพิ่มสินค้าเรียบร้อยแล้ว",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST items error:", error);

    return Response.json(
      {
        success: false,
        error: "ไม่สามารถเพิ่มสินค้าได้",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        {
          success: false,
          error: "ไม่พบรหัสสินค้า",
        },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      "DELETE FROM game_items WHERE id = ?",
      [id]
    );

    const affectedRows = (result as any).affectedRows;

    if (affectedRows === 0) {
      return Response.json(
        {
          success: false,
          error: "ไม่พบสินค้านี้",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "ลบสินค้าเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("DELETE items error:", error);

    return Response.json(
      {
        success: false,
        error: "ไม่สามารถลบสินค้าได้",
      },
      { status: 500 }
    );
  }
}
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const {
      id,
      gameName,
      title,
      price,
      description,
      gameUsername,
      gamePassword,
      imageUrl,
      imageUrls,
      sellerName,
    } = body;

    if (!id) {
      return Response.json(
        {
          success: false,
          error: "ไม่พบรหัสสินค้า",
        },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `UPDATE game_items
       SET
         gameName = ?,
         title = ?,
         price = ?,
         description = ?,
         gameUsername = ?,
         gamePassword = ?,
         imageUrl = ?,
         imageUrls = ?,
         sellerName = ?
       WHERE id = ?`,
      [
        gameName,
        title,
        Number(price),
        description,
        gameUsername,
        gamePassword,
        imageUrl,
        JSON.stringify(imageUrls || []),
        sellerName,
        id,
      ]
    );

    const affectedRows = (result as any).affectedRows;

    if (affectedRows === 0) {
      return Response.json(
        {
          success: false,
          error: "ไม่พบสินค้าที่ต้องการแก้ไข",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "แก้ไขสินค้าเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("PUT items error:", error);

    return Response.json(
      {
        success: false,
        error: "ไม่สามารถแก้ไขสินค้าได้",
      },
      { status: 500 }
    );
  }
}