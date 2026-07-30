"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc, orderBy, query } from "firebase/firestore";
import { 
  Plus, Search, Briefcase, Trash2, Loader2, Database, Globe, Calendar, DollarSign
} from "lucide-react";
import Link from "next/link";

const STAGES = ["All", "Prototyping", "Development", "Testing", "Active", "Completed", "On Hold"];

export default function ProjectsListPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeStage, setActiveStage] = useState("All");

  const fetchData = async () => {
    try {
      // Fetch Clients for mapping
      const clientsSnap = await getDocs(collection(db, "clients"));
      const clientsMap = {};
      clientsSnap.docs.forEach(doc => {
        clientsMap[doc.id] = doc.data();
      });
      setClients(clientsMap);

      // Fetch Projects
      const snap = await getDocs(query(collection(db, "projects"), orderBy("created_at", "desc")));
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this project completely? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "projects", id));
      toast.success("Project deleted");
      fetchData();
    } catch (e) {
      toast.error("Failed to delete project: " + e.message);
    }
  };

  // Filter by search and stage
  const filtered = projects.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || 
                          p.domain_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStage = activeStage === "All" || p.status === activeStage;
    return matchesSearch && matchesStage;
  });

  // Calculate counts
  const stageCounts = STAGES.reduce((acc, stage) => {
    acc[stage] = stage === "All" ? projects.length : projects.filter(p => p.status === stage).length;
    return acc;
  }, {});

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800";
      case "Development": return "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800";
      case "Testing": return "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800";
      case "Prototyping": return "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800";
      case "Completed": return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700";
      case "On Hold": return "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:border-red-800";
      default: return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700";
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F1117] font-sans flex flex-col">
      
      {/* Top Header - Sticky */}
      <div className="bg-white dark:bg-[#161B27] border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm h-20">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#2C79F5]" /> 
            Projects Pipeline
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Manage deliverables, domains, and budgets</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search domains or projects..." 
              className="w-72 pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] outline-none focus:ring-2 focus:ring-[#2C79F5]/20 focus:border-[#2C79F5] transition-all font-medium"
            />
          </div>
          <Link href="/app/projects/new">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#2C79F5] text-white text-sm font-bold rounded-lg shadow-sm hover:bg-[#1a6ae0] transition-colors">
              <Plus className="w-4 h-4" /> New Project
            </button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          
          {/* Pipeline Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {STAGES.map(stage => {
              const isActive = activeStage === stage;
              return (
                <button
                  key={stage}
                  onClick={() => setActiveStage(stage)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all whitespace-nowrap border
                    ${isActive 
                      ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-sm" 
                      : "bg-transparent border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                    }`}
                >
                  {stage}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-[#2C79F5]/10 text-[#2C79F5]' : 'bg-slate-200/50 dark:bg-slate-800 text-slate-500'}`}>
                    {stageCounts[stage] || 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-[#161B27] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            
            {/* Headers */}
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_80px] gap-6 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Project</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Client</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Value</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Start Date</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <div className="p-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400"/></div>
              ) : filtered.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">No projects found</h3>
                  <p className="text-xs text-slate-500">Try adjusting your filters or search term.</p>
                </div>
              ) : (
                filtered.map((pr) => {
                  const client = clients[pr.client_id];
                  
                  return (
                    <div 
                      key={pr.id} 
                      onClick={() => router.push(`/app/projects/${pr.id}`)}
                      className="group grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_80px] gap-6 px-6 py-4 hover:bg-[#F0F5FF] dark:hover:bg-[#1e2740]/80 transition-colors duration-150 items-center cursor-pointer"
                    >
                      {/* Project Col */}
                      <div>
                        <p className="text-[14px] font-bold text-slate-900 dark:text-white mb-1">{pr.name}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          {pr.domain_name && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                              <Globe className="w-3.5 h-3.5 text-slate-400" /> {pr.domain_name}
                            </span>
                          )}
                          {pr.db_name && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                              <Database className="w-3.5 h-3.5 text-slate-400" /> {pr.db_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Client Col */}
                      <div>
                        {client ? (
                           <div className="flex items-center gap-2">
                             <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200 dark:border-slate-700">
                               {client.company_name?.charAt(0) || client.first_name?.charAt(0) || "?"}
                             </div>
                             <div>
                               <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300">{client.company_name || client.first_name}</p>
                               <p className="text-[10px] text-slate-400">{client.email || 'No email'}</p>
                             </div>
                           </div>
                        ) : (
                          <span className="text-[12px] font-mono text-slate-400 truncate block w-full">{pr.client_id}</span>
                        )}
                      </div>

                      {/* Status Col */}
                      <div>
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${getStatusColor(pr.status || "Development")}`}>
                          {pr.status || "Development"}
                        </span>
                      </div>

                      {/* Value Col */}
                      <div className="flex items-center gap-1.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${pr.total_cost > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                          <DollarSign className={`w-3.5 h-3.5 ${pr.total_cost > 0 ? 'text-emerald-500' : 'text-slate-400'}`} />
                        </div>
                        <span className={`text-[13px] font-bold ${pr.total_cost > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                          {pr.total_cost > 0 ? pr.total_cost.toLocaleString() : "Set Price"}
                        </span>
                      </div>

                      {/* Date Col */}
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5 opacity-70" />
                        <span className="text-[12px] font-medium">
                          {pr.start_date ? new Date(pr.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                        </span>
                      </div>

                      {/* Actions Col */}
                      <div className="flex justify-end items-center">
                        <button
                          onClick={(e) => handleDelete(e, pr.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center text-[11px] text-slate-400 font-semibold">
               <span>Showing {filtered.length} projects</span>
               <span>Sorted by: Newest First</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
