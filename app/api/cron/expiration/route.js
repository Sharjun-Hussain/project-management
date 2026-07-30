import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export async function GET(request) {
  // Validate CRON_SECRET to protect the endpoint from unauthorized calls
  // (You need to set CRON_SECRET in your Vercel Environment Variables)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("Unauthorized cron attempt:", authHeader);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const alertsToCreate = [];
    const now = new Date();

    // --- 1. Check VPS Expirations ---
    const vpsSnap = await getDocs(collection(db, 'vps'));
    vpsSnap.forEach(doc => {
      const data = doc.data();
      if (!data.next_renewal_date) return;
      
      const expiry = new Date(data.next_renewal_date);
      const diffMs = expiry - now;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      let alertLevel = null;
      let alertMessage = null;

      // Check daily intervals
      if (diffDays === 1) {
        alertLevel = "urgent";
        alertMessage = `URGENT: VPS "${data.name}" expires in 1 day!`;
      } else if (diffDays === 3) {
        alertLevel = "warning";
        alertMessage = `VPS "${data.name}" expires in 3 days.`;
      } else if (diffDays === 7) {
        alertLevel = "notice";
        alertMessage = `VPS "${data.name}" expires in 7 days.`;
      } else if (diffDays === 30) {
        alertLevel = "info";
        alertMessage = `VPS "${data.name}" expires in exactly 1 month.`;
      }

      if (alertLevel) {
        alertsToCreate.push({
          type: "VPS_EXPIRATION",
          level: alertLevel,
          title: `VPS Expiration: ${data.name}`,
          message: alertMessage,
          entity_id: doc.id,
          entity_type: "vps",
          is_read: false,
          created_at: serverTimestamp()
        });
      }
    });

    // --- 2. Check Domain Expirations ---
    const domainSnap = await getDocs(collection(db, 'domains'));
    domainSnap.forEach(doc => {
      const data = doc.data();
      if (!data.expiry_date || data.status === "Expired" || data.status === "Transferred") return;
      
      const expiry = new Date(data.expiry_date);
      const diffMs = expiry - now;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      let alertLevel = null;
      let alertMessage = null;

      if (diffDays === 1) {
        alertLevel = "urgent";
        alertMessage = `URGENT: Domain "${data.name}" expires in 1 day!`;
      } else if (diffDays === 3) {
        alertLevel = "warning";
        alertMessage = `Domain "${data.name}" expires in 3 days.`;
      } else if (diffDays === 7) {
        alertLevel = "notice";
        alertMessage = `Domain "${data.name}" expires in 7 days.`;
      } else if (diffDays === 30) {
        alertLevel = "info";
        alertMessage = `Domain "${data.name}" expires in exactly 1 month.`;
      }

      if (alertLevel) {
        alertsToCreate.push({
          type: "DOMAIN_EXPIRATION",
          level: alertLevel,
          title: `Domain Expiration: ${data.name}`,
          message: alertMessage,
          entity_id: doc.id,
          entity_type: "domain",
          is_read: false,
          created_at: serverTimestamp()
        });
      }
    });

    // --- 3. Save Alerts to Database ---
    const savedAlerts = [];
    for (const alert of alertsToCreate) {
      const ref = await addDoc(collection(db, 'system_alerts'), alert);
      savedAlerts.push(ref.id);
    }

    return NextResponse.json({ 
      success: true, 
      scanned_vps: vpsSnap.size,
      scanned_domains: domainSnap.size,
      generated_alerts: savedAlerts.length 
    });

  } catch (error) {
    console.error("Expiration Cron Error:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
