import { NextRequest, NextResponse } from 'next/server';
import { getDbServer } from '../../../lib/dbServer';

async function handleRequest(req: NextRequest, routePath: string[], method: string) {
  const db = getDbServer(req);
  const path = routePath.join('/');
  
  try {
    let body: any = {};
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      try {
        body = await req.json();
      } catch (err) {
        // Fallback for requests without JSON body
        body = {};
      }
    }
    const searchParams = req.nextUrl.searchParams;

    switch (path) {
      // -------------------------------------------------------------
      // AUTH
      // -------------------------------------------------------------
      case 'auth/login': {
        if (method !== 'POST') return methodNotAllowed();
        const res = await db.login(body.email, body.role);
        return NextResponse.json(res);
      }
      case 'auth/register': {
        if (method !== 'POST') return methodNotAllowed();
        const res = await db.register(body.email, body.name, body.role, body.phone, body.gender);
        return NextResponse.json(res);
      }
      case 'auth/me': {
        if (method !== 'GET') return methodNotAllowed();
        const userId = req.headers.get('x-user-id') || searchParams.get('userId') || '';
        if (!userId) return badRequest('Missing x-user-id header or userId parameter');
        const user = await db.getCurrentUser(userId);
        return NextResponse.json(user);
      }

      // -------------------------------------------------------------
      // HOSTELS
      // -------------------------------------------------------------
      case 'hostels': {
        if (method === 'GET') {
          const hostels = await db.getHostels();
          return NextResponse.json(hostels);
        }
        if (method === 'POST') {
          const hostel = await db.addHostel(body.name, body.location, body.type);
          return NextResponse.json(hostel);
        }
        return methodNotAllowed();
      }

      // -------------------------------------------------------------
      // ROOMS
      // -------------------------------------------------------------
      case 'rooms': {
        if (method === 'GET') {
          const hostelId = searchParams.get('hostelId') || undefined;
          const rooms = await db.getRooms(hostelId);
          return NextResponse.json(rooms);
        }
        if (method === 'POST') {
          const room = await db.addRoom(body.hostelId, body.roomNumber, Number(body.floor), Number(body.capacity));
          return NextResponse.json(room);
        }
        if (method === 'PATCH') {
          const room = await db.updateRoom(body.roomId, body.updates);
          return NextResponse.json(room);
        }
        return methodNotAllowed();
      }

      // -------------------------------------------------------------
      // ALLOCATIONS
      // -------------------------------------------------------------
      case 'allocations': {
        if (method === 'GET') {
          const allocations = await db.getAllocations();
          return NextResponse.json(allocations);
        }
        if (method === 'POST') {
          const allocation = await db.allocateRoom(body.studentId, body.roomId);
          return NextResponse.json(allocation);
        }
        if (method === 'DELETE' || (method === 'POST' && searchParams.get('action') === 'vacate')) {
          const allocationId = searchParams.get('allocationId') || body.allocationId || '';
          if (!allocationId) return badRequest('Missing allocationId');
          const success = await db.vacateRoom(allocationId);
          return NextResponse.json({ success });
        }
        return methodNotAllowed();
      }

      // -------------------------------------------------------------
      // ATTENDANCE
      // -------------------------------------------------------------
      case 'attendance': {
        if (method === 'GET') {
          const studentId = searchParams.get('studentId') || undefined;
          const date = searchParams.get('date') || undefined;
          const attendance = await db.getAttendance(studentId, date);
          return NextResponse.json(attendance);
        }
        if (method === 'POST') {
          const record = await db.recordAttendance(body.studentId, body.status, body.checkIn, body.checkOut);
          return NextResponse.json(record);
        }
        return methodNotAllowed();
      }

      // -------------------------------------------------------------
      // COMPLAINTS
      // -------------------------------------------------------------
      case 'complaints': {
        if (method === 'GET') {
          const studentId = searchParams.get('studentId') || undefined;
          const assignedTo = searchParams.get('assignedTo') || undefined;
          const complaints = await db.getComplaints(studentId, assignedTo);
          return NextResponse.json(complaints);
        }
        if (method === 'POST') {
          const complaint = await db.addComplaint(body.studentId, body.category, body.description);
          return NextResponse.json(complaint);
        }
        if (method === 'PATCH') {
          const complaint = await db.updateComplaintStatus(body.complaintId, body.status, body.assignedTo, body.resolvedAt);
          return NextResponse.json(complaint);
        }
        return methodNotAllowed();
      }

      // -------------------------------------------------------------
      // VISITORS
      // -------------------------------------------------------------
      case 'visitors': {
        if (method === 'GET') {
          const studentId = searchParams.get('studentId') || undefined;
          const visitors = await db.getVisitors(studentId);
          return NextResponse.json(visitors);
        }
        if (method === 'POST') {
          const visitor = await db.addVisitor(body.visitorName, body.phone, body.studentId, body.purpose);
          return NextResponse.json(visitor);
        }
        if (method === 'PATCH') {
          const visitor = await db.updateVisitorStatus(body.visitorId, body.status, body.entryTime, body.exitTime);
          return NextResponse.json(visitor);
        }
        return methodNotAllowed();
      }

      // -------------------------------------------------------------
      // FEES
      // -------------------------------------------------------------
      case 'fees': {
        if (method === 'GET') {
          const studentId = searchParams.get('studentId') || undefined;
          const fees = await db.getFees(studentId);
          return NextResponse.json(fees);
        }
        if (method === 'POST') {
          const fee = await db.addFee(body.studentId, Number(body.amount), body.dueDate);
          return NextResponse.json(fee);
        }
        if (method === 'PATCH' || (method === 'POST' && searchParams.get('action') === 'pay')) {
          const feeId = body.feeId || searchParams.get('feeId') || '';
          if (!feeId) return badRequest('Missing feeId');
          const fee = await db.payFee(feeId);
          return NextResponse.json(fee);
        }
        return methodNotAllowed();
      }

      // -------------------------------------------------------------
      // MESS MENU & FEEDBACK
      // -------------------------------------------------------------
      case 'mess/menu': {
        if (method === 'GET') {
          const menu = await db.getMessMenu();
          return NextResponse.json(menu);
        }
        if (method === 'POST') {
          const menu = await db.updateMessMenu(body.dayOfWeek, body.breakfast, body.lunch, body.dinner);
          return NextResponse.json(menu);
        }
        return methodNotAllowed();
      }
      case 'mess/feedback': {
        if (method === 'GET') {
          const mealType = searchParams.get('mealType') || undefined;
          const date = searchParams.get('date') || undefined;
          const feedback = await db.getMessFeedback(mealType, date);
          return NextResponse.json(feedback);
        }
        if (method === 'POST') {
          const feedback = await db.addMessFeedback(body.studentId, body.mealType, Number(body.rating), body.comment);
          return NextResponse.json(feedback);
        }
        return methodNotAllowed();
      }

      // -------------------------------------------------------------
      // NOTIFICATIONS
      // -------------------------------------------------------------
      case 'notifications': {
        if (method === 'GET') {
          const userId = searchParams.get('userId') || req.headers.get('x-user-id') || '';
          if (!userId) return badRequest('Missing userId parameter or x-user-id header');
          const notifications = await db.getNotifications(userId);
          return NextResponse.json(notifications);
        }
        if (method === 'POST') {
          const notification = await db.addNotification(body.userId, body.title, body.message, body.type);
          return NextResponse.json(notification);
        }
        if (method === 'PATCH' || (method === 'POST' && searchParams.get('action') === 'read')) {
          const notificationId = body.notificationId || searchParams.get('notificationId') || '';
          if (!notificationId) return badRequest('Missing notificationId');
          const success = await db.markNotificationAsRead(notificationId);
          return NextResponse.json({ success });
        }
        return methodNotAllowed();
      }

      default:
        return NextResponse.json({ error: `Route not found: ${path}` }, { status: 404 });
    }
  } catch (e: any) {
    console.error(`API execution error on ${method} ${path}:`, e);
    return NextResponse.json({ error: e.message || 'Server error occurred' }, { status: 500 });
  }
}

function methodNotAllowed() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(req: NextRequest, props: { params: Promise<{ route: string[] }> }) {
  const params = await props.params;
  return handleRequest(req, params.route, 'GET');
}

export async function POST(req: NextRequest, props: { params: Promise<{ route: string[] }> }) {
  const params = await props.params;
  return handleRequest(req, params.route, 'POST');
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ route: string[] }> }) {
  const params = await props.params;
  return handleRequest(req, params.route, 'PATCH');
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ route: string[] }> }) {
  const params = await props.params;
  return handleRequest(req, params.route, 'DELETE');
}
