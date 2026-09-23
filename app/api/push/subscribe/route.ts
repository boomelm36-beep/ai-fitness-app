// app/api/push/subscribe/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use the Service Role Key to bypass RLS on server-side database writes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { subscription, userId } = await req.json();

    if (!subscription || !userId) {
      return NextResponse.json({ error: "Missing subscription or userId" }, { status: 400 });
    }

    // Save or update subscription
    const { error } = await supabaseAdmin.from('push_subscriptions').upsert(
      {
        user_id: userId,
        subscription: subscription,
      },
      { onConflict: 'user_id, subscription' }
    );

    if (error) {
      console.error("Supabase Database Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}