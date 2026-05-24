'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../services/AuthContext';
import { getDbService } from '../../../services/db';
import { MessMenu, MessFeedback } from '../../../types';
import { 
  Utensils, Sparkles, Star, Edit, Save, 
  MessageSquare, BarChart3, AlertCircle 
} from 'lucide-react';

export default function MessPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<MessMenu[]>([]);
  const [feedbacks, setFeedbacks] = useState<MessFeedback[]>([]);

  // Mess Manager Edit state
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editBreakfast, setEditBreakfast] = useState('');
  const [editLunch, setEditLunch] = useState('');
  const [editDinner, setEditDinner] = useState('');

  // Student Feedback Form state
  const [fbMealType, setFbMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('breakfast');
  const [fbRating, setFbRating] = useState(5);
  const [fbComment, setFbComment] = useState('');
  const [fbSuccess, setFbSuccess] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const db = getDbService();

      const mList = await db.getMessMenu();
      setMenu(mList);

      const fList = await db.getMessFeedback();
      setFeedbacks(fList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Edit Menu Trigger (Mess Manager)
  const startEditing = (dayItem: MessMenu) => {
    setEditingDay(dayItem.day_of_week);
    setEditBreakfast(dayItem.breakfast);
    setEditLunch(dayItem.lunch);
    setEditDinner(dayItem.dinner);
  };

  // Save Menu (Mess Manager)
  const saveMenu = async (day: string) => {
    try {
      const db = getDbService();
      await db.updateMessMenu(day, editBreakfast, editLunch, editDinner);
      setEditingDay(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update menu.');
    }
  };

  // Submit Feedback (Student)
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const db = getDbService();
      await db.addMessFeedback(user!.id, fbMealType, fbRating, fbComment);
      setFbSuccess(true);
      setFbComment('');
      setFbRating(5);
      setTimeout(() => setFbSuccess(false), 4000);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit feedback.');
    }
  };

  // Calculate Average Rating per meal type
  const getAverageRating = (meal: 'breakfast' | 'lunch' | 'dinner') => {
    const mealFbs = feedbacks.filter(f => f.meal_type === meal);
    if (mealFbs.length === 0) return 0;
    const sum = mealFbs.reduce((acc, f) => acc + f.rating, 0);
    return (sum / mealFbs.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-8 items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400">Loading mess panel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      
      {/* ---------------- STUDENT MENU VIEW & RATINGS ---------------- */}
      {user?.role === 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Menu Table */}
          <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Utensils size={16} className="text-blue-500" />
              Weekly Mess Meal Board
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-2">Day</th>
                    <th className="py-3 px-2">Breakfast</th>
                    <th className="py-3 px-2">Lunch</th>
                    <th className="py-3 px-2">Dinner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/40">
                  {menu.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                      <td className="py-3.5 px-2 font-extrabold text-slate-800 dark:text-zinc-200">{m.day_of_week}</td>
                      <td className="py-3.5 px-2 text-slate-500">{m.breakfast}</td>
                      <td className="py-3.5 px-2 text-slate-500">{m.lunch}</td>
                      <td className="py-3.5 px-2 text-slate-500">{m.dinner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Feedback Form */}
          <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <MessageSquare size={16} className="text-blue-500" />
                Submit Meal Feedback
              </h3>
              
              {fbSuccess && (
                <div className="p-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-semibold">
                  Feedback registered. Mess team notified.
                </div>
              )}

              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Meal category</label>
                  <select
                    value={fbMealType}
                    onChange={(e) => setFbMealType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Star Rating</label>
                  <div className="flex gap-1.5 items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFbRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star 
                          size={24} 
                          className={star <= fbRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Comments / Suggestions</label>
                  <textarea
                    placeholder="e.g. Rice was slightly undercooked today."
                    value={fbComment}
                    onChange={(e) => setFbComment(e.target.value)}
                    rows={3}
                    className="w-full p-3 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Submit Review
                </button>
              </form>
            </div>

            <div className="text-[10px] text-slate-400 text-center mt-6 flex items-center gap-1 justify-center">
              <Sparkles size={12} className="text-yellow-500" />
              Help us improve meal quality!
            </div>
          </div>

        </div>
      )}

      {/* ---------------- MESS MANAGER / ADMIN PANEL ---------------- */}
      {(user?.role === 'mess_manager' || user?.role === 'admin') && (
        <div className="space-y-8">
          
          {/* Average statistics cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['breakfast', 'lunch', 'dinner'] as const).map(meal => {
              const avg = getAverageRating(meal);
              return (
                <div key={meal} className="bg-white border border-slate-200 p-5 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm flex items-center justify-between card-hover">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">{meal} Rating</span>
                    <span className="text-2xl font-black mt-1 block">{avg === 0 ? 'N/A' : `${avg} / 5.0`}</span>
                  </div>
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 dark:bg-amber-950/20">
                    <Star size={18} className="fill-amber-400" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Menu Management table */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold tracking-tight">Weekly Menu Configuration Panel</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-2 w-28">Day</th>
                    <th className="py-3 px-2">Breakfast Description</th>
                    <th className="py-3 px-2">Lunch Description</th>
                    <th className="py-3 px-2">Dinner Description</th>
                    <th className="py-3 px-2 text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/40">
                  {menu.map(m => {
                    const isEditing = editingDay === m.day_of_week;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                        <td className="py-3.5 px-2 font-bold">{m.day_of_week}</td>
                        <td className="py-3.5 px-2">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editBreakfast}
                              onChange={(e) => setEditBreakfast(e.target.value)}
                              className="p-1 bg-slate-50 border border-slate-200 rounded w-full"
                            />
                          ) : (
                            <span className="text-slate-500">{m.breakfast}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-2">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editLunch}
                              onChange={(e) => setEditLunch(e.target.value)}
                              className="p-1 bg-slate-50 border border-slate-200 rounded w-full"
                            />
                          ) : (
                            <span className="text-slate-500">{m.lunch}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-2">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editDinner}
                              onChange={(e) => setEditDinner(e.target.value)}
                              className="p-1 bg-slate-50 border border-slate-200 rounded w-full"
                            />
                          ) : (
                            <span className="text-slate-500">{m.dinner}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          {isEditing ? (
                            <button
                              onClick={() => saveMenu(m.day_of_week)}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors inline-flex items-center gap-1 font-bold"
                            >
                              <Save size={12} /> Save
                            </button>
                          ) : (
                            <button
                              onClick={() => startEditing(m)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors inline-flex items-center gap-1 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                            >
                              <Edit size={12} /> Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Student Feedback Reviews */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold tracking-tight">Recent Student Meal Feedback Reviews</h3>

            <div className="space-y-4">
              {feedbacks.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">No feedbacks submitted yet.</p>
              ) : (
                feedbacks.map(fb => (
                  <div key={fb.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl dark:bg-zinc-850 dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-800 dark:text-zinc-200">{fb.student_name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full capitalize bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                          {fb.meal_type}
                        </span>
                      </div>
                      {fb.comment && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">"{fb.comment}"</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={14} className={s <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                      ))}
                      <span className="text-[9px] text-slate-400 block ml-2">
                        {fb.date}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
