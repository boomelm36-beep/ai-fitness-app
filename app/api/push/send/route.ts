// app/api/push/send/route.ts
import { NextResponse } from 'next/server';
import webPush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webPush.setVapidDetails(
  'boomelm36@gmail.com', // Replace with your email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Note: You need your service role key in .env for backend overrides
);

export async function POST(req: Request) {
  try {
    const { userId, title, message } = await req.json();

    // Get all devices for this user
    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId);

    if (!subs || subs.length === 0) {
      return NextResponse.json({ error: "No subscriptions found" }, { status: 404 });
    }

    const payload = JSON.stringify({ title, body: message, icon: '/icon-192.png' });

    // Send push to all registered devices
    for (const sub of subs) {
      await webPush.sendNotification(sub.subscription, payload).catch(err => console.error("Push error:", err));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}