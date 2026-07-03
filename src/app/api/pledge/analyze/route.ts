import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const maxDuration = 30; // Serverless function max duration (Vercel)

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Missing imageBase64' }, { status: 400 });
    }

    // Verify authentication
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {}, // read-only in API route for auth check
        },
      }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json({ error: 'Server configuration error (OpenRouter Key)' }, { status: 500 });
    }

    // Call OpenRouter VLM (xiaomi/mimo-v2.5)
    // We expect structured JSON back.
    const prompt = `Analyze this image of an item meant for a donation drive.
Return ONLY a raw JSON object with the following keys:
- "category": string (e.g., "Clothing", "Books", "Toys", "Electronics", "Furniture", "Household", "Other")
- "condition": string (must be exactly one of: "Like New", "Well-Used", "Needs Repair", "Not Working")
- "sizeBucket": string (must be exactly one of: "One bag", "Multiple bags", "Small item", "Large / bulky")
- "needsTwoCrew": boolean (true if it's heavy like furniture or a large appliance)

Example output:
{"category": "Clothing", "condition": "Well-Used", "sizeBucket": "One bag", "needsTwoCrew": false}
Do not include any markdown formatting like \`\`\`json. Return just the JSON string.`;

    const payload = {
      model: 'xiaomi/mimo-v2.5',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageBase64 } }
          ]
        }
      ]
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterKey}`,
        'HTTP-Referer': 'https://doordrive.local',
        'X-Title': 'DoorDrive',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter VLM Error:', errorText);
      return NextResponse.json({ error: 'Failed to analyze image' }, { status: 502 });
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content || '{}';
    
    // Parse the JSON safely
    let parsed;
    try {
      // Strip markdown code blocks if the model ignored instructions
      const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse VLM output:', content);
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 502 });
    }

    return NextResponse.json(parsed);

  } catch (err) {
    console.error('Analyze API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
