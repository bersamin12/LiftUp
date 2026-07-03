import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob;

    if (!audioFile) {
      return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
    }

    // Verify authentication
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Convert audio Blob to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    
    const payload = {
      model: 'nvidia/parakeet-tdt-0.6b-v3',
      input_audio: {
        data: base64Audio,
        format: 'webm' // MediaRecorder in browser defaults to webm
      }
    };

    const response = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterKey}`,
        'HTTP-Referer': 'https://doordrive.local',
        'X-OpenRouter-Title': 'DoorDrive',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter STT Error:', errorText);
      return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: 502 });
    }

    const json = await response.json();
    const transcription = json.text?.trim() || '';

    // Now, let's also pass the transcription to a fast text model to extract the same structure as VLM
    // so we can give the user a pre-filled form.
    const extractPayload = {
      model: 'google/gemini-2.5-flash-8b', // Fast and cheap for text extraction
      messages: [
        {
          role: 'user',
          content: `Extract donation tags from this transcription: "${transcription}".
Return ONLY a raw JSON object:
{"category": "Clothing|Books|Toys|Electronics|Furniture|Household|Other", "condition": "Like New|Well-Used|Needs Repair|Not Working", "sizeBucket": "One bag|Multiple bags|Small item|Large / bulky", "needsTwoCrew": boolean}
Do not include markdown.`
        }
      ]
    };

    let tags = { category: 'Other', condition: 'Well-Used', sizeBucket: 'Small item', needsTwoCrew: false };
    
    try {
      const tagRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterKey}`,
        },
        body: JSON.stringify(extractPayload),
      });
      if (tagRes.ok) {
        const tagJson = await tagRes.json();
        const tagContent = tagJson.choices?.[0]?.message?.content || '{}';
        const cleaned = tagContent.replace(/```json/g, '').replace(/```/g, '').trim();
        tags = JSON.parse(cleaned);
      }
    } catch (e) {
      console.error('Failed to extract tags from transcription', e);
    }

    return NextResponse.json({
      transcription,
      tags
    });

  } catch (err) {
    console.error('Transcribe API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
