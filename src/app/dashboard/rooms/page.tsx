'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../services/AuthContext';
import { getDbService } from '../../../services/db';
import { Room, Hostel, Allocation, Profile } from '../../../types';
import { 
  Plus, Home, Users, Check, Trash2, ArrowRightLeft, 
  MapPin, ShieldAlert, BadgeInfo 
} from 'lucide-react';

export default function RoomsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  
  // Forms states
  const [newHostelName, setNewHostelName] = useState('');
  const [newHostelLoc, setNewHostelLoc] = useState('');
  const [newHostelType, setNewHostelType] = useState<'boys' | 'girls'>('boys');
  const [newRoomNum, setNewRoomNum] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState('1');
  const [newRoomCap, setNewRoomCap] = useState('3');
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [allocStudentId, setAllocStudentId] = useState('');
  const [allocRoomId, setAllocRoomId] = useState('');

  // Student specific room details
  const [myRoom, setMyRoom] = useState<Room | null>(null);
  const [myRoommates, setMyRoommates] = useState<Profile[]>([]);
  const [transferRequestSent, setTransferRequestSent] = useState(false);
  const [transferDetails, setTransferDetails] = useState('');

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const db = getDbService();

      const rList = await db.getRooms();
      setRooms(rList);

      const hList = await db.getHostels();
      setHostels(hList);
      if (hList.length > 0 && !selectedHostelId) {
        setSelectedHostelId(hList[0].id);
      }

      const aList = await db.getAllocations();
      setAllocations(aList);

      // In LocalStorage or Supabase, get all profiles
      // For simplicity, we filter student profiles
      let allProfiles: Profile[] = [];
      if (db.isSupabaseActive()) {
        const client = (db as any).getSupabaseClient?.(); // dynamic safety
        if (client) {
          const { data } = await client.from('profiles').select('*');
          allProfiles = data || [];
        }
      } else {
        allProfiles = JSON.parse(localStorage.getItem('shms_profiles') || '[]');
      }
      
      const studList = allProfiles.filter(p => p.role === 'student');
      setStudents(studList);

      // Student Room Lookup
      if (user.role === 'student') {
        const myAlloc = aList.find(a => a.student_id === user.id && a.status === 'active');
        if (myAlloc) {
          const rObj = rList.find(rm => rm.id === myAlloc.room_id) || null;
          setMyRoom(rObj);
          
          // Roommates Lookup
          if (rObj) {
            const roommatesAlloc = aList.filter(a => a.room_id === rObj.id && a.student_id !== user.id && a.status === 'active');
            const roommateIds = roommatesAlloc.map(a => a.student_id);
            const roommateProfiles = studList.filter(p => roommateIds.includes(p.id));
            setMyRoommates(roommateProfiles);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle Hostel Creation
  const handleCreateHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHostelName) return;
    try {
      const db = getDbService();
      await db.addHostel(newHostelName, newHostelLoc, newHostelType);
      setNewHostelName('');
      setNewHostelLoc('');
      setNewHostelType('boys');
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Room Creation
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNum || !selectedHostelId) return;
    try {
      const db = getDbService();
      await db.addRoom(selectedHostelId, newRoomNum, Number(newRoomFloor), Number(newRoomCap));
      setNewRoomNum('');
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Room Allocation
  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocStudentId || !allocRoomId) return;
    try {
      const db = getDbService();
      await db.allocateRoom(allocStudentId, allocRoomId);
      setAllocStudentId('');
      setAllocRoomId('');
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Vacating
  const handleVacate = async (allocId: string) => {
    if (!confirm('Are you sure you want to vacate this room allocation?')) return;
    try {
      const db = getDbService();
      await db.vacateRoom(allocId);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter students who don't have active allocations
  const unallocatedStudents = students.filter(s => {
    return !allocations.some(a => a.student_id === s.id && a.status === 'active');
  });

  // Filter rooms that are not full and match student's gender
  const selectedStudent = students.find(s => s.id === allocStudentId);
  const selectedStudentGender = selectedStudent?.gender || 'male';

  const availableRooms = rooms.filter(r => {
    const isRoomNotFull = r.occupied < r.capacity;
    if (!allocStudentId) return isRoomNotFull;

    const hostel = hostels.find(h => h.id === r.hostel_id);
    if (!hostel) return isRoomNotFull;

    return isRoomNotFull && hostel.type === (selectedStudentGender === 'female' ? 'girls' : 'boys');
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-8 items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400">Loading rooms details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* ---------------- STUDENT PORTAL ---------------- */}
      {user?.role === 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Room Info Card */}
          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-6">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Home className="text-blue-500" size={20} />
              My Room Assignment
            </h3>

            {myRoom ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-zinc-850 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Hostel Block</span>
                    <span className="text-sm font-bold mt-1 block">{myRoom.hostel_name}</span>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-zinc-850 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Room Number</span>
                    <span className="text-sm font-bold mt-1 block">{myRoom.room_number}</span>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-zinc-850 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Floor</span>
                    <span className="text-sm font-bold mt-1 block">{myRoom.floor}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Users size={14} /> Roommates ({myRoommates.length})
                  </h4>
                  {myRoommates.length === 0 ? (
                    <p className="text-xs text-slate-400">No roommates allocated yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800/40">
                      {myRoommates.map(rm => (
                        <div key={rm.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold">{rm.name}</div>
                            <div className="text-slate-400 font-mono text-[10px] mt-0.5">{rm.email}</div>
                          </div>
                          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full dark:bg-zinc-800 text-slate-500">
                            {rm.phone || 'No phone'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 bg-slate-50 dark:bg-zinc-850 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-center space-y-2">
                <BadgeInfo size={32} className="text-slate-400 mx-auto" />
                <h4 className="font-bold text-sm">No Active Allocation</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  You are not currently assigned to any room. Please contact the Hostel Admin/Warden to register an allocation.
                </p>
              </div>
            )}
          </div>

          {/* Transfer request form */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ArrowRightLeft className="text-blue-500" size={20} />
                Room Transfer Request
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                If you are unsatisfied with your allocation, you can submit a change request. This alerts the Warden for review.
              </p>

              {transferRequestSent ? (
                <div className="p-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-semibold">
                  Transfer request submitted successfully. Warden will review details shortly.
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Transfer Reason</label>
                  <textarea
                    placeholder="Describe why you need a room change (e.g., floor preference, roommate issues...)"
                    value={transferDetails}
                    onChange={(e) => setTransferDetails(e.target.value)}
                    rows={4}
                    className="w-full p-3 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-all resize-none"
                  />
                </div>
              )}
            </div>

            {!transferRequestSent && (
              <button
                disabled={!myRoom || !transferDetails}
                onClick={async () => {
                  if (!transferDetails) return;
                  setTransferRequestSent(true);
                  // Trigger Warden alert notification
                  const db = getDbService();
                  const wardens = students.filter(p => p.role === 'warden');
                  for (const w of wardens) {
                    await db.addNotification(
                      w.id,
                      'Room Transfer Requested',
                      `Student ${user.name} submitted a transfer request. Reason: ${transferDetails}`,
                      'announcement'
                    );
                  }
                }}
                className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Submit Transfer Ticket
              </button>
            )}
          </div>
        </div>
      )}

      {/* ---------------- ADMIN/WARDEN PORTAL ---------------- */}
      {(user?.role === 'admin' || user?.role === 'warden') && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Add Hostel / Room Forms */}
            <div className="space-y-8 lg:col-span-1">
              
              {/* Create Hostel Block */}
              {user?.role === 'admin' && (
                <div className="bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <MapPin size={16} className="text-blue-500" />
                    Register Hostel Block
                  </h3>
                  <form onSubmit={handleCreateHostel} className="space-y-3.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Block Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Boys Hostel A"
                        value={newHostelName}
                        onChange={(e) => setNewHostelName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Campus Location</label>
                      <input
                        type="text"
                        placeholder="e.g. North Zone"
                        value={newHostelLoc}
                        onChange={(e) => setNewHostelLoc(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hostel Type</label>
                      <select
                        value={newHostelType}
                        onChange={(e) => setNewHostelType(e.target.value as 'boys' | 'girls')}
                        className="w-full p-2.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="boys">Boys Block</option>
                        <option value="girls">Girls Block</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors"
                    >
                      Add Hostel Block
                    </button>
                  </form>
                </div>
              )}

              {/* Create Room Block */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Plus size={16} className="text-blue-500" />
                  Register Room
                </h3>
                <form onSubmit={handleCreateRoom} className="space-y-3.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hostel Block</label>
                    <select
                      value={selectedHostelId}
                      onChange={(e) => setSelectedHostelId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      {hostels.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Room No</label>
                      <input
                        type="text"
                        required
                        placeholder="101"
                        value={newRoomNum}
                        onChange={(e) => setNewRoomNum(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Floor</label>
                      <input
                        type="number"
                        required
                        value={newRoomFloor}
                        onChange={(e) => setNewRoomFloor(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Beds</label>
                      <input
                        type="number"
                        required
                        value={newRoomCap}
                        onChange={(e) => setNewRoomCap(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    Add Room Bed
                  </button>
                </form>
              </div>

              {/* Allocate Room Form */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ArrowRightLeft size={16} className="text-blue-500" />
                  Allocate Bed Slot
                </h3>
                <form onSubmit={handleAllocate} className="space-y-3.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Unallocated Resident</label>
                    <select
                      value={allocStudentId}
                      onChange={(e) => setAllocStudentId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">-- Choose student --</option>
                      {unallocatedStudents.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.gender ? s.gender.charAt(0).toUpperCase() + s.gender.slice(1) : 'Male'}) ({s.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Available Rooms</label>
                    <select
                      value={allocRoomId}
                      onChange={(e) => setAllocRoomId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">-- Choose room slot --</option>
                      {availableRooms.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.hostel_name} - Room {r.room_number} (Beds: {r.occupied}/{r.capacity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={!allocStudentId || !allocRoomId}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
                  >
                    Allocate Bed
                  </button>
                </form>
              </div>

            </div>

            {/* Right: Room Occupancy Board & Allocations List */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Room Grid Status */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
                <h3 className="text-sm font-bold tracking-tight">Active Rooms Occupancy Board</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {rooms.length === 0 ? (
                    <p className="text-xs text-slate-400 col-span-full">No rooms registered.</p>
                  ) : (
                    rooms.map(r => {
                      const isFull = r.occupied >= r.capacity;
                      const isEmpty = r.occupied === 0;

                      return (
                        <div key={r.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl dark:bg-zinc-850 dark:border-zinc-800">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm text-slate-800 dark:text-zinc-200">Room {r.room_number}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                              isFull ? 'bg-red-50 text-red-600' : isEmpty ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {isFull ? 'FULL' : isEmpty ? 'EMPTY' : 'VACANCY'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-1">{r.hostel_name} (Floor {r.floor})</span>
                          
                          {/* Progress bar */}
                          <div className="w-full bg-slate-200 dark:bg-zinc-700 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div 
                              className="bg-blue-600 h-full rounded-full transition-all"
                              style={{ width: `${(r.occupied / r.capacity) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-2 text-right">Beds: {r.occupied}/{r.capacity}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Allocations Table */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
                <h3 className="text-sm font-bold tracking-tight">Active Resident Bed Allocations</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 uppercase font-semibold">
                        <th className="py-3 px-2">Student</th>
                        <th className="py-3 px-2">Hostel & Room</th>
                        <th className="py-3 px-2">Assigned Date</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/40">
                      {allocations.filter(a => a.status === 'active').length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400">No active allocations found.</td>
                        </tr>
                      ) : (
                        allocations.filter(a => a.status === 'active').map(alloc => (
                          <tr key={alloc.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                            <td className="py-3.5 px-2">
                              <div className="font-bold">{alloc.student?.name || 'Unknown'}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{alloc.student?.email}</div>
                            </td>
                            <td className="py-3.5 px-2">
                              <div className="font-semibold">{alloc.room?.hostel_name}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">Room {alloc.room?.room_number} (Floor {alloc.room?.floor})</div>
                            </td>
                            <td className="py-3.5 px-2 text-slate-400">
                              {new Date(alloc.assigned_at).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-2 text-right">
                              <button
                                onClick={() => handleVacate(alloc.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors inline-flex items-center justify-center"
                                title="Vacate bed slot"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
