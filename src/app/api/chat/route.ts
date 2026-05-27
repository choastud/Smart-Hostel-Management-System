import { NextRequest, NextResponse } from 'next/server';
import { getDbServer } from '@/lib/dbServer';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // Fetch db service
    const db = getDbServer(req);
    
    // Fetch all context in parallel
    const [
      hostels,
      rooms,
      allocations,
      attendance,
      complaints,
      visitors,
      fees,
      messMenu
    ] = await Promise.all([
      db.getHostels().catch(() => []),
      db.getRooms().catch(() => []),
      db.getAllocations().catch(() => []),
      db.getAttendance().catch(() => []),
      db.getComplaints().catch(() => []),
      db.getVisitors().catch(() => []),
      db.getFees().catch(() => []),
      db.getMessMenu().catch(() => [])
    ]);

    // Construct the database state context
    const contextText = `
SYSTEM CONTEXT (Current Hostel Database State):
- Hostels: ${JSON.stringify(hostels)}
- Rooms: ${JSON.stringify(rooms)}
- Allocations: ${JSON.stringify(allocations)}
- Attendance: ${JSON.stringify(attendance)}
- Complaints: ${JSON.stringify(complaints)}
- Visitors: ${JSON.stringify(visitors)}
- Fees: ${JSON.stringify(fees)}
- Mess Menu: ${JSON.stringify(messMenu)}
`;

    const systemPrompt = `You are AuraHost's premium AI Assistant. You help hostel students, wardens, admins, and mess managers.
You have direct, real-time access to the hostel database state. Use the database context provided to answer questions accurately.
When asked about statistics (e.g., vacant rooms, count of students, number of complaints, today's menu, fee status), calculate them dynamically based on the context.
Keep your answers brief, modern, clear, and professional. Format your response using clean Markdown.
Always be friendly and helpful.

${contextText}`;

    // Get API Key from authorization header or env variables
    const authHeader = req.headers.get('Authorization');
    const clientApiKey = authHeader ? authHeader.replace('Bearer ', '').trim() : '';
    const apiKey = clientApiKey || process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured on server or client.' }, { status: 500 });
    }

    // Call OpenAI Chat API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `OpenAI API returned error: ${errText}` }, { status: response.status });
    }

    // Return the readable stream directly to the client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error('Chat API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
