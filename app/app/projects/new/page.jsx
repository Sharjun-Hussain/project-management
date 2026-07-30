"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { ArrowLeft, Save, Loader2, Database, Globe, Server, Briefcase, FileText, Calendar } from "lucide-react";

export default function CreateProjectPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    client_id: "",
    status: "Development",
    description: "",
    start_date: "",
    domain_name: "",
    vps_id: "",
    db_host: "localhost",
    db_name: "",
    db_user: "",
    db_pass: ""
  });

  // Load clients across the CRM
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const snap = await getDocs(collection(db, "clients"));
        setClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error loading clients", err);
      }
    };
    fetchClients();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Project Name is required.");
    if (!formData.client_id) return toast.error("Please assign this project to a client.");

    setLoading(true);
    try {
      await addDoc(collection(db, "projects"), {
        ...formData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      toast.success("Project created safely!");
      router.push("/app/projects");
    } catch (e) {
      toast.error("Error creating project: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F1117] font-sans pb-20">
      
      {/* Top Navigation */}
      <div className="bg-white dark:bg-[#161B27] border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white leading-none">New Project</h1>
            <p className="text-xs text-slate-400 mt-1">Setup hosting, domains, and database credentials</p>
          </div>
        </div>
        <div>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2C79F5] text-white text-sm font-bold rounded-lg shadow-sm hover:bg-[#1a6ae0] focus:ring-4 focus:ring-blue-500/20 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
            Create Project
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="w-full mt-8 px-8">
        <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Section 1: Overview */}
          <div className="bg-white dark:bg-[#161B27] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Project details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Project Name *</label>
                <input 
                  name="name" value={formData.name} onChange={handleChange} required
                  placeholder="e.g. Acme Corp CRM"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5] focus:ring-2 focus:ring-[#2C79F5]/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Assign to Client *</label>
                <select 
                  name="client_id" value={formData.client_id} onChange={handleChange} required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5] focus:ring-2 focus:ring-[#2C79F5]/20"
                >
                  <option value="" disabled>Select a client...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.company_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                <select 
                  name="status" value={formData.status} onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5] focus:ring-2 focus:ring-[#2C79F5]/20"
                >
                  <option value="Prototyping">Prototyping</option>
                  <option value="Development">Development</option>
                  <option value="Testing">Testing</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Target Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="date" name="start_date" value={formData.start_date} onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5] focus:ring-2 focus:ring-[#2C79F5]/20"
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description (Optional)</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea 
                    name="description" value={formData.description} onChange={handleChange}
                    rows={3} placeholder="Brief details about the project requirements..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5] focus:ring-2 focus:ring-[#2C79F5]/20 resize-y"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Integrations & DB */}
          <div className="space-y-8">
            {/* Section 2: Hosting & Domains */}
            <div className="bg-white dark:bg-[#161B27] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Hosting & Domain Integrations
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Primary Domain Name</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      name="domain_name" value={formData.domain_name} onChange={handleChange}
                      placeholder="e.g. acmecorp.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5] focus:ring-2 focus:ring-[#2C79F5]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Assigned VPS Server</label>
                  <div className="relative">
                    <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select 
                      name="vps_id" value={formData.vps_id} onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5] focus:ring-2 focus:ring-[#2C79F5]/20 appearance-none"
                    >
                      <option value="">None yet (Pending configuration)</option>
                      {/* Add actual VPS pulling from firestore later */}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Database Details */}
            <div className="bg-white dark:bg-[#161B27] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#2C79F5] opacity-80" />
              
              <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Database className="w-4 h-4" /> Database Credentials
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">DB Host</label>
                  <input 
                    name="db_host" value={formData.db_host} onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5] focus:ring-2 focus:ring-[#2C79F5]/20 font-mono"
                  />
                </div>

                 <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Database Name</label>
                  <input 
                    name="db_name" value={formData.db_name} onChange={handleChange}
                    placeholder="e.g. acmecorp_db"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5] focus:ring-2 focus:ring-[#2C79F5]/20 font-mono"
                  />
                </div>

                 <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Database User</label>
                  <input 
                    name="db_user" value={formData.db_user} onChange={handleChange}
                    placeholder="admin_acmecorp"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5] focus:ring-2 focus:ring-[#2C79F5]/20 font-mono"
                  />
                </div>

                 <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Database Password</label>
                  <input 
                    name="db_pass" value={formData.db_pass} onChange={handleChange} type="text"
                    placeholder="Strong Secure Password"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5] focus:ring-2 focus:ring-[#2C79F5]/20 font-mono"
                  />
                </div>
              </div>
              
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
