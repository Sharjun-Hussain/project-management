"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, getDocs, addDoc, serverTimestamp, orderBy, deleteDoc } from "firebase/firestore";
import { 
  ArrowLeft, Plus, DollarSign, Wallet, FileText, 
  Trash2, Loader2, Receipt, TrendingUp, Calendar, Globe, Database, Activity, LayoutDashboard, ServerIcon, HardDrive, Cpu, Network, Edit3
} from "lucide-react";

export default function VPSDashboardPage() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [vps, setVps] = useState(null);
  
  // Ledger
  const [expenses, setExpenses] = useState([]);
  const [projectsCount, setProjectsCount] = useState(0);
  
  // UI State
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ amount: "", category: "Subscription Renewal", note: "", date: new Date().toISOString().split('T')[0] });

  const fetchData = async () => {
    try {
      // 1. Fetch VPS Docs
      const docRef = doc(db, "vps", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setVps({ id: docSnap.id, ...docSnap.data() });
      } else {
        toast.error("VPS not found");
        router.push("/app/vps");
        return;
      }

      // 2. Fetch Projects that use this VPS
      const projSnap = await getDocs(collection(db, "projects"));
      const linkedProjects = projSnap.docs.filter(p => p.data().vps_id === id);
      setProjectsCount(linkedProjects.length);

      // 3. Fetch Expenses (Renewals/Upgrades)
      const expSnap = await getDocs(query(collection(docRef, "expenses"), orderBy("created_at", "desc")));
      setExpenses(expSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load VPS details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Calculations
  const totalExpenses = expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  
  // Handlers
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) return toast.error("Enter a valid amount");

    try {
      await addDoc(collection(doc(db, "vps", id), "expenses"), {
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        note: expenseForm.note,
        date: expenseForm.date,
        created_at: serverTimestamp()
      });
      toast.success("Expense recorded!");
      setIsAddingExpense(false);
      setExpenseForm({ amount: "", category: "Subscription Renewal", note: "", date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteExpense = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await deleteDoc(doc(db, "vps", id, "expenses", docId));
      toast.success("Deleted successfully");
      fetchData();
    } catch(err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] dark:bg-[#0F1117]"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F1117] font-sans pb-20">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-[#161B27] border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm h-20">
        <div className="flex items-center gap-5">
          <button 
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition-all font-medium shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <div>
             <h1 className="text-[22px] tracking-tight font-extrabold text-slate-900 dark:text-white leading-none mb-1 flex items-center gap-3">
               {vps.name}
               <span className={`px-2.5 py-0.5 max-h-6 rounded text-[11px] font-bold border ${vps.is_active ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/30 dark:border-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700'}`}>
                 {vps.is_active ? "Active Server" : "Inactive Server"}
               </span>
             </h1>
             <p className="text-[12px] font-medium text-slate-400">
               Server Tracking & Financial Ledgers
             </p>
          </div>
        </div>
        <div>
           <button onClick={() => router.push(`/app/vps?edit=${vps.id}`)} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-2 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors border border-slate-200 dark:border-slate-700 font-bold text-sm">
             <Edit3 className="w-4 h-4" /> Edit Settings
           </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto mt-8 px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Summary & Tech details */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Financial Card - FinTech Style */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-[#1e2740] dark:from-[#0F1117] dark:to-[#161B27] p-1 border border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-red-500/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-red-500/30 transition-colors"></div>
            
            <div className="bg-slate-900/40 backdrop-blur-xl h-full w-full rounded-[14px] p-6 relative z-10 flex flex-col">
              
              <div className="flex items-center justify-between mb-8">
                <span className="text-white/60 text-xs font-semibold tracking-widest uppercase">Total Historical Expenses</span>
                <TrendingUp className="w-5 h-5 text-red-400" />
              </div>
              
              <div className="mb-8">
                <div className="text-4xl font-extrabold text-white tracking-tight leading-none mb-2">
                  <span className="text-white/40 font-medium text-2xl">$</span> {totalExpenses.toFixed(2)}
                </div>
                <div className="text-sm font-medium text-white/50 flex gap-2">Lifetime infrastructure overhead</div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/10 grid grid-cols-2">
                <div>
                  <span className="text-xs font-medium text-white/60 flex items-center gap-1.5 uppercase tracking-wide">
                    Monthly Renewal
                  </span>
                  <span className="text-white font-bold text-sm flex gap-1 mt-1">
                    <span className="text-slate-500">$</span>{parseFloat(vps.renewal_price || 0).toFixed(2)} <span className="text-[10px] text-slate-500 mt-1">/ {vps.billing_cycle || 'mo'}</span>
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-white/60 flex items-center gap-1.5 uppercase tracking-wide">
                    Initial Setup
                  </span>
                  <span className="text-white font-bold text-sm flex gap-1 mt-1">
                     <span className="text-slate-500">$</span>{parseFloat(vps.purchase_price || 0).toFixed(2)}
                  </span>
                </div>
              </div>
              
            </div>
          </div>
          
          {/* VPS Hardware & Network Profile */}
          <div className="bg-white dark:bg-[#161B27] p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-[14px] p-5">
              <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <ServerIcon className="w-4 h-4" /> Hardware Specifications
              </h2>
              
              <dl className="space-y-4">
                {vps.next_renewal_date && (
                  <div className="bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 -mx-1 px-3 py-2.5 rounded-xl flex justify-between items-center mb-2">
                    <dt className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Next Renewal Due</dt>
                    <dd className="text-[12px] font-bold text-red-700 dark:text-red-300 bg-white dark:bg-red-950 px-2 py-0.5 rounded shadow-xs">{new Date(vps.next_renewal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</dd>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                      <dt className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Cpu className="w-3.5 h-3.5"/> Memory</dt>
                      <dd className="text-sm font-bold text-slate-800 dark:text-slate-200">{vps.ram || "Unknown"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><HardDrive className="w-3.5 h-3.5"/> Storage</dt>
                      <dd className="text-sm font-bold text-slate-800 dark:text-slate-200">{vps.storage || "Unknown"}</dd>
                    </div>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Provider Profile</dt>
                  <dd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-[13px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-xs">
                    <Globe className="w-3.5 h-3.5 text-[#2C79F5]" /> {vps.provider || "Unassigned Provider"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Public IP</dt>
                  <dd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-[13px] font-mono text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-xs">
                    <Network className="w-3.5 h-3.5 text-indigo-500" /> {vps.ip_address || "No IP Address"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Utilization</dt>
                  <dd className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    <span className="text-[#2C79F5] mr-1">{projectsCount}</span> Hosted Projects
                  </dd>
                </div>
                {vps.description && (
                  <div>
                    <dt className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Operational Notes</dt>
                    <dd className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      {vps.description}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        {/* Right Side: Ledger */}
        <div className="lg:col-span-8 flex flex-col min-h-[700px]">
          
          {/* Main Ledger Card */}
          <div className="bg-white dark:bg-[#161B27] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col overflow-hidden">
            
            {/* Tabs Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/30 flex items-center gap-2">
              <button 
                className="py-2 px-5 text-[13px] font-bold rounded-xl transition-all shadow-xs bg-white dark:bg-[#161B27] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
              >
                <Receipt className="w-4 h-4 inline-block mr-2 mb-0.5 text-red-500" /> Expenses & Renewal Log
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-[#0F1117]/30">
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Expense Book</h2>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">Log of all renewals, upgrades, and maintenance costs for this specific VPS.</p>
                  </div>
                  <button 
                    onClick={() => setIsAddingExpense(!isAddingExpense)}
                    className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[13px] font-bold rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Log VPS Expense
                  </button>
                </div>
                
                {isAddingExpense && (
                  <div className="mb-8 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-lg shadow-red-500/5">
                    <form onSubmit={handleAddExpense} className="bg-red-50/50 dark:bg-red-900/10 p-5 rounded-[12px] grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Date</label>
                        <input type="date" value={expenseForm.date} onChange={e => setExpenseForm(p => ({...p, date: e.target.value}))} required className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium shadow-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"/>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Amount ($) *</label>
                        <input type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({...p, amount: e.target.value}))} required placeholder="10.00" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold shadow-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-red-600 dark:text-red-400 placeholder:opacity-50"/>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Category</label>
                        <select value={expenseForm.category} onChange={e => setExpenseForm(p => ({...p, category: e.target.value}))} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium shadow-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none flex-1">
                          <option>Subscription Renewal</option>
                          <option>Disk Upgrade</option>
                          <option>Bandwidth Overage</option>
                          <option>Initial Purchase</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <button type="submit" className="w-full py-2 bg-red-500 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-red-600 transition-colors">Save Expense</button>
                      </div>
                      <div className="md:col-span-12">
                        <input type="text" value={expenseForm.note} onChange={e => setExpenseForm(p => ({...p, note: e.target.value}))} placeholder="Explanation or invoice reference..." required className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium shadow-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"/>
                      </div>
                    </form>
                  </div>
                )}

                <div className="bg-white dark:bg-[#161B27] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Date</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Category</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Note/Invoice</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">Amount</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {expenses.length === 0 ? (
                        <tr><td colSpan={5} className="py-12 text-center text-sm font-medium text-slate-400 border-none">No expenses logged. Add initial setup costs to get started!</td></tr>
                      ) : (
                        expenses.map(exp => (
                          <tr key={exp.id} className="group hover:bg-[#F0F5FF]/50 dark:hover:bg-[#1e2740]/40 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                              {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {exp.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500 italic max-w-[200px] truncate">{exp.note}</td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white text-right">$ {parseFloat(exp.amount).toFixed(2)}</td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => handleDeleteExpense(exp.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all opacity-0 group-hover:opacity-100">
                                <Trash2 className="w-4 h-4"/>
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
      </div>
    </div>
  );
}
