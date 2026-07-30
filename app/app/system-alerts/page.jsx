"use client";

import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { Bell, AlertTriangle, Info, Clock, CheckCircle2, ShieldAlert, Trash2 } from "lucide-react";

export default function SystemAlertsPage() {
  const containerRef = useRef(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "system_alerts"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parsedAlerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAlerts(parsedAlerts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useGSAP(() => {
    if (!loading) {
      gsap.fromTo(".animate-alert", 
        { y: 15, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out" }
      );
    }
  }, [loading, alerts.length]);

  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, "system_alerts", id), { is_read: true });
    } catch (error) {
      console.error("Failed to mark alert as read:", error);
    }
  };

  const deleteAlert = async (id) => {
    try {
      await deleteDoc(doc(db, "system_alerts", id));
    } catch (error) {
      console.error("Failed to delete alert:", error);
    }
  };

  const getAlertIcon = (level) => {
    switch (level) {
      case "critical": return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case "urgent": return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "notice": return <Clock className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-indigo-500" />;
    }
  };

  const getAlertBg = (level, isRead) => {
    if (isRead) return "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60";
    switch (level) {
      case "critical": return "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50";
      case "urgent": return "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/50";
      case "warning": return "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/50";
      case "notice": return "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50";
      default: return "bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-900/50";
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50/50 dark:bg-slate-900 font-sans text-slate-900 dark:text-white p-8">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50 py-3 shadow-sm">
          <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">System Alerts</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Monitor automated infrastructure and expiration warnings.</p>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-4 opacity-50" />
          <p className="font-semibold text-slate-500">All systems operational.</p>
          <p className="text-sm text-slate-400">No active alerts at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {alerts.map(alert => (
            <div 
              key={alert.id} 
              className={`animate-alert flex items-start gap-4 p-5 rounded-2xl border shadow-sm transition-all ${getAlertBg(alert.level, alert.is_read)}`}
            >
              <div className="shrink-0 mt-0.5">
                {getAlertIcon(alert.level)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className={`font-bold ${alert.is_read ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                      {alert.title}
                    </h3>
                    <p className={`text-sm mt-1 leading-relaxed ${alert.is_read ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
                      {alert.message}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {formatDate(alert.created_at)}
                  </span>
                </div>

                <div className="flex gap-3 mt-4">
                  {!alert.is_read && (
                    <button 
                      onClick={() => markAsRead(alert.id)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition-colors"
                    >
                      Mark as Read
                    </button>
                  )}
                  <button 
                    onClick={() => deleteAlert(alert.id)}
                    className="text-xs font-bold text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
