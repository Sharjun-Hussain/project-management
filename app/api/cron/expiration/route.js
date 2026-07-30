import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import nodemailer from 'nodemailer';

export async function GET(request) {
  // Validate CRON_SECRET in Production to protect the endpoint
  if (process.env.NODE_ENV !== 'development') {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn("Unauthorized cron attempt:", authHeader);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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

    // --- 4. Send Email Notification if there are alerts ---
    if (alertsToCreate.length > 0 && process.env.FALLBACK_EMAIL_USER && process.env.FALLBACK_EMAIL_API_KEY) {
      try {
        const transporter = nodemailer.createTransport({
          host: "smtp-relay.brevo.com",
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: process.env.FALLBACK_EMAIL_USER,
            pass: process.env.FALLBACK_EMAIL_API_KEY,
          },
        });

        const htmlList = alertsToCreate.map(alert => {
          const color = alert.level === 'critical' ? '#dc2626' : alert.level === 'urgent' ? '#ea580c' : '#d97706';
          return `<li style="margin-bottom: 10px;">
            <strong style="color: ${color}; text-transform: uppercase;">[${alert.level}]</strong> 
            <b>${alert.title}</b><br/>
            <span style="color: #475569;">${alert.message}</span>
          </li>`;
        }).join('');

        const mailOptions = {
          from: `"${process.env.FALLBACK_EMAIL_NAME || 'System Alerts'}" <${process.env.FALLBACK_EMAIL_FROM}>`,
          to: process.env.ADMIN_ALERT_EMAIL || "mrjoon005@gmail.com", // Send to admin
          subject: `⚠️ [Action Required] ${alertsToCreate.length} Infrastructure Alerts Generated`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
              <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Infrastructure Expiration Report</h2>
              <p>Your automated cron job just scanned the infrastructure and found <b>${alertsToCreate.length}</b> assets that require your attention:</p>
              <ul style="list-style-type: none; padding-left: 0;">
                ${htmlList}
              </ul>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 12px; color: #94a3b8;">This is an automated message from your Infrastructure Dashboard. Please log in to manage your domains and servers.</p>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log("Infra alerts email dispatched.");
      } catch (mailError) {
        console.error("Failed to send alert email:", mailError);
        // We do not fail the overall run if just the email fails
      }
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
