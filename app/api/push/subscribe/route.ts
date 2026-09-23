// app/api/push/subscribe/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: Request) {
  try {
    const { subscription, userId } = await req.json();

    if (!subscription || !userId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // Save the subscription to Supabase
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      subscription: subscription
    }, { onConflict: 'user_id, subscription' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}