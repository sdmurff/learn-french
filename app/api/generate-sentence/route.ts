import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { difficulty, theme } = await request.json();

    if (!difficulty || !theme) {
      return NextResponse.json(
        { error: 'Difficulty and theme are required' },
        { status: 400 }
      );
    }

    // Validate difficulty level
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    if (!validLevels.includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty level' },
        { status: 400 }
      );
    }

    // Theme-specific vocabulary and context
    const themeGuidance: Record<string, string> = {
      'General': 'everyday activities, common objects, basic situations, or general conversation',
      'Travel': 'airports, hotels, transportation, directions, tourist activities, or travel experiences. Use vocabulary like avion, gare, hôtel, voyage, valise, billet',
      'Food': 'restaurants, cooking, ingredients, meals, recipes, or dining experiences. Use vocabulary like restaurant, manger, cuisine, plat, dessert, boisson',
      'Daily Life': 'routines, household tasks, family activities, work, school, or typical day-to-day situations. Use vocabulary like maison, famille, travail, école, quotidien'
    };

    const themeContext = themeGuidance[theme] || themeGuidance['General'];

    // Generate French sentence using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a French language teacher creating dictation exercises. Generate a single French sentence appropriate for CEFR level ${difficulty}.

IMPORTANT: The sentence MUST be directly about ${themeContext}.

The sentence should:
- Be grammatically correct and natural
- Include appropriate French accents and punctuation
- Match the complexity of ${difficulty} level
- Clearly relate to the theme "${theme}"

Only return the French sentence, nothing else.`,
        },
        {
          role: 'user',
          content: `Generate a ${difficulty} level French sentence specifically about ${theme}.`,
        },
      ],
      temperature: 0.9,
    });

    const sentenceText = completion.choices[0]?.message?.content?.trim();

    if (!sentenceText) {
      return NextResponse.json(
        { error: 'Failed to generate sentence' },
        { status: 500 }
      );
    }

    // Store sentence in database
    const { data, error } = await supabase
      .from('sentences')
      .insert({
        text: sentenceText,
        difficulty,
        theme,
        source: 'generated',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to store sentence' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id,
      text: sentenceText,
      difficulty,
      theme,
    });
  } catch (error) {
    console.error('Error generating sentence:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
