import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const condition = formData.get('condition');
    const severity = formData.get('severity');
    const soilMoisture = formData.get('soilMoisture');
    const temperature = formData.get('temperature');
    const humidity = formData.get('humidity');
    const rawSolutions = formData.get('solutions') || '';
    const imageFile = formData.get('image');

    if (!imageFile) {
      return NextResponse.json({ error: 'Missing image payload' }, { status: 400 });
    }

    // Convert incoming jpeg file to clear Base64 string for direct dashboard rendering
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;

    // Reconstruct the array split via the custom delimiter
    const solutionsArray = rawSolutions.split('||').filter(item => item.trim() !== '');

    const distinctAlertLog = {
      id: Date.now().toString(),
      condition,
      status: 'Sick',
      severity,
      sensors: { soilMoisture, temperature, humidity },
      solutions: solutionsArray,
      imageSrc: base64Image,
      timestamp: new Date().toLocaleTimeString()
    };

    // SAVE ALERT PACKET TO YOUR PERMANENT DATABASE STORAGE HERE
    // Example: await prisma.diseaseAlert.create({ data: distinctAlertLog });

    return NextResponse.json({ success: true, message: "Alert processed and updated on Vercel." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}