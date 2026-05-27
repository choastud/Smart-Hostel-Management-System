import { NextRequest, NextResponse } from 'next/server';
import { getDbServer } from '@/lib/dbServer';

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }
    
    const { messages } = body;
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing or invalid messages parameter' }, { status: 400 });
    }

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
    let clientApiKey = authHeader ? authHeader.replace('Bearer ', '').trim() : '';
    
    // Safety check: if client sent literal string "undefined" or "null", treat it as empty
    if (clientApiKey.toLowerCase() === 'undefined' || clientApiKey.toLowerCase() === 'null') {
      clientApiKey = '';
    }
    
    // Check multiple env variables: OpenAI, Groq, gXAI, or XAI keys
    const openAiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const groqEnvKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
    const rawXAiKey = process.env.gXAI_API_KEY || process.env.XAI_API_KEY;
    
    // Auto-detect and auto-correct Groq key copy-paste typos (prepending 'g' to 'sk_gSCg...')
    let xAiKey = rawXAiKey;
    let groqKeyFromXai = '';
    if (rawXAiKey && rawXAiKey.startsWith('sk_gSCg')) {
      groqKeyFromXai = 'g' + rawXAiKey;
    }

    const apiKey = clientApiKey || groqEnvKey || groqKeyFromXai || xAiKey || openAiKey;

    if (!apiKey) {
      // -------------------------------------------------------------
      // MOCK AI STREAMING RESPONSE MODE (Fallback when OpenAI Key is missing)
      // -------------------------------------------------------------
      const userMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
      let reply = "Hello! I am AuraHost's database copilot. *(Running in Database Demo Mode because no OpenAI API key is configured in .env.local)*.\n\n";

      if (userMessage.includes('room') || userMessage.includes('vacant') || userMessage.includes('occupancy') || userMessage.includes('where')) {
        const totalRooms = rooms.length;
        const occupiedSlots = rooms.reduce((acc: number, r: any) => acc + (r.occupied || 0), 0);
        const vacantRooms = rooms.filter((r: any) => r.occupied < r.capacity);
        reply += `### Room Occupancy Report\n- **Total Rooms**: ${totalRooms}\n- **Occupied Bed Slots**: ${occupiedSlots}\n- **Vacant Rooms**: ${vacantRooms.length} rooms are currently vacant.\n\nWould you like me to help allocate a room or display names of occupants?`;
      } else if (userMessage.includes('attendance') || userMessage.includes('absent') || userMessage.includes('present') || userMessage.includes('name')) {
        const presentList = attendance.filter((a: any) => a.status === 'present');
        const absentList = attendance.filter((a: any) => a.status === 'absent');
        
        reply += `### Attendance & Roster Report\n- **Present Students**: ${presentList.length}\n- **Absent Students**: ${absentList.length}\n\n`;
        if (presentList.length > 0) {
          reply += `Here are the active student records present:\n`;
          presentList.forEach((p: any) => {
            reply += `- Student ID: **${p.student_id}** (Status: Present, Check-in: ${p.check_in ? new Date(p.check_in).toLocaleTimeString() : 'N/A'})\n`;
          });
        }
      } else if (userMessage.includes('menu') || userMessage.includes('mess') || userMessage.includes('food') || userMessage.includes('eat')) {
        reply += `### Weekly Mess Menu\n`;
        if (messMenu.length === 0) {
          reply += `*No menu items registered.*`;
        } else {
          messMenu.forEach((m: any) => {
            reply += `- **${m.day_of_week}**:\n  - Breakfast: *${m.breakfast || 'N/A'}*\n  - Lunch: *${m.lunch || 'N/A'}*\n  - Dinner: *${m.dinner || 'N/A'}*\n`;
          });
        }
      } else if (userMessage.includes('complaint') || userMessage.includes('issue') || userMessage.includes('broken')) {
        const pending = complaints.filter((c: any) => c.status === 'pending');
        const inProgress = complaints.filter((c: any) => c.status === 'in_progress');
        reply += `### Complaint Summary\n- **Pending**: ${pending.length}\n- **In Progress**: ${inProgress.length}\n\n`;
        if (pending.length > 0) {
          reply += `Pending Issues:\n`;
          pending.forEach((c: any) => {
            reply += `- **${c.category}**: "${c.description}" *(ID: ${c.id})*\n`;
          });
        }
      } else if (userMessage.includes('visitor') || userMessage.includes('guest')) {
        const pending = visitors.filter((v: any) => v.status === 'pending');
        reply += `### Visitor Logs & Entries\n- Total Entry Logs: **${visitors.length}**\n- Pending Warden Approvals: **${pending.length}**\n\n`;
        if (pending.length > 0) {
          reply += `Pending Requests:\n`;
          pending.forEach((v: any) => {
            reply += `- **${v.visitor_name}** (Purpose: ${v.purpose || 'Personal'}, Phone: ${v.phone})\n`;
          });
        }
      } else if (userMessage.includes('fee') || userMessage.includes('due') || userMessage.includes('money')) {
        const unpaid = fees.filter((f: any) => f.payment_status === 'unpaid');
        reply += `### Outstanding Fees\nThere are currently **${unpaid.length}** unpaid fee entries.\n`;
        unpaid.forEach((f: any) => {
          reply += `- Student ID: **${f.student_id}** — Amount: **$${f.amount}** (Due: ${f.due_date})\n`;
        });
      } else {
        reply += `I am connected to the live database. You can ask me:\n- “*Which rooms are vacant?*”\n- “*What is the mess menu?*”\n- “*List pending complaints*”\n- “*Show attendance and names*”\n- “*Check unpaid fees*”`;
      }

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const words = reply.split(' ');
          for (let i = 0; i < words.length; i++) {
            const chunk = {
              choices: [
                {
                  delta: {
                    content: (i === 0 ? "" : " ") + words[i]
                  }
                }
              ]
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            await new Promise((resolve) => setTimeout(resolve, 30));
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Select base URL and model based on key type
    let apiUrl = 'https://api.openai.com/v1/chat/completions';
    let modelName = 'gpt-4o-mini';

    // Auto-detect if key is from Groq (starts with gsk_ or detected through raw xAi key correction)
    const isGroq = apiKey.startsWith('gsk_') || !!groqEnvKey || !!groqKeyFromXai;
    // Auto-detect if key is from xAI/Grok (starts with xai-)
    const isXAi = apiKey.startsWith('xai-') || (!!xAiKey && !isGroq);

    if (isGroq) {
      apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      modelName = 'llama-3.3-70b-versatile';
    } else if (isXAi) {
      apiUrl = 'https://api.x.ai/v1/chat/completions';
      modelName = 'grok-beta';
    }

    // Call Chat completions API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
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
