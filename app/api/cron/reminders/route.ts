// app/api/cron/reminders/route.ts
import { NextResponse } from 'next/server';
import webPush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webPush.setVapidDetails(
  'mailto:your-email@example.com', // Replace with your actual email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// We use GET for cron jobs
export async function GET(req: Request) {
  try {
    // 1. SECURE THE ROUTE: Check for a secret key so only your Cron service can run this
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch all active device subscriptions
    const { data: subs, error } = await supabaseAdmin.from('push_subscriptions').select('*');
    if (error) throw error;
    if (!subs || subs.length === 0) return NextResponse.json({ message: "No subscribers found." });

    let successCount = 0;
    let failedCount = 0;

    // 3. Loop through and send the automated daily reminder
    const sendPromises = subs.map(async (sub) => {
      const payload = JSON.stringify({ 
        title: "⚡ AI Fit Reminder", 
        body: "Have you logged your water and meals today? Keep your streak alive!", 
        icon: "/icon-192.png",
        url: "/dashboard" // Tells the service worker where to navigate on click
      });

      try {
        await webPush.sendNotification(sub.subscription, payload);
        successCount++;
      } catch (err: any) {
        // 4. PRODUCTION CLEANUP: If the user revoked permission, the browser returns 410 (Gone) or 404.
        // We must delete these from the database so we don't spam dead devices.
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
        }
        failedCount++;
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, sent: successCount, removed: failedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}