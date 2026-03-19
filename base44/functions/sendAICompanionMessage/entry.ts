import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

const TONE_INSTRUCTIONS = {
  zen: 'Tone: Calm, mindful, and reassuring. Focus on balance, breathing, and presence. Use gentle, soothing language. Be a grounding influence. "Take a breath, [Name]."',
  rick: 'Tone: Witty, sarcastic, and scientific (like Rick Sanchez). Don\'t suffer fools, but give good advice. Focus on the raw data and biology. "Listen, [Name], here\'s the math..."',
  lofi: 'Tone: Chill, aesthetic, low-key. Vibes are immaculate. Short, relaxed sentences. "Just vibing. 🌿" Use soft language.',
  clinical: 'Tone: Objective, precise, data-focused. Use correct terminology (bioavailability, metabolic clearance, half-life). Professional, educational, but not cold.',
  dude: 'Tone: The ultimate chill homie. "The Dude" energy. Very relaxed, conversational, friendly. "Yeah, man, that session looks solid." Supportive and easygoing.'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, userMessage, toneMode } = await req.json();

    if (!chatId || !userMessage) {
      return Response.json({ error: 'Missing chatId or userMessage' }, { status: 400 });
    }

    // Get chat history for context
    const messages = await base44.entities.Message.filter(
      { chatId },
      'created_date',
      20
    );

    // Build conversation history
    const conversationHistory = messages
      .slice(-10)
      .map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.text}`)
      .join('\n');

    // Use firstName if available, otherwise fall back to first name from full_name
    let firstName = user.firstName;
    if (!firstName && user.full_name) {
      firstName = user.full_name.split(' ')[0];
    }
    if (!firstName) {
      firstName = 'friend';
    }

    // Get most recent sessions for accurate timing
    const recentSessions = await base44.entities.Session.filter(
      { uid: user.id },
      '-created_date',
      5
    );

    const now = new Date();
    const activeSessions = recentSessions.filter(s => {
      try {
        const soberTime = new Date(s.soberAt);
        return !isNaN(soberTime.getTime()) && soberTime > now;
      } catch {
        return false;
      }
    });

    // Calculate accurate timing context
    let timingContext = '';
    if (activeSessions.length > 0) {
      const mostRecentSession = activeSessions.reduce((newest, s) => {
        const sTime = new Date(s.startedAt);
        const newestTime = new Date(newest.startedAt);
        return sTime > newestTime ? s : newest;
      });

      const minutesSinceMostRecent = Math.round((now - new Date(mostRecentSession.startedAt)) / 60000);
      
      // Determine peak timing based on method
      const methodPeakTimes = {
        vape_dry: 10,
        vape_cart: 10,
        smoke: 10,
        dab: 5,
        oil_sublingual: 30,
        oil_ingested: 90,
        edible: 90
      };
      
      const peakTime = methodPeakTimes[mostRecentSession.method] || 10;
      
      if (minutesSinceMostRecent < peakTime - 2) {
        timingContext = `This dose was taken ${minutesSinceMostRecent}m ago - effects are building toward peak (expected at ~${peakTime}m).`;
      } else if (minutesSinceMostRecent < peakTime + 5) {
        timingContext = `This dose was taken ${minutesSinceMostRecent}m ago - at or near peak effects now (peak was ~${peakTime}m).`;
      } else {
        const hoursSince = Math.floor(minutesSinceMostRecent / 60);
        timingContext = `The most recent dose was ${hoursSince > 0 ? `${hoursSince}h ` : ''}${minutesSinceMostRecent % 60}m ago - past peak, effects are gradually tapering.`;
      }
    }

    // Build AI prompt
    const toneInstruction = TONE_INSTRUCTIONS[toneMode || 'zen'];
    const systemPrompt = `You are "Session Buddy AI", an intelligent, data-driven, and supportive cannabis coaching companion for ${firstName}.
Your mission is to help the user consume mindfully, track their usage, and stay safe.

CORE PERSONA & ROLE:
- **Supportive Coach:** You are non-judgmental, warm, and conversational. You are here to help, not lecture.
- **Data-Driven:** You love numbers. Use the user's session data (provided below) to explain their buzz, tolerance, and patterns.
- **Harm Reduction:** You ALWAYS encourage safe limits, hydration, and breaks. You NEVER encourage reckless use.
- **Educational:** You explain the "science" simply (e.g., bio-availability, decay curves) to empower the user.

CRITICAL BOUNDARIES:
1. **NOT A Doctor:** You do NOT give medical advice, diagnose, or prescribe.
2. **Legal & Safety:** Do NOT help with illegal acts. DO NOT advise driving or operating machinery while impaired.
3. **Disclaimers:** Remind the user that all "Predictor" and "Buzz" numbers are educational estimates, not medical facts.

TONE SETTING (${toneMode || 'zen'}):
${toneInstruction}

CURRENT STATUS & DATA:
${timingContext ? `[ACTIVE SESSION DATA]: ${timingContext}` : '[STATUS]: No active sessions detected right now.'}
(Use this timing data to explain why they might feel a certain way *right now*.)

[SYSTEM INSTRUCTIONS]:
- If the user's message contains [SYSTEM DATA], use that strictly to answer their questions about stats/history.
- Proactively offer help: "Want to plan a session?", "Shall we check your tolerance?", "Need a hydration reminder?"
- Keep responses concise, helpful, and human-like.
- Use the user's name (${firstName}) naturally.

RECENT CHAT HISTORY:
${conversationHistory}

USER MESSAGE:
${userMessage}`;

    // Call LLM
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: systemPrompt
    });

    return Response.json({ reply: response });

  } catch (error) {
    console.error('Error in sendAICompanionMessage:', error);
    return Response.json({ 
      error: error.message || 'Failed to process message' 
    }, { status: 500 });
  }
});