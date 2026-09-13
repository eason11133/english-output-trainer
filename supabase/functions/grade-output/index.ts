// Supabase Edge Function contract stub.
// Deploy later with: supabase functions deploy grade-output
// Keep model/API secrets in Supabase secrets, NEVER in EXPO_PUBLIC_* variables.

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  const payload = await req.json().catch(() => null);
  if (!payload?.answer || !payload?.exerciseId) {
    return new Response(JSON.stringify({ error: 'Missing exerciseId or answer' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  // TODO: Replace with provider-routed grading after the product loop is validated.
  // Required future output contract:
  // {
  //   passed: boolean,
  //   rubric: {...},
  //   errors: [{ code, title, explanation, correction, confidence }],
  //   activatedItems: string[],
  //   suggestedNextTargets: string[],
  //   graderVersion: string
  // }

  return new Response(
    JSON.stringify({
      passed: true,
      errors: [],
      activatedItems: [],
      suggestedNextTargets: [],
      graderVersion: 'edge-stub-v0',
      note: 'AI grading is intentionally not enabled in the first mobile slice.',
    }),
    { headers: { 'content-type': 'application/json' } },
  );
});
