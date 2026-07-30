"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, getDocs, addDoc, serverTimestamp, orderBy, deleteDoc } from "firebase/firestore";
import { 
  ArrowLeft, Download, Plus, DollarSign, Wallet, FileText, 
  Trash2, Loader2, Receipt, TrendingUp, Calendar, Hash, Globe, Database, Activity, CheckCircle2, LayoutDashboard
} from "lucide-react";

export default function ProjectDashboardPage() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  
  // Ledgers
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState("payments");
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  // Forms
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "Bank Transfer", note: "", date: new Date().toISOString().split('T')[0] });
  const [expenseForm, setExpenseForm] = useState({ amount: "", category: "Hosting / Domain", note: "", date: new Date().toISOString().split('T')[0] });

  const fetchData = async () => {
    try {
      // 1. Fetch Project Docs
      const docRef = doc(db, "projects", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProject({ id: docSnap.id, ...docSnap.data() });
      } else {
        toast.error("Project not found");
        router.push("/app/projects");
        return;
      }

      // 2. Fetch Payments
      const paySnap = await getDocs(query(collection(docRef, "payments"), orderBy("created_at", "desc")));
      setPayments(paySnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // 3. Fetch Expenses
      const expSnap = await getDocs(query(collection(docRef, "expenses"), orderBy("created_at", "desc")));
      setExpenses(expSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Calculations
  const totalValue = project?.total_cost || 0;
  const totalPaid = payments.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const balanceRemaining = totalValue - totalPaid;
  const totalExpenses = expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  
  // Handlers
  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) return toast.error("Enter a valid amount");
    
    try {
      await addDoc(collection(doc(db, "projects", id), "payments"), {
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        note: paymentForm.note,
        date: paymentForm.date,
        created_at: serverTimestamp()
      });
      toast.success("Payment recorded!");
      setIsAddingPayment(false);
      setPaymentForm({ amount: "", method: "Bank Transfer", note: "", date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) return toast.error("Enter a valid amount");

    try {
      await addDoc(collection(doc(db, "projects", id), "expenses"), {
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        note: expenseForm.note,
        date: expenseForm.date,
        created_at: serverTimestamp()
      });
      toast.success("Expense recorded!");
      setIsAddingExpense(false);
      setExpenseForm({ amount: "", category: "Hosting / Domain", note: "", date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteSubDoc = async (subCollection, docId) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await deleteDoc(doc(db, "projects", id, subCollection, docId));
      toast.success("Deleted successfully");
      fetchData();
    } catch(err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] dark:bg-[#0F1117]"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800";
      case "Development": return "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800";
      case "Testing": return "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800";
      case "Prototyping": return "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800";
      case "Completed": return "bg-emerald-500 text-white border-emerald-600 shadow-sm";
      case "On Hold": return "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:border-red-800";
      default: return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700";
    }
  };

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
               {project.name}
               <span className={`px-2.5 py-0.5 max-h-6 rounded text-[11px] font-bold border ${getStatusColor(project.status)}`}>
                 {project.status || "Development"}
               </span>
             </h1>
             <p className="text-[12px] font-medium text-slate-400">
               Project Dashboard & Financial Overviews
             </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto mt-8 px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Summary & Tech details */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Financial Card - FinTech Style */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-[#1e2740] dark:from-[#0F1117] dark:to-[#161B27] p-1 border border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#2C79F5]/30 blur-[80px] rounded-full pointer-events-none group-hover:bg-[#2C79F5]/40 transition-colors"></div>
            
            <div className="bg-slate-900/40 backdrop-blur-xl h-full w-full rounded-[14px] p-6 relative z-10 flex flex-col">
              
              <div className="flex items-center justify-between mb-8">
                <span className="text-white/60 text-xs font-semibold tracking-widest uppercase">Project Value</span>
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              
              <div className="mb-8">
                <div className="text-4xl font-extrabold text-white tracking-tight leading-none mb-2">
                  <span className="text-white/40 font-medium text-2xl">Rs</span> {totalValue.toLocaleString()}
                </div>
                <div className="text-sm font-medium text-white/50">Total contractual amount</div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4"/> Paid
                  </span>
                  <span className="text-emerald-400 font-bold text-sm">Rs {totalPaid.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                   <span className="text-sm font-medium text-amber-400 flex items-center gap-1.5">
                    <Activity className="w-4 h-4"/> Remaining
                  </span>
                  <span className="text-amber-400 font-bold text-sm">Rs {balanceRemaining.toLocaleString()}</span>
                </div>
              </div>
              
            </div>
          </div>

          {/* Business Expenses */}
          <div className="bg-white dark:bg-[#161B27] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
             <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
               <TrendingUp className="w-4 h-4"/> Operational Expenses
             </h3>
             <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
               <span className="text-lg text-slate-400 font-medium mr-1">Rs</span>{totalExpenses.toLocaleString()}
             </p>
          </div>
          
          {/* Project Metatdata */}
          <div className="bg-white dark:bg-[#161B27] p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-[14px] p-5">
              <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> Technical Profile
              </h2>
              
              <dl className="space-y-4">
                <div>
                  <dt className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Domain</dt>
                  <dd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-[13px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-xs">
                    <Globe className="w-3.5 h-3.5 text-[#2C79F5]" /> {project.domain_name || "Unassigned"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Database Instance</dt>
                  <dd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-[13px] font-mono text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-xs">
                    <Database className="w-3.5 h-3.5 text-indigo-500" /> {project.db_name || "Unassigned"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Client Identifier</dt>
                  <dd className="text-sm font-mono text-slate-500 break-all">{project.client_id}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Right Side: Ledgers */}
        <div className="lg:col-span-8 flex flex-col min-h-[700px]">
          
          {/* Main Ledger Card */}
          <div className="bg-white dark:bg-[#161B27] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col overflow-hidden">
            
            {/* Tabs Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/30 flex items-center gap-2">
              <button 
                onClick={() => setActiveTab("payments")}
                className={`py-2 px-5 text-[13px] font-bold rounded-xl transition-all shadow-xs ${activeTab === "payments" ? "bg-white dark:bg-[#161B27] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700" : "bg-transparent border border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              >
                <Wallet className={`w-4 h-4 inline-block mr-2 mb-0.5 ${activeTab === "payments" ? "text-emerald-500" : ""}`} /> Transaction History
              </button>
              <button 
                onClick={() => setActiveTab("expenses")}
                className={`py-2 px-5 text-[13px] font-bold rounded-xl transition-all shadow-xs ${activeTab === "expenses" ? "bg-white dark:bg-[#161B27] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700" : "bg-transparent border border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              >
                <Receipt className={`w-4 h-4 inline-block mr-2 mb-0.5 ${activeTab === "expenses" ? "text-red-500" : ""}`} /> Expense Book
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-[#0F1117]/30">
              
              {/* === PAYMENTS TAB === */}
              {activeTab === "payments" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">Transaction History</h2>
                      <p className="text-xs font-medium text-slate-400 mt-0.5">Log of all payments received from the client for this project.</p>
                    </div>
                    <button 
                      onClick={() => setIsAddingPayment(!isAddingPayment)}
                      className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[13px] font-bold rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Receive Payment
                    </button>
                  </div>
                  
                  {isAddingPayment && (
                    <div className="mb-8 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-lg shadow-emerald-500/5">
                      <form onSubmit={handleAddPayment} className="bg-emerald-50/50 dark:bg-emerald-900/10 p-5 rounded-[12px] grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                        <div className="md:col-span-3">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Date</label>
                          <input type="date" value={paymentForm.date} onChange={e => setPaymentForm(p => ({...p, date: e.target.value}))} required className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium shadow-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"/>
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Amount (Rs) *</label>
                          <input type="number" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm(p => ({...p, amount: e.target.value}))} required placeholder="5,000" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold shadow-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-emerald-600 dark:text-emerald-400 placeholder:opacity-50"/>
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Method</label>
                          <select value={paymentForm.method} onChange={e => setPaymentForm(p => ({...p, method: e.target.value}))} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium shadow-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                            <option>Bank Transfer</option>
                            <option>Cash</option>
                            <option>Credit Card</option>
                          </select>
                        </div>
                        <div className="md:col-span-3">
                          <button type="submit" className="w-full py-2 bg-emerald-500 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-emerald-600 transition-colors">Confirm Payment</button>
                        </div>
                        <div className="md:col-span-12">
                          <input type="text" value={paymentForm.note} onChange={e => setPaymentForm(p => ({...p, note: e.target.value}))} placeholder="Optional reference note or invoice ID..." className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium shadow-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"/>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="bg-white dark:bg-[#161B27] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Date</th>
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Method</th>
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Note</th>
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">Amount</th>
                          <th className="px-6 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {payments.length === 0 ? (
                          <tr><td colSpan={5} className="py-12 text-center text-sm font-medium text-slate-400 border-none">No payments found. Let's get paid!</td></tr>
                        ) : (
                          payments.map(pay => (
                            <tr key={pay.id} className="group hover:bg-[#F0F5FF]/50 dark:hover:bg-[#1e2740]/40 transition-colors">
                              <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                                {new Date(pay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {pay.method}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500 italic max-w-[200px] truncate">{pay.note || "-"}</td>
                              <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white text-right">Rs {parseFloat(pay.amount).toLocaleString()}</td>
                              <td className="px-6 py-4 text-right">
                                <button onClick={() => handleDeleteSubDoc("payments", pay.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all opacity-0 group-hover:opacity-100">
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
              )}

              {/* === EXPENSES TAB === */}
              {activeTab === "expenses" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">Expense Book</h2>
                      <p className="text-xs font-medium text-slate-400 mt-0.5">Log of all internal operational costs for this specific project.</p>
                    </div>
                    <button 
                      onClick={() => setIsAddingExpense(!isAddingExpense)}
                      className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[13px] font-bold rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Log Expense
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
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Amount (Rs) *</label>
                          <input type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({...p, amount: e.target.value}))} required placeholder="1,000" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold shadow-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-red-600 dark:text-red-400 placeholder:opacity-50"/>
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Category</label>
                          <select value={expenseForm.category} onChange={e => setExpenseForm(p => ({...p, category: e.target.value}))} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium shadow-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none">
                            <option>Hosting / Domain</option>
                            <option>Outsourcing</option>
                            <option>Plugin/License</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div className="md:col-span-3">
                          <button type="submit" className="w-full py-2 bg-red-500 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-red-600 transition-colors">Save Expense</button>
                        </div>
                        <div className="md:col-span-12">
                          <input type="text" value={expenseForm.note} onChange={e => setExpenseForm(p => ({...p, note: e.target.value}))} placeholder="Explanation or vendor name..." required className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium shadow-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"/>
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
                          <tr><td colSpan={5} className="py-12 text-center text-sm font-medium text-slate-400 border-none">No expenses logged. Clean code, clean accounting!</td></tr>
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
                              <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white text-right">Rs {parseFloat(exp.amount).toLocaleString()}</td>
                              <td className="px-6 py-4 text-right">
                                <button onClick={() => handleDeleteSubDoc("expenses", exp.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all opacity-0 group-hover:opacity-100">
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
              )}
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
