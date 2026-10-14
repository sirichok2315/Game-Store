
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function TopupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(false);

  async function handleTopup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!session?.user?.email) {
      alert('กรุณาเข้าสู่ระบบก่อนเติมเงิน');
      return;
    }

    const value = Number(amount);

    if (!Number.isSafeInteger(value) || value < 1 || value > 100000) {
      alert('กรุณาระบุจำนวนเงิน 1–100,000 บาท');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: value }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'เติมเงินไม่สำเร็จ');
      }

      window.dispatchEvent(new Event('balanceUpdated'));

      alert(`เติมเงินจำลองสำเร็จ ${value.toLocaleString('th-TH')} บาท\nยอดคงเหลือ ${Number(result.balance).toLocaleString('th-TH')} บาท`);

      router.push('/');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          💰 เติมเงินเข้าบัญชี
        </h1>

        <div className="bg-blue-50 p-4 rounded-xl mb-6 text-center">
          <p className="text-sm text-gray-600">ผู้ใช้งานปัจจุบัน</p>
          <p className="font-bold text-blue-600 text-lg">
            {session?.user?.name || 'ยังไม่ได้เข้าสู่ระบบ'}
          </p>
        </div>

        <form onSubmit={handleTopup} className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700">
            จำนวนเงินที่ต้องการเติม
          </label>

          <div className="grid grid-cols-3 gap-2">
            {['50', '100', '300', '500', '1000', '2000'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(v)}
                className={`py-2 rounded-lg border font-semibold ${amount === v
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300'
                  }`}
              >
                ฿{v}
              </button>
            ))}
          </div>

          <input
            type="number"
            min="1"
            max="100000"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300"
            required
          />

          <p className="text-xs text-gray-500 text-center">
            ระบบเติมเงินจำลองสำหรับทดสอบเว็บไซต์ ไม่ใช่การชำระเงินจริง
          </p>

          <button
            type="submit"
            disabled={loading || status === 'loading'}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg"
          >
            {loading ? 'กำลังดำเนินการ...' : '✅ ยืนยันการเติมเงิน'}
          </button>
        </form>
      </div>
    </main>
  );
}
