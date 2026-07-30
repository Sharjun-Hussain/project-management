"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";
import { Search, Plus, Edit3, Trash2, X, AlertCircle, LayoutGrid, List as ListIcon, CheckCircle2, CircleDashed, Globe, DollarSign, Database, HardDrive, Cpu, Tag, Info, Layers, Loader2, Network, Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";

const getVPSGradient = (name) => {
  const gradients = [
    "from-orange-500 to-amber-500",
    "from-pink-500 to-rose-500",
    "from-purple-500 to-indigo-500",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-violet-500 to-fuchsia-500",
  ];
  
  if (!name) return gradients[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

export default function VPSHostingContent() {
  const [vpsList, setVpsList] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [selectedVPS, setSelectedVPS] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    provider: "",
    ram: "",
    storage: "",
    ip_address: "",
    billing_cycle: "Monthly",
    purchase_price: "0",
    renewal_price: "0",
    next_renewal_date: "",
    description: "",
    is_active: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch VPS
      const vpsSnap = await getDocs(query(collection(db, "vps"), orderBy("created_at", "desc")));
      const fetchedVps = vpsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch Projects to calculate connections
      const projSnap = await getDocs(collection(db, "projects"));
      const fetchedProj = projSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setVpsList(fetchedVps);
      setProjects(fetchedProj);
    } catch (err) {
      toast.error("Failed to load VPS data");
      console.error(err);
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
      username: "",
      provider: "",
      ram: "",
      storage: "",
      ip_address: "",
      billing_cycle: "Monthly",
      purchase_price: "",
      renewal_price: "",
      next_renewal_date: "",
      description: "",
      is_active: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (vps) => {
    setFormMode("edit");
    setSelectedVPS(vps);
    setFormData({
      name: vps.name || "",
      username: vps.username || "",
      provider: vps.provider || "",
      ram: vps.ram || "",
      storage: vps.storage || "",
      ip_address: vps.ip_address || "",
      billing_cycle: vps.billing_cycle || "Monthly",
      purchase_price: vps.purchase_price || "",
      renewal_price: vps.renewal_price || "",
      next_renewal_date: vps.next_renewal_date || "",
      description: vps.description || "",
      is_active: vps.is_active ?? true,
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (vps) => {
    setSelectedVPS(vps);
    setIsDeleteOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error("VPS Name is required");
    
    setSubmitLoading(true);
    try {
      const payload = {
        ...formData,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        renewal_price: parseFloat(formData.renewal_price) || 0,
        updated_at: serverTimestamp()
      };

      if (formMode === "create") {
        payload.created_at = serverTimestamp();
        await addDoc(collection(db, "vps"), payload);
        toast.success("VPS configured successfully");
      } else {
        await updateDoc(doc(db, "vps", selectedVPS.id), payload);
        toast.success("VPS updated successfully");
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Error saving VPS: " + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setSubmitLoading(true);
    try {
      await deleteDoc(doc(db, "vps", selectedVPS.id));
      toast.success("VPS deleted successfully");
      setIsDeleteOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Error deleting VPS: " + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const getConnectedCount = (vpsId) => {
    return projects.filter(p => p.vps_id === vpsId).length;
  };

  const filteredVps = vpsList.filter(v => 
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.ip_address?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0F1117] font-sans text-slate-900 dark:text-white px-8 py-6 pb-20">
      {/* 1. TOP BAR */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex gap-4 items-stretch">
            <div className="w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex flex-col items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/50 shadow-sm py-2">
              <ServerIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col justify-center py-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1">VPS Manager</h1>
              <p className="text-sm text-slate-500 font-medium">Manage your virtual servers and project connections.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-5 py-3 bg-[#2C79F5] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-all shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Configure VPS</span>
            </button>
          </div>
        </div>

        {/* 2. TOOLBAR */}
        <div className="sticky top-4 z-20 bg-white/80 dark:bg-[#161B27]/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-2 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 bg-transparent rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-900 transition-all"
              placeholder="Search by name, provider, or IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === "grid" ? "bg-white dark:bg-[#161B27] shadow-sm text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === "list" ? "bg-white dark:bg-[#161B27] shadow-sm text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ListIcon className="w-4 h-4" /> <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* 3. CONTENT AREA */}
        <div className="mt-8 min-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center p-20">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
          ) : filteredVps.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#161B27] rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 px-6">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Database className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No VPS configured</h3>
              <p className="text-slate-500 mb-6">Connect your first hosting server to start assigning it to projects.</p>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm"
              >
                <Plus className="w-5 h-5" /> Add VPS
              </button>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVps.map((vps) => {
                    const connCount = getConnectedCount(vps.id);
                    return (
                    <div key={vps.id} className="group relative bg-white dark:bg-[#161B27] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 shadow-sm transition-all flex flex-col h-full">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getVPSGradient(vps.name)} flex items-center justify-center shrink-0 shadow-inner`}>
                          <ServerIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate" title={vps.name}>{vps.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${vps.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            <p className="text-xs font-semibold text-slate-500">{vps.ip_address || 'No IP specified'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><Cpu className="w-3 h-3"/> RAM</p>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{vps.ram || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><HardDrive className="w-3 h-3"/> Storage</p>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{vps.storage || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><Globe className="w-3 h-3"/> Provider</p>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{vps.provider || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3"/> {vps.billing_cycle || 'Monthly'}</p>
                          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">${vps.renewal_price?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                         <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-800/50">
                           <Network className="w-3.5 h-3.5" />
                           {connCount} {connCount === 1 ? 'Project' : 'Projects'}
                         </div>
                         <div className="flex gap-1.5">
                           <Link href={`/app/vps/${vps.id}`} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 rounded-lg">
                             <ExternalLink className="w-4 h-4" />
                           </Link>
                           <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(vps); }} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 rounded-lg">
                             <Edit3 className="w-4 h-4" />
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); handleOpenDelete(vps); }} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 dark:bg-slate-900 hover:bg-red-50 rounded-lg">
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                      </div>
                    </div>
                  )})}
                </div>
              ) : (
                <div className="bg-white dark:bg-[#161B27] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-5 pl-8 text-xs font-bold text-slate-500 uppercase">VPS Name</th>
                        <th className="p-5 text-xs font-bold text-slate-500 uppercase">IP Address</th>
                        <th className="p-5 text-xs font-bold text-slate-500 uppercase">Specs</th>
                        <th className="p-5 text-xs font-bold text-slate-500 uppercase">Renewal Stats</th>
                        <th className="p-5 text-xs font-bold text-slate-500 uppercase">Projects</th>
                        <th className="p-5 pr-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredVps.map((vps) => (
                        <tr key={vps.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-4 pl-8">
                             <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getVPSGradient(vps.name)} flex items-center justify-center shrink-0`}>
                                 <ServerIcon className="w-5 h-5 text-white" />
                               </div>
                               <div>
                                 <Link href={`/app/vps/${vps.id}`} className="font-bold text-slate-900 dark:text-white hover:text-[#2C79F5] hover:underline underline-offset-2">{vps.name}</Link>
                                 <div className={`text-[10px] font-bold ${vps.is_active ? 'text-emerald-500' : 'text-slate-400'}`}>{vps.is_active ? 'Active' : 'Inactive'}</div>
                               </div>
                             </div>
                          </td>
                          <td className="p-4 text-sm font-semibold text-slate-700 dark:text-slate-300 font-mono">{vps.ip_address || '-'}</td>
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                            {vps.ram || '?'} • {vps.storage || '?'}
                          </td>
                          <td className="p-4">
                            <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">${vps.renewal_price?.toFixed(2) || '0.00'} / {vps.billing_cycle?.toLowerCase() || 'mo'}</div>
                            <div className="text-[10px] font-bold text-slate-500 flex flex-nowrap items-center gap-1"><Calendar className="w-3 h-3"/> {vps.next_renewal_date ? new Date(vps.next_renewal_date).toLocaleDateString() : 'N/A'}</div>
                          </td>
                          <td className="p-4">
                             <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-bold">
                               {getConnectedCount(vps.id)}
                             </span>
                          </td>
                          <td className="p-4 pr-8 text-right">
                             <div className="flex justify-end gap-2">
                               <Link href={`/app/vps/${vps.id}`} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"><ExternalLink className="w-4 h-4"/></Link>
                               <button onClick={() => handleOpenEdit(vps)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"><Edit3 className="w-4 h-4"/></button>
                               <button onClick={() => handleOpenDelete(vps)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* --- SIDE PANEL FORM --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#161B27] shadow-2xl flex flex-col h-full border-l border-slate-200 dark:border-slate-800 animate-slide-in-right">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {formMode === "create" ? "Configure New VPS" : "Edit VPS Settings"}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-tiny-scrollbar">
               <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">VPS Name *</label>
                  <input name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Production Alpha" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5]" />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Root / Username</label>
                    <input name="username" value={formData.username} onChange={handleChange} placeholder="e.g. root" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono outline-none focus:border-[#2C79F5]" />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Public IP Address</label>
                    <input name="ip_address" value={formData.ip_address} onChange={handleChange} placeholder="192.168.1.1" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono outline-none focus:border-[#2C79F5]" />
                 </div>
               </div>

               <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Hosting Provider</label>
                  <input name="provider" value={formData.provider} onChange={handleChange} placeholder="e.g. AWS, Contabo" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5]" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">RAM Specs</label>
                    <input name="ram" value={formData.ram} onChange={handleChange} placeholder="e.g. 8GB" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5]" />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Storage Specs</label>
                    <input name="storage" value={formData.storage} onChange={handleChange} placeholder="e.g. 100GB NVMe" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5]" />
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Billing Cycle</label>
                    <select name="billing_cycle" value={formData.billing_cycle} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5] appearance-none">
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Semi-Annually">Semi-Annually</option>
                      <option value="Yearly">Yearly</option>
                      <option value="One-Time">One-Time</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Next Renewal Date</label>
                    <div className="relative">
                       <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <input name="next_renewal_date" type="date" value={formData.next_renewal_date} onChange={handleChange} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5]" />
                    </div>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Initial Purchase Price ($)</label>
                    <input name="purchase_price" type="number" step="0.01" value={formData.purchase_price} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5]" />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Renewal Price ($)</label>
                    <input name="renewal_price" type="number" step="0.01" value={formData.renewal_price} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5]" />
                 </div>
               </div>

               <div>
                 <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors">
                   <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-5 h-5 rounded text-[#2C79F5] focus:ring-[#2C79F5] bg-white border-gray-300" />
                   <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Server is currently Active</span>
                 </label>
               </div>

               <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Notes (Optional)</label>
                  <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5]" />
               </div>
            </div>

            <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button onClick={() => setIsFormOpen(false)} className="px-5 py-2 font-bold text-sm text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
              <button onClick={handleSubmit} disabled={submitLoading} className="flex items-center gap-2 px-6 py-2 bg-[#2C79F5] text-white font-bold text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 shadow-sm">
                {submitLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {formMode === "create" ? "Save VPS Info" : "Update Records"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE MODAL --- */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDeleteOpen(false)} />
          <div className="relative bg-white dark:bg-[#161B27] rounded-3xl shadow-2xl max-w-sm w-full p-8 border border-slate-200 dark:border-slate-800 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 rotate-3">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Delete VPS?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to permanently delete "{selectedVPS?.name}"? You will lose its recorded configuration.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleDeleteConfirm} disabled={submitLoading} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl flex justify-center items-center gap-2">
                {submitLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Yes, Delete It
              </button>
              <button onClick={() => setIsDeleteOpen(false)} disabled={submitLoading} className="w-full py-3 font-bold text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icon wrapper
function ServerIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  );
}
