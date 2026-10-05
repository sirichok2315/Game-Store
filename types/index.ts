export interface GameItem {
  id: string;
  gameName: string;      // เช่น Valorant, ROV
  title: string;         // หัวข้อประกาศ
  price: number;         // ราคา
  description: string;   // รายละเอียดไอเทม/ตัวละคร
  imageUrl: string;      // รูปภาพหลัก (รูปแรกสำหรับแสดงหน้าแรก)[cite: 10]
  imageUrls?: string[];  // เพิ่มอันนี้เผื่อเก็บรายการรูปภาพทั้งหมดแบบหลายรูปครับ
  sellerName: string;    // ชื่อคนขาย
  createdAt: string;     // วันเวลาที่ลงประกาศ
  gameUsername?: string; // เพิ่มฟิลด์ Username ของไอดีเกม
  gamePassword?: string; // เพิ่มฟิลด์ Password ของไอดีเกม
}