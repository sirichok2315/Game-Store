import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const image = formData.get('image');

        if (!image) {
            return NextResponse.json({ success: false, error: { message: 'No image provided' } }, { status: 400 });
        }

        const apiKey = process.env.IMGBB_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ success: false, error: { message: 'ImgBB API Key not configured on server' } }, { status: 500 });
        }

        const imgbbFormData = new FormData();
        imgbbFormData.append('image', image);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: imgbbFormData,
        });

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Server upload error:', error);
        return NextResponse.json({ success: false, error: { message: 'Internal Server Error' } }, { status: 500 });
    }
}