"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, getDocs, addDoc, serverTimestamp, orderBy, deleteDoc } from "firebase/firestore";
import { 
  ArrowLeft, Plus, DollarSign, Wallet, FileText, 
  Trash2, Loader2, Receipt, TrendingUp, Calendar, Globe, Database, Activity, LayoutDashboard, LinkIcon, Edit3, Mail
} from "lucide-react";

export default function DomainDashboardPage() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  // Ledger
  const [renewals, setRenewals] = useState([]);
  const [projectsCount, setProjectsCount] = useState(0);
  
  // UI State
  const [isAddingRenewal, setIsAddingRenewal] = useState(false);
  const [renewalForm, setRenewalForm] = useState({ amount: "", note: "", date: new Date().toISOString().split('T')[0] });

  const fetchData = async () => {
    try {
      // 1. Fetch Domain Docs
      const docRef = doc(db, "domains", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setDomain({ id: docSnap.id, ...docSnap.data() });
      } else {
        toast.error("Domain not found");
        router.push("/app/domains");
        return;
      }

      // 2. Fetch Projects that use this Domain
      const projSnap = await getDocs(collection(db, "projects"));
      const linkedProjects = projSnap.docs.filter(p => p.data().domain_name?.toLowerCase().includes(docSnap.data().name?.toLowerCase()));
      setProjectsCount(linkedProjects.length);

      // 3. Fetch Renewals (renewals subcollection)
      const renSnap = await getDocs(query(collection(docRef, "renewals"), orderBy("created_at", "desc")));
      setRenewals(renSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load Domain details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Calculations
  const totalRenewals = renewals.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalSpend = totalRenewals + (parseFloat(domain?.initial_price) || 0);

  // Handlers
  const handleAddRenewal = async (e) => {
    e.preventDefault();
    if (!renewalForm.amount || parseFloat(renewalForm.amount) <= 0) return toast.error("Enter a valid amount");

    setSubmitLoading(true);
    try {
      await addDoc(collection(doc(db, "domains", id), "renewals"), {
        amount: parseFloat(renewalForm.amount),
        note: renewalForm.note,
        date: renewalForm.date,
        created_at: serverTimestamp()
      });
      toast.success("Renewal recorded!");
      setIsAddingRenewal(false);
      setRenewalForm({ amount: domain?.renewal_price || "", note: "Domain Renewal", date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteRenewal = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    setDeletingId(docId);
    try {
      await deleteDoc(doc(db, "domains", id, "renewals", docId));
      toast.success("Deleted successfully");
      fetchData();
    } catch(err) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const isExpiringSoon = domain?.expiry_date && (new Date(domain.expiry_date) - new Date()) / (1000 * 60 * 60 * 24) < 30;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] dark:bg-[#0F1117]"><Loader2 className="w-8 h-8 flex animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F1117] font-sans pb-20 selection:bg-indigo-500/30">
      
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
               {domain.name}
               <span className={`px-2.5 py-0.5 max-h-6 rounded text-[11px] font-bold border ${domain.status === 'Active' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800' : 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/30 dark:border-red-800'}`}>
                 {domain.status}
               </span>
             </h1>
             <p className="text-[12px] font-medium text-slate-400">
               Domain Profile & Historical Ledger
             </p>
          </div>
        </div>
        <div>
           {/* Add dynamic edit link logic if needed */}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto mt-8 px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Summary & Tech details */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Financial Card - FinTech Style */}
          <div className="rounded-2xl bg-gradient-to-br from-[#1e1b4b] to-[#312e81] dark:from-[#0F1117] dark:to-[#161B27] p-1 border border-indigo-900/50 dark:border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-500/30 transition-colors"></div>
            
            <div className="bg-[#1e1b4b]/40 dark:bg-slate-900/40 backdrop-blur-xl h-full w-full rounded-[14px] p-6 relative z-10 flex flex-col">
              
              <div className="flex items-center justify-between mb-8">
                <span className="text-white/60 text-xs font-semibold tracking-widest uppercase">Total Lifetime Spend</span>
                <TrendingUp className="w-5 h-5 text-indigo-400" />
              </div>
              
              <div className="mb-8">
                <div className="text-4xl font-extrabold text-white tracking-tight leading-none mb-2">
                  <span className="text-white/40 font-medium text-2xl">Rs</span> {totalSpend.toLocaleString()}
                </div>
                <div className="text-sm font-medium text-white/50 flex gap-2">Initial cost + all historical renewals</div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/10 grid grid-cols-2">
                <div>
                  <span className="text-xs font-medium text-white/60 flex items-center gap-1.5 uppercase tracking-wide">
                    Avg Renewal
                  </span>
                  <span className="text-white font-bold text-sm flex gap-1 mt-1">
                    <span className="text-slate-500">Rs</span>{(parseFloat(domain.renewal_price) || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-white/60 flex items-center gap-1.5 uppercase tracking-wide">
                    Initial Purchase
                  </span>
                  <span className="text-white font-bold text-sm flex gap-1 mt-1">
                     <span className="text-slate-500">Rs</span>{(parseFloat(domain.initial_price) || 0).toLocaleString()}
                  </span>
                </div>
              </div>
              
            </div>
          </div>
          
          {/* Domain Metadata Profile */}
          <div className="bg-white dark:bg-[#161B27] p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-[14px] p-5">
              <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Domain Profile
              </h2>
              
              <dl className="space-y-4">
                {domain.expiry_date && (
                  <div className={`border -mx-1 px-3 py-2.5 rounded-xl flex justify-between items-center mb-2 ${isExpiringSoon ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-800/30' : 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/30'}`}>
                    <dt className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isExpiringSoon ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'}`}><Calendar className="w-3.5 h-3.5"/> Expiry Date</dt>
                    <dd className={`text-[12px] font-bold px-2 py-0.5 rounded shadow-xs ${isExpiringSoon ? 'text-red-700 dark:text-red-300 bg-white dark:bg-red-950' : 'text-indigo-700 dark:text-indigo-300 bg-white dark:bg-indigo-950'}`}>{new Date(domain.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Registrar Provider</dt>
                  <dd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-[13px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-xs">
                    <Database className="w-3.5 h-3.5 text-[#2C79F5]" /> {domain.provider || "Unknown Registrar"}
                  </dd>
                </div>
                {domain.registered_email && (
                  <div>
                    <dt className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Registered Account</dt>
                    <dd className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                       <Mail className="w-3.5 h-3.5 text-slate-500" /> {domain.registered_email}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Registration Date</dt>
                  <dd className="text-sm font-bold text-slate-700 dark:text-slate-300">
                     {domain.registration_date ? new Date(domain.registration_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "Unknown"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">Connected Projects</dt>
                  <dd className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="text-[#2C79F5] mr-1">{projectsCount}</span> Hosted Projects
                  </dd>
                </div>
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
                className="py-2 px-5 text-[13px] font-bold rounded-xl transition-all shadow-xs bg-white dark:bg-[#161B27] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 flex items-center gap-2"
              >
                <Receipt className="w-4 h-4 text-indigo-500" /> Renewal History
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-[#0F1117]/30 border-t border-transparent">
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Renewal Log</h2>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">Historical ledger of all payments made to renew or manage this domain.</p>
                  </div>
                  <button 
                    onClick={() => {
                        setIsAddingRenewal(!isAddingRenewal);
                        if (!isAddingRenewal) {
                            setRenewalForm({ amount: domain?.renewal_price || "", note: "Yearly Renewal", date: new Date().toISOString().split('T')[0] });
                        }
                    }}
                    className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[13px] font-bold rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm active:scale-95 transition-transform"
                  >
                    <Plus className="w-4 h-4" /> Log Renewal Phase
                  </button>
                </div>
                
                {isAddingRenewal && (
                  <div className="mb-8 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 shadow-lg shadow-indigo-500/5">
                    <form onSubmit={handleAddRenewal} className="bg-indigo-50/50 dark:bg-indigo-900/10 p-5 rounded-[12px] grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Date</label>
                        <input type="date" value={renewalForm.date} onChange={e => setRenewalForm(p => ({...p, date: e.target.value}))} required className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"/>
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Amount (Rs) *</label>
                        <input type="number" step="0.01" value={renewalForm.amount} onChange={e => setRenewalForm(p => ({...p, amount: e.target.value}))} required placeholder="25.00" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-indigo-600 dark:text-indigo-400 placeholder:opacity-50"/>
                      </div>
                      <div className="md:col-span-5">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Note/Reference</label>
                        <input type="text" value={renewalForm.note} onChange={e => setRenewalForm(p => ({...p, note: e.target.value}))} placeholder="Exp: Namecheap Renewal 2026..." required className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"/>
                      </div>
                      <div className="md:col-span-12 flex justify-end">
                        <button type="submit" disabled={submitLoading} className="w-full md:w-auto px-8 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2">
                           {submitLoading && <Loader2 className="w-4 h-4 animate-spin"/>} Complete Renewal
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="bg-white dark:bg-[#161B27] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Date Logged</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Reference Note</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">Cost Amount</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {renewals.length === 0 ? (
                        <tr><td colSpan={4} className="py-12 text-center text-sm font-medium text-slate-400 border-none">No renewals logged for this domain yet.</td></tr>
                      ) : (
                        renewals.map(ren => (
                          <tr key={ren.id} className="group hover:bg-[#F0F5FF]/50 dark:hover:bg-[#1e2740]/40 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                              {new Date(ren.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-200">
                               {ren.note}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white text-right">Rs {parseFloat(ren.amount).toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">
                              <button disabled={deletingId === ren.id} onClick={() => handleDeleteRenewal(ren.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50">
                                {deletingId === ren.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
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
