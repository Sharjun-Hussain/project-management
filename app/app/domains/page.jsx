"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";
import { Search, Plus, Edit3, Trash2, X, AlertCircle, Globe, Shield, CreditCard, Link as LinkIcon, Network, Calendar, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";

export default function DomainsList() {
  const [domainsList, setDomainsList] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [selectedDomain, setSelectedDomain] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    provider: "",
    registered_email: "",
    initial_price: "0",
    renewal_price: "0",
    registration_date: "",
    expiry_date: "",
    status: "Active",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "domains"), orderBy("created_at", "desc")));
      setDomainsList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const projSnap = await getDocs(collection(db, "projects"));
      setProjects(projSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      toast.error("Failed to load domains data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setFormMode("create");
    setFormData({
      name: "",
      provider: "",
      registered_email: "",
      initial_price: "",
      renewal_price: "",
      registration_date: new Date().toISOString().split('T')[0],
      expiry_date: "",
      status: "Active",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (domain) => {
    setFormMode("edit");
    setSelectedDomain(domain);
    setFormData({
      name: domain.name || "",
      provider: domain.provider || "",
      registered_email: domain.registered_email || "",
      initial_price: domain.initial_price || "",
      renewal_price: domain.renewal_price || "",
      registration_date: domain.registration_date || "",
      expiry_date: domain.expiry_date || "",
      status: domain.status || "Active",
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Domain Name is required");
    
    setSubmitLoading(true);
    try {
      const payload = {
        ...formData,
        initial_price: parseFloat(formData.initial_price) || 0,
        renewal_price: parseFloat(formData.renewal_price) || 0,
        updated_at: serverTimestamp()
      };

      if (formMode === "create") {
        payload.created_at = serverTimestamp();
        await addDoc(collection(db, "domains"), payload);
        toast.success("Domain registered successfully");
      } else {
        await updateDoc(doc(db, "domains", selectedDomain.id), payload);
        toast.success("Domain updated successfully");
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const confirmDelete = async () => {
    setSubmitLoading(true);
    try {
      await deleteDoc(doc(db, "domains", selectedDomain.id));
      toast.success("Domain record deleted");
      setIsDeleteOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredDomains = domainsList.filter(d => d.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] dark:bg-[#0F1117]"><Loader2 className="w-8 h-8 flex animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F1117] font-sans selection:bg-indigo-500/30 text-slate-900 dark:text-slate-100">
      
      {/* Header */}
      <div className="bg-white dark:bg-[#161B27] border-b border-slate-200 dark:border-slate-800 px-8 py-6 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
             <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
               <Globe className="w-7 h-7 text-indigo-500" /> Domain Registry
             </h1>
             <p className="text-sm font-medium text-slate-500 mt-1">Manage network domain registrations, renewals, and project bindings.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search domains..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-[#0F1117] border-transparent focus:bg-white dark:focus:bg-slate-900 border focus:border-indigo-500 rounded-xl text-sm font-medium transition-all outline-none"
              />
            </div>
            <button
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Domain
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDomains.map(dm => {
            // Find projects using this domain (if any field matches)
            const linkedProjects = projects.filter(p => p.domain_name?.toLowerCase().includes(dm.name?.toLowerCase()));
            const isExpiringSoon = dm.expiry_date && (new Date(dm.expiry_date) - new Date()) / (1000 * 60 * 60 * 24) < 30;

            return (
              <div key={dm.id} className={`group bg-white dark:bg-[#161B27] rounded-3xl p-1 border shadow-xl shadow-slate-200/20 dark:shadow-black/40 relative overflow-hidden ${isExpiringSoon ? 'border-red-500/50' : 'border-slate-200 dark:border-slate-800'}`}>
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${dm.status === 'Active' ? 'from-indigo-500 to-cyan-500' : 'from-red-500 to-orange-500'}`}></div>
                
                <div className="p-5 flex flex-col h-full bg-white dark:bg-[#161B27] rounded-[22px]">
                  
                  {/* Header info */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50">
                        <Globe className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white truncate max-w-[140px]">{dm.name}</h3>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{dm.provider}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-1.5 transition-opacity">
                      <button onClick={() => handleOpenEdit(dm)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg">
                        <Edit3 className="w-4 h-4"/>
                      </button>
                      <button onClick={() => handleOpenDelete(dm)} className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="block text-xs font-medium text-slate-500 mb-1">Renewal Price</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Rs {(dm.renewal_price || 0).toLocaleString()}</span>
                    </div>
                    <div className={`p-3 rounded-xl border ${isExpiringSoon ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'}`}>
                      <span className={`block text-xs font-medium mb-1 ${isExpiringSoon ? 'text-red-500' : 'text-slate-500'}`}>Expiry</span>
                      <span className={`text-sm font-bold ${isExpiringSoon ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {dm.expiry_date ? new Date(dm.expiry_date).toLocaleDateString() : "Unset"}
                      </span>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                      <LinkIcon className="w-3.5 h-3.5" />
                      {linkedProjects.length} Projects
                    </div>
                    <Link href={`/app/domains/${dm.id}`} className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold rounded-lg shadow-sm hover:opacity-90 flex items-center gap-1.5 transition-opacity">
                      Open Dashboard <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  
                </div>
              </div>
            );
          })}
        </div>
        {filteredDomains.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-[#161B27] border border-slate-200 dark:border-slate-800 rounded-3xl">
            <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Domains Found</h3>
            <p className="text-sm font-medium text-slate-500 mt-1 mb-6">Register a new domain to track its expiration dates.</p>
            <button onClick={handleOpenCreate} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">Register Domain</button>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#161B27] shadow-2xl flex flex-col h-full border-l border-slate-200 dark:border-slate-800 animate-slide-in-right">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-500" />
                {formMode === "create" ? "Register New Domain" : "Edit Domain"}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-tiny-scrollbar flex flex-col">
              <div className="flex-1 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Domain Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} required placeholder="example.com" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Provider</label>
                  <input type="text" name="provider" value={formData.provider} onChange={e => setFormData(p => ({...p, provider: e.target.value}))} placeholder="e.g Namecheap" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Registered Email</label>
                  <input type="email" name="registered_email" value={formData.registered_email} onChange={e => setFormData(p => ({...p, registered_email: e.target.value}))} placeholder="hello@company.com" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Initial Price (Rs)</label>
                    <input type="number" step="0.01" name="initial_price" value={formData.initial_price} onChange={e => setFormData(p => ({...p, initial_price: e.target.value}))} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Renewal Price (Rs)</label>
                    <input type="number" step="0.01" name="renewal_price" value={formData.renewal_price} onChange={e => setFormData(p => ({...p, renewal_price: e.target.value}))} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Registration Date</label>
                    <input type="date" name="registration_date" value={formData.registration_date} onChange={e => setFormData(p => ({...p, registration_date: e.target.value}))} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Expiry Date</label>
                    <input type="date" name="expiry_date" value={formData.expiry_date} onChange={e => setFormData(p => ({...p, expiry_date: e.target.value}))} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                  <select name="status" value={formData.status} onChange={e => setFormData(p => ({...p, status: e.target.value}))} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500">
                     <option>Active</option>
                     <option>Expiring</option>
                     <option>Expired</option>
                     <option>Transferred</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setIsFormOpen(false)} className="py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitLoading} className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-600/20 active:scale-95 transition-all text-center flex items-center justify-center gap-2">
                  {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (formMode === "create" ? "Save Domain" : "Update Domain")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDeleteOpen(false)} />
          <div className="relative bg-white dark:bg-[#161B27] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800">
             <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 scale-110">
               <AlertCircle className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Domain?</h3>
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8">This action cannot be undone. This deletes the domain {selectedDomain?.name} and its historical data.</p>
             <div className="flex gap-3">
               <button onClick={() => setIsDeleteOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700">Cancel</button>
               <button onClick={confirmDelete} disabled={submitLoading} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 active:scale-95 flex items-center justify-center">
                 {submitLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Delete"}
               </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
