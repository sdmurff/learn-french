import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { difficulty, theme, contentLength = 'sentence' } = await request.json();

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

    // Content length specific prompts
    const contentPrompts = {
      word: {
        system: `You are a French language teacher creating vocabulary exercises. Generate a single French word appropriate for CEFR level ${difficulty}.

IMPORTANT: The word MUST be directly related to ${themeContext}.

The word should:
- Be a common, useful vocabulary word
- Include appropriate French accents
- Match the complexity of ${difficulty} level
- Clearly relate to the theme "${theme}"

Only return the French word, nothing else (no articles, no punctuation).`,
        user: `Generate a single ${difficulty} level French word specifically related to ${theme}.`,
      },
      sentence: {
        system: `You are a French language teacher creating dictation exercises. Generate a single French sentence appropriate for CEFR level ${difficulty}.

IMPORTANT: The sentence MUST be directly about ${themeContext}.

The sentence should:
- Be grammatically correct and natural
- Include appropriate French accents and punctuation
- Match the complexity of ${difficulty} level
- Clearly relate to the theme "${theme}"

Only return the French sentence, nothing else.`,
        user: `Generate a ${difficulty} level French sentence specifically about ${theme}.`,
      },
      phrase: {
        system: `You are a French language teacher creating vocabulary exercises. Generate a common French phrase or expression appropriate for CEFR level ${difficulty}.

IMPORTANT: The phrase MUST be directly related to ${themeContext}.

The phrase should:
- Be a frequently used expression or combination of words in French
- NOT be a complete grammatical sentence (avoid subject-verb structures)
- Include appropriate French accents and punctuation
- Match the complexity of ${difficulty} level
- Clearly relate to the theme "${theme}"
- Be idiomatic and natural (like "bon appétit", "s'il vous plaît", "à bientôt", "bien sûr", etc.)

Examples of phrases: "de rien", "tout de suite", "avec plaisir", "pas du tout", "en général"

Only return the French phrase, nothing else.`,
        user: `Generate a common ${difficulty} level French phrase or expression specifically related to ${theme}.`,
      },
      paragraph: {
        system: `You are a French language teacher creating dictation exercises. Generate a short French paragraph (3-5 sentences) appropriate for CEFR level ${difficulty}.

IMPORTANT: The paragraph MUST be directly about ${themeContext}.

The paragraph should:
- Be grammatically correct and natural
- Include appropriate French accents and punctuation
- Match the complexity of ${difficulty} level
- Clearly relate to the theme "${theme}"
- Form a coherent, connected set of sentences

Only return the French paragraph, nothing else.`,
        user: `Generate a short ${difficulty} level French paragraph (3-5 sentences) specifically about ${theme}.`,
      },
    };

    const selectedPrompt = contentPrompts[contentLength as 'word' | 'sentence' | 'phrase' | 'paragraph'] || contentPrompts.sentence;

    // Generate French content using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: selectedPrompt.system,
        },
        {
          role: 'user',
          content: selectedPrompt.user,
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

    // Generate English translation
    const translationCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Translate the following French text to English. Provide only the English translation, nothing else.',
        },
        {
          role: 'user',
          content: sentenceText,
        },
      ],
      temperature: 0.3,
    });

    const translation = translationCompletion.choices[0]?.message?.content?.trim();

    // Store sentence in database
    const { data, error } = await supabase
      .from('sentences')
      .insert({
        text: sentenceText,
        translation: translation || null,
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
      translation: translation || null,
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
