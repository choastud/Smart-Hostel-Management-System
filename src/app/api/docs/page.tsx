'use client';

import React, { useState, useEffect } from 'react';
import { 
  Terminal, ShieldCheck, Database, Play, Info,
  Key, RefreshCw, Send, CheckCircle, AlertCircle, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface Endpoint {
  name: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  defaultHeaders: { [key: string]: string };
  defaultBody: string;
  queryParams?: { name: string; placeholder: string; required?: boolean }[];
}

const ENDPOINTS: { [category: string]: Endpoint[] } = {
  Auth: [
    {
      name: 'User Login',
      method: 'POST',
      path: '/api/auth/login',
      description: 'Log in with predefined credentials sandbox to receive user profile.',
      defaultHeaders: {},
      defaultBody: JSON.stringify({ email: 'student@hostel.com', role: 'student' }, null, 2)
    },
    {
      name: 'User Registration',
      method: 'POST',
      path: '/api/auth/register',
      description: 'Register a new hostel occupant. If role is student and gender matching block is vacant, auto-allocates a bed slot.',
      defaultHeaders: {},
      defaultBody: JSON.stringify({
        email: 'priya.sharma@hostel.com',
        name: 'Priya Sharma',
        role: 'student',
        phone: '9876543222',
        gender: 'female'
      }, null, 2)
    },
    {
      name: 'Get Current Profile',
      method: 'GET',
      path: '/api/auth/me',
      description: 'Fetch the active profile details. Requires x-user-id header or query string.',
      defaultHeaders: { 'x-user-id': 'usr_student1' },
      defaultBody: '',
      queryParams: [{ name: 'userId', placeholder: 'usr_student1 (Optional if header is set)' }]
    }
  ],
  Hostels: [
    {
      name: 'List Hostel Blocks',
      method: 'GET',
      path: '/api/hostels',
      description: 'Get all boys and girls hostel blocks registered in the database.',
      defaultHeaders: {},
      defaultBody: ''
    },
    {
      name: 'Create Hostel Block',
      method: 'POST',
      path: '/api/hostels',
      description: 'Register a new hostel block (Admin access required in prod). Defaults block type by name check ("girls" or "boys").',
      defaultHeaders: {},
      defaultBody: JSON.stringify({
        name: 'Girls Hostel - Block C',
        location: 'West Campus',
        type: 'girls'
      }, null, 2)
    }
  ],
  Rooms: [
    {
      name: 'List Bed Rooms',
      method: 'GET',
      path: '/api/rooms',
      description: 'Get rooms list. Optionally filter by hostel block ID.',
      defaultHeaders: {},
      defaultBody: '',
      queryParams: [{ name: 'hostelId', placeholder: 'hostel_boys_a' }]
    },
    {
      name: 'Register Room Slot',
      method: 'POST',
      path: '/api/rooms',
      description: 'Add a new vacant room into a specific hostel block.',
      defaultHeaders: {},
      defaultBody: JSON.stringify({
        hostelId: 'hostel_boys_a',
        roomNumber: '103',
        floor: 1,
        capacity: 3
      }, null, 2)
    },
    {
      name: 'Update Room Parameters',
      method: 'PATCH',
      path: '/api/rooms',
      description: 'Update capacity or occupancy metadata manually.',
      defaultHeaders: {},
      defaultBody: JSON.stringify({
        roomId: 'room_101',
        updates: {
          occupied: 2
        }
      }, null, 2)
    }
  ],
  Allocations: [
    {
      name: 'List Active Allocations',
      method: 'GET',
      path: '/api/allocations',
      description: 'Get all resident room allocations in the building.',
      defaultHeaders: {},
      defaultBody: ''
    },
    {
      name: 'Allocate Resident Room',
      method: 'POST',
      path: '/api/allocations',
      description: 'Allocates student to room. Automatically checks for room capacity and gender block compatibility.',
      defaultHeaders: {},
      defaultBody: JSON.stringify({
        studentId: 'usr_student2',
        roomId: 'room_201'
      }, null, 2)
    },
    {
      name: 'Vacate Resident',
      method: 'DELETE',
      path: '/api/allocations',
      description: 'Vacates an active assignment and decrements room occupancy.',
      defaultHeaders: {},
      defaultBody: '',
      queryParams: [{ name: 'allocationId', placeholder: 'alloc_1', required: true }]
    }
  ],
  Attendance: [
    {
      name: 'Get Daily Attendance',
      method: 'GET',
      path: '/api/attendance',
      description: 'Fetch student check-ins. Filter by studentId or date.',
      defaultHeaders: {},
      defaultBody: '',
      queryParams: [
        { name: 'studentId', placeholder: 'usr_student1' },
        { name: 'date', placeholder: '2026-05-25' }
      ]
    },
    {
      name: 'Record Check-in/Check-out',
      method: 'POST',
      path: '/api/attendance',
      description: 'Logs present/absent/late gates and checks time stamps.',
      defaultHeaders: {},
      defaultBody: JSON.stringify({
        studentId: 'usr_student1',
        status: 'present',
        checkIn: new Date().toISOString()
      }, null, 2)
    }
  ],
  Complaints: [
    {
      name: 'Get Student Complaints',
      method: 'GET',
      path: '/api/complaints',
      description: 'Get all logs. Optionally filter by studentId or staff assignment.',
      defaultHeaders: {},
      defaultBody: '',
      queryParams: [
        { name: 'studentId', placeholder: 'usr_student1' },
        { name: 'assignedTo', placeholder: 'usr_warden' }
      ]
    },
    {
      name: 'File New Complaint',
      method: 'POST',
      path: '/api/complaints',
      description: 'Student registers a repair request. Wardens will receive automatic dashboard notifications.',
      defaultHeaders: {},
      defaultBody: JSON.stringify({
        studentId: 'usr_student1',
        category: 'Plumbing',
        description: 'Bathroom tap is completely broken and leaking.'
      }, null, 2)
    },
    {
      name: 'Resolve/Assign Ticket',
      method: 'PATCH',
      path: '/api/complaints',
      description: 'Update complaint status and assign maintenance workers.',
      defaultHeaders: {},
      defaultBody: JSON.stringify({
        complaintId: 'comp_1',
        status: 'in_progress',
        assignedTo: 'usr_warden'
      }, null, 2)
    }
  ],
  Visitors: [
    {
      name: 'Get Gate Logs',
      method: 'GET',
      path: '/api/visitors',
      description: 'List visitor entries. Filter by studentId to check personal requests.',
      defaultHeaders: {},
      defaultBody: '',
      queryParams: [{ name: 'studentId', placeholder: 'usr_student1' }]
    },
    {
      name: 'Request Entry Pass',
      method: 'POST',
      path: '/api/visitors',
      description: 'Security registers guest. Prompts the hosting student for approval.',
      defaultHeaders: {},
      defaultBody: JSON.stringify({
        visitorName: 'Rajesh Reddy',
        phone: '9822222222',
        studentId: 'usr_student2',
        purpose: 'Guardian drop-off'
      }, null, 2)
    },
    {
      name: 'Approve/Check-out Guest',
      method: 'PATCH',
      path: '/api/visitors',
      description: 'Approve visitor log or record their exit checkout time.',
      defaultHeaders: {},
      defaultBody: JSON.stringify({
        visitorId: 'vis_1',
        status: 'approved',
        entryTime: new Date().toISOString()
      }, null, 2)
    }
  ],
  Fees: [
    {
      name: 'Fetch Student Invoices',
      method: 'GET',
      path: '/api/fees',
      description: 'List billing ledger records. Filter by studentId.',
      defaultHeaders: {},
      defaultBody: '',
      queryParams: [{ name: 'studentId', placeholder: 'usr_student1' }]
    },
    {
      name: 'Generate Bill',
      method: 'POST',
      path: '/api/fees',
      description: 'Raise a fee invoice for a resident.',
      defaultHeaders: {},
      defaultBody: JSON.stringify({
        studentId: 'usr_student1',
        amount: 25000,
        dueDate: '2026-06-30'
      }, null, 2)
    },
    {
      name: 'Process Fee Payment',
      method: 'PATCH',
      path: '/api/fees',
      description: 'Pay off a pending invoice and generate receipt URL.',
      defaultHeaders: {},
      defaultBody: JSON.stringify({
        feeId: 'fee_1'
      }, null, 2)
    }
  ],
  Mess: [
    {
      name: 'Get Weekly Meal Menu',
      method: 'GET',
      path: '/api/mess/menu',
      description: 'Retrieve mess breakfast, lunch, and dinner items scheduled for the week.',
      defaultHeaders: {},
      defaultBody: ''
    },
    {
      name: 'Update Menu Plan',
      method: 'POST',
      path: '/api/mess/menu',
      description: 'Update breakfast, lunch, and dinner recipes for a specific day of the week.',
      defaultHeaders: {},
      defaultBody: JSON.stringify({
        dayOfWeek: 'Monday',
        breakfast: 'Pancake, Honey, Milk',
        lunch: 'White Rice, Dal Palak, Potato Fry, Curd',
        dinner: 'Jeera Roti, Veg Kurma, Rabri'
      }, null, 2)
    },
    {
      name: 'Get Meal Feedback',
      method: 'GET',
      path: '/api/mess/feedback',
      description: 'Fetch student mess ratings and comments.',
      defaultHeaders: {},
      defaultBody: '',
      queryParams: [
        { name: 'mealType', placeholder: 'lunch' },
        { name: 'date', placeholder: '2026-05-25' }
      ]
    },
    {
      name: 'Submit Food Review',
      method: 'POST',
      path: '/api/mess/feedback',
      description: 'Occupy rating index and comment on the cafeteria menu.',
      defaultHeaders: {},
      defaultBody: JSON.stringify({
        studentId: 'usr_student1',
        mealType: 'breakfast',
        rating: 5,
        comment: 'Excellent pancake fluffiness today!'
      }, null, 2)
    }
  ],
  Notifications: [
    {
      name: 'Fetch User Inbox',
      method: 'GET',
      path: '/api/notifications',
      description: 'Get notification feeds. Requires x-user-id header or query string.',
      defaultHeaders: { 'x-user-id': 'usr_student1' },
      defaultBody: '',
      queryParams: [{ name: 'userId', placeholder: 'usr_student1' }]
    },
    {
      name: 'Mark Alert as Read',
      method: 'PATCH',
      path: '/api/notifications',
      description: 'Mark notification status to read (hides alert indicators).',
      defaultHeaders: {},
      defaultBody: JSON.stringify({
        notificationId: 'not_1'
      }, null, 2)
    }
  ]
};

export default function ApiDocsPage() {
  const [activeCategory, setActiveCategory] = useState<string>('Auth');
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(ENDPOINTS['Auth'][0]);
  
  // Console Inputs state
  const [customHeaders, setCustomHeaders] = useState<string>('{}');
  const [customBody, setCustomBody] = useState<string>('');
  const [queryParamsValues, setQueryParamsValues] = useState<{ [key: string]: string }>({});
  
  // Execution Response state
  const [loading, setLoading] = useState<boolean>(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<string>('');
  
  // Supabase dynamic inputs (for sandbox headers config override)
  const [customDbUrl, setCustomDbUrl] = useState<string>('');
  const [customDbKey, setCustomDbKey] = useState<string>('');
  const [dbMode, setDbMode] = useState<string>('loading');

  useEffect(() => {
    // Read local storage config on mount
    if (typeof window !== 'undefined') {
      const url = localStorage.getItem('shms_supabase_url') || '';
      const key = localStorage.getItem('shms_supabase_anon_key') || '';
      setCustomDbUrl(url);
      setCustomDbKey(key);
      setDbMode(url && key ? 'supabase' : 'local_file');
    }
  }, []);

  // Update endpoint body when selected endpoint changes
  useEffect(() => {
    setCustomBody(selectedEndpoint.defaultBody);
    
    // Prefill headers string
    const headersObj = { ...selectedEndpoint.defaultHeaders };
    setCustomHeaders(JSON.stringify(headersObj, null, 2));

    // Reset query parameters inputs
    const paramInit: { [key: string]: string } = {};
    if (selectedEndpoint.queryParams) {
      selectedEndpoint.queryParams.forEach(p => {
        paramInit[p.name] = '';
      });
    }
    setQueryParamsValues(paramInit);
    
    // Clear console output
    setResponseStatus(null);
    setResponseBody('');
  }, [selectedEndpoint]);

  const handleExecuteRequest = async () => {
    setLoading(true);
    setResponseBody('');
    setResponseStatus(null);

    try {
      // Build headers
      let headersMap: { [key: string]: string } = {
        'Content-Type': 'application/json'
      };

      // Add database headers if active
      if (customDbUrl && customDbKey) {
        headersMap['x-supabase-url'] = customDbUrl;
        headersMap['x-supabase-anon-key'] = customDbKey;
      }

      // Add endpoint custom headers
      try {
        const parsedCustom = JSON.parse(customHeaders);
        headersMap = { ...headersMap, ...parsedCustom };
      } catch (err) {
        console.warn('Headers text is not valid JSON, skipping custom values');
      }

      // Build Query String
      let url = selectedEndpoint.path;
      const qParams = new URLSearchParams();
      Object.keys(queryParamsValues).forEach(k => {
        const val = queryParamsValues[k];
        if (val.trim()) {
          qParams.append(k, val.trim());
        }
      });
      const qStr = qParams.toString();
      if (qStr) {
        url += '?' + qStr;
      }

      // Prepare request payload
      const requestOptions: RequestInit = {
        method: selectedEndpoint.method,
        headers: headersMap
      };

      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(selectedEndpoint.method) && customBody.trim()) {
        requestOptions.body = customBody;
      }

      const startTime = Date.now();
      const res = await fetch(url, requestOptions);
      const timeTaken = Date.now() - startTime;
      
      setResponseStatus(res.status);

      let textResult = '';
      try {
        const jsonResult = await res.json();
        textResult = JSON.stringify(jsonResult, null, 2);
      } catch (err) {
        textResult = await res.text();
      }

      setResponseBody(`// Status Code: ${res.status} ${res.statusText}\n// Time: ${timeTaken}ms\n\n${textResult}`);
    } catch (e: any) {
      setResponseBody(`// Network/Client Error\n\n${e.message || e}`);
      setResponseStatus(500);
    } finally {
      setLoading(false);
    }
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
      case 'POST': return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30';
      case 'PATCH': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';
      case 'DELETE': return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-100 dark:border-red-900/30';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col transition-colors duration-300">
      
      {/* Visual Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-sm shadow shadow-blue-500/20">
            AH
          </div>
          <div>
            <span className="font-extrabold text-sm block tracking-tight">AuraHost System</span>
            <span className="text-[10px] text-blue-400 block tracking-wider uppercase font-extrabold flex items-center gap-1">
              <Terminal size={10} /> API Document Playground
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-full border text-[10px] font-bold flex items-center gap-1.5 ${
            dbMode === 'supabase'
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40'
              : 'bg-amber-950/40 text-amber-400 border-amber-900/40'
          }`}>
            <Database size={12} />
            Server Database Mode: {dbMode === 'supabase' ? 'Supabase cloud' : 'Local file (db.json)'}
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-[calc(100vh-69px)]">
        
        {/* Column 1: API Categories & Endpoints Sidebar (Span 3) */}
        <div className="lg:col-span-3 border-r border-slate-800 bg-slate-950/40 overflow-y-auto p-4 space-y-6">
          <div>
            <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2.5">Endpoint Modules</h4>
            <div className="space-y-1">
              {Object.keys(ENDPOINTS).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setSelectedEndpoint(ENDPOINTS[cat][0]);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    activeCategory === cat
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{cat} Operations</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono ${
                    activeCategory === cat ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {ENDPOINTS[cat].length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2.5">Category Endpoints</h4>
            <div className="space-y-1.5">
              {ENDPOINTS[activeCategory].map((ep) => (
                <button
                  key={ep.name}
                  onClick={() => setSelectedEndpoint(ep)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex flex-col gap-1.5 ${
                    selectedEndpoint.name === ep.name
                      ? 'bg-slate-850 border-blue-500 text-white shadow shadow-blue-500/5'
                      : 'bg-slate-900/20 border-slate-800/40 hover:bg-slate-850/50 text-slate-400 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-extrabold font-mono px-1 py-0.5 rounded ${getMethodBadgeClass(ep.method)}`}>
                      {ep.method}
                    </span>
                    <span className="font-bold truncate">{ep.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono truncate">{ep.path}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Details & Input Panel (Span 5) */}
        <div className="lg:col-span-5 border-r border-slate-800 bg-slate-900/20 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-md ${getMethodBadgeClass(selectedEndpoint.method)}`}>
                {selectedEndpoint.method}
              </span>
              <h2 className="text-base font-extrabold text-white">{selectedEndpoint.name}</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{selectedEndpoint.description}</p>
            <div className="p-2.5 bg-slate-850 rounded-xl font-mono text-[10px] text-blue-400 select-all border border-slate-800/60">
              {selectedEndpoint.path}
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Database Environment Overrides */}
          <div className="space-y-3 bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Key size={14} className="text-blue-500" /> Sandbox Database Override Headers
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              If populated, these values are sent as <code>x-supabase-url</code> and <code>x-supabase-anon-key</code> headers to dynamically query a private Supabase instance.
            </p>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <label className="text-[9px] text-slate-500 block mb-1">Supabase Endpoint URL</label>
                <input
                  type="text"
                  placeholder="https://xyz.supabase.co"
                  value={customDbUrl}
                  onChange={(e) => setCustomDbUrl(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-500 block mb-1">Anon Public API Key</label>
                <input
                  type="text"
                  placeholder="eyJhbGciOi..."
                  value={customDbKey}
                  onChange={(e) => setCustomDbKey(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-mono truncate focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Query Parameters Form */}
          {selectedEndpoint.queryParams && selectedEndpoint.queryParams.length > 0 && (
            <div className="space-y-3.5">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Query Parameters</h3>
              <div className="space-y-3">
                {selectedEndpoint.queryParams.map((p) => (
                  <div key={p.name} className="grid grid-cols-3 gap-2 items-center text-xs">
                    <span className="font-mono text-slate-400">
                      {p.name} {p.required && <span className="text-red-500">*</span>}
                    </span>
                    <input
                      type="text"
                      placeholder={p.placeholder}
                      value={queryParamsValues[p.name] || ''}
                      onChange={(e) => setQueryParamsValues({ ...queryParamsValues, [p.name]: e.target.value })}
                      className="col-span-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request Headers Form */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Request Headers (JSON)</h3>
            <textarea
              value={customHeaders}
              onChange={(e) => setCustomHeaders(e.target.value)}
              rows={3}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[10px] text-emerald-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Request Body Form (POST/PATCH) */}
          {['POST', 'PATCH', 'PUT'].includes(selectedEndpoint.method) && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Request JSON Payload Body</h3>
              <textarea
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                rows={7}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-blue-300 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <button
            onClick={handleExecuteRequest}
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2.5 shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 transition-all disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Play size={14} fill="white" />
            )}
            {loading ? 'Executing request...' : 'Run REST API Test'}
          </button>
        </div>

        {/* Column 3: Live Output Viewer Console (Span 4) */}
        <div className="lg:col-span-4 bg-slate-950 flex flex-col h-full overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Console Response Payload</span>
            {responseStatus !== null && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                responseStatus >= 200 && responseStatus < 300 
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50' 
                  : 'bg-red-950 text-red-400 border border-red-900/50'
              }`}>
                HTTP {responseStatus}
              </span>
            )}
          </div>
          
          <div className="flex-1 p-4 overflow-auto font-mono text-[11px] text-slate-300 bg-slate-950 select-text">
            {responseBody ? (
              <pre className="whitespace-pre-wrap">{responseBody}</pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 gap-2 p-6">
                <Terminal size={32} className="stroke-[1.5]" />
                <h4 className="font-extrabold text-xs text-slate-500">Live API Terminal Sandbox</h4>
                <p className="text-[10px] max-w-[200px] leading-relaxed">
                  Configure request parameters on the left and execute the request to view live returns.
                </p>
              </div>
            )}
          </div>
        </div>

      </main>

    </div>
  );
}
