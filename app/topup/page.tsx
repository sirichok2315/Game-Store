'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function TopupPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [amount, setAmount] = useState('100');

  const handleTopup = (e: React.FormEvent) => {
    e.preventDefault();

    if (!session || !session.user?.name) {
      alert('⚠️ กรุณาเข้าสู่ระบบก่อนทำการเติมเงิน');
      return;
    }

    const userName = session.user.name.trim();
    const topupAmount = Number(amount);

    if (topupAmount <= 0) {
      alert('⚠️ กรุณาระบุจำนวนเงินให้ถูกต้อง');
      return;
    }

    // ดึงข้อมูลยอดเงินเดิมจาก localStorage
    const balances = JSON.parse(localStorage.getItem('userBalances') || '{}');
    const currentBalance = balances[userName] || 0;
    
    // บวกยอดเงินใหม่เข้าไป
    const newBalance = currentBalance + topupAmount;
    balances[userName] = newBalance;

    // บันทึกกลับลง localStorage
    localStorage.setItem('userBalances', JSON.stringify(balances));

    alert(`🎉 เติมเงินสำเร็จ ${topupAmount.toLocaleString()} บาท!\nยอดเงินคงเหลือปัจจุบัน: ${newBalance.toLocaleString()} บาท`);
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">💰 เติมเงินเข้าบัญชี</h2>
        
        <div className="bg-blue-50 p-4 rounded-xl mb-6 text-center">
          <p className="text-sm text-gray-600">ผู้ใช้งานปัจจุบัน</p>
          <p className="font-bold text-blue-600 text-lg">{session?.user?.name || 'ยังไม่ได้เข้าสู่ระบบ'}</p>
        </div>

        <form onSubmit={handleTopup} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">เลือกจำนวนเงินที่ต้องการเติม</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {['50', '100', '300', '500', '1000', '2000'].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`py-2 rounded-lg border font-semibold text-sm transition ${
                    amount === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  ฿{val}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="ระบุจำนวนเงินอื่นๆ"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 mb-4 text-center">
              * ระบบจำลองการเติมเงิน (Sandbox) ยอดเงินจะถูกเพิ่มเข้ากระเป๋าเงินทันทีเพื่อใช้ทดสอบซื้อสินค้า
            </p>
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition shadow-md"
            >
              ✅ ยืนยันการเติมเงิน
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}