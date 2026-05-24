'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../services/AuthContext';
import { getDbService } from '../../../services/db';
import { Fee, Profile } from '../../../types';
import { 
  CreditCard, Coins, Check, Download, AlertTriangle, 
  Plus, Search, UserCheck, CheckCircle 
} from 'lucide-react';

export default function FeesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);

  // Admin Invoicing state
  const [invoiceStudentId, setInvoiceStudentId] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('25000');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [invoiceSuccess, setInvoiceSuccess] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const db = getDbService();

      let fList: Fee[] = [];
      if (user.role === 'student') {
        fList = await db.getFees(user.id);
      } else {
        fList = await db.getFees();
      }
      setFees(fList);

      // Load student list (for admin invoicing selector)
      let allProfiles: Profile[] = [];
      if (db.isSupabaseActive()) {
        const client = (db as any).getSupabaseClient?.();
        if (client) {
          const { data } = await client.from('profiles').select('*');
          allProfiles = data || [];
        }
      } else {
        allProfiles = JSON.parse(localStorage.getItem('shms_profiles') || '[]');
      }
      const studList = allProfiles.filter(p => p.role === 'student');
      setStudents(studList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle pay fee (Student)
  const handlePayFee = async (feeId: string) => {
    try {
      const db = getDbService();
      await db.payFee(feeId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Payment simulation failed.');
    }
  };

  // Handle raise invoice (Admin)
  const handleRaiseInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceStudentId || !invoiceAmount || !invoiceDueDate) return;

    try {
      const db = getDbService();
      await db.addFee(invoiceStudentId, Number(invoiceAmount), invoiceDueDate);
      setInvoiceStudentId('');
      setInvoiceDueDate('');
      setInvoiceSuccess(true);
      setTimeout(() => setInvoiceSuccess(false), 4000);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to raise fee invoice.');
    }
  };

  // Dummy download receipt script
  const triggerDownloadReceipt = (feeItem: Fee) => {
    alert(`Downloading Official Hostel Fee Receipt\nInvoice ID: ${feeItem.id}\nPaid: Rs. ${feeItem.amount}\nDate: ${feeItem.paid_at ? new Date(feeItem.paid_at).toLocaleDateString() : 'N/A'}`);
  };

  const getStatusBadge = (status: Fee['payment_status']) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'unpaid':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-8 items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400">Loading fees registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      
      {/* ---------------- STUDENT INVOICES PANEL ---------------- */}
      {user?.role === 'student' && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <CreditCard size={16} className="text-blue-500" />
            My Fee Invoices
          </h3>
          
          <div className="space-y-4">
            {fees.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">No invoice history found.</p>
            ) : (
              fees.map(fee => (
                <div key={fee.id} className="p-5 bg-slate-50 border border-slate-100 rounded-xl dark:bg-zinc-850 dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Invoice Ref</div>
                    <div className="font-extrabold text-sm text-slate-800 dark:text-zinc-200">Rs. {fee.amount.toLocaleString()}</div>
                    <span className="text-[10px] text-slate-400 block pt-1">
                      Due Date: <span className="font-bold">{fee.due_date}</span>
                    </span>
                    {fee.paid_at && (
                      <span className="text-[9px] text-emerald-600 block dark:text-emerald-400">
                        Paid on: {new Date(fee.paid_at).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold capitalize border ${getStatusBadge(fee.payment_status)}`}>
                      {fee.payment_status}
                    </span>

                    {fee.payment_status !== 'paid' ? (
                      <button
                        onClick={() => handlePayFee(fee.id)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition-colors"
                      >
                        Pay (Checkout Sim)
                      </button>
                    ) : (
                      <button
                        onClick={() => triggerDownloadReceipt(fee)}
                        className="p-2 text-blue-600 hover:bg-slate-100 rounded-lg dark:text-blue-400 dark:hover:bg-zinc-800 flex items-center justify-center"
                        title="Download Receipt"
                      >
                        <Download size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------- ADMIN INVOICING PANEL ---------------- */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Raise Invoice Form */}
          <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Plus size={16} className="text-blue-500" />
              Generate Fee Invoice
            </h3>
            
            {invoiceSuccess && (
              <div className="p-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-semibold">
                Invoice generated. Student notified.
              </div>
            )}

            <form onSubmit={handleRaiseInvoice} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Select Student</label>
                <select
                  value={invoiceStudentId}
                  onChange={(e) => setInvoiceStudentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">-- Choose resident student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email.split('@')[0]})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Invoice Amount (Rs.)</label>
                <input
                  type="number"
                  required
                  placeholder="25000"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={invoiceDueDate}
                  onChange={(e) => setInvoiceDueDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={!invoiceStudentId || !invoiceAmount || !invoiceDueDate}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
              >
                Raise Invoice
              </button>
            </form>
          </div>

          {/* Audit trail Table */}
          <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold tracking-tight">Active Fee Collections Ledger</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-2">Resident student</th>
                    <th className="py-3 px-2">Amount (Rs.)</th>
                    <th className="py-3 px-2">Due Date</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Receipt Info</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/40">
                  {fees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">No invoices generated.</td>
                    </tr>
                  ) : (
                    fees.map(f => (
                      <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                        <td className="py-3.5 px-2 font-bold">{f.student_name}</td>
                        <td className="py-3.5 px-2 font-semibold">Rs. {f.amount.toLocaleString()}</td>
                        <td className="py-3.5 px-2 text-slate-400">{f.due_date}</td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold capitalize border ${getStatusBadge(f.payment_status)}`}>
                            {f.payment_status}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-slate-400">
                          {f.payment_status === 'paid' ? (
                            <button
                              onClick={() => triggerDownloadReceipt(f)}
                              className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                            >
                              <Download size={12} /> Receipt
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-300">Pending payment</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
