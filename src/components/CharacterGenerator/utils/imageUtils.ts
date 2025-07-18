import { CharacterDetails } from './character';

export const races = [
  'Human',
  'Elf',
  'Dwarf',
  'Halfling',
  'Gnome',
  'Dragonborn',
  'Tiefling',
  'Half-Orc',
  'Half-Elf'
];
export const genders = ['Gender-neutral', 'Male', 'Female', 'Non-binary'];
export const classes = [
  'Barbarian',
  'Bard',
  'Cleric',
  'Druid',
  'Fighter',
  'Monk',
  'Paladin',
  'Ranger',
  'Rogue',
  'Sorcerer',
  'Warlock',
  'Wizard'
];
export const ethnicities = [
  '',
  'Caucasian',
  'East Asian',
  'South Asian',
  'African',
  'Hispanic',
  'Middle Eastern',
  'Native American'
];
export const imageTypes = ['', 'portrait', 'full body'];
export const imageRatios = ['1:1', '9:16', '16:9'];

export const classColors: Record<string, string> = {
  Barbarian: '#A52A2A',
  Bard: '#9932CC',
  Cleric: '#6495ED',
  Druid: '#228B22',
  Fighter: '#B22222',
  Monk: '#2F4F4F',
  Paladin: '#DAA520',
  Ranger: '#556B2F',
  Rogue: '#000000',
  Sorcerer: '#8B008B',
  Warlock: '#4B0082',
  Wizard: '#4B0082'
};

export const classColorNames: Record<string, string> = {
  Barbarian: 'Brown',
  Bard: 'Purple',
  Cleric: 'Blue',
  Druid: 'Green',
  Fighter: 'Red',
  Monk: 'Slate',
  Paladin: 'Gold',
  Ranger: 'Olive',
  Rogue: 'Black',
  Sorcerer: 'Dark Magenta',
  Warlock: 'Indigo',
  Wizard: 'Indigo'
};

const raceTraits: Record<string, string> = {
  Elf: 'slender frame, pointed ears, ethereal grace',
  Dwarf: 'stout build, long braided beard',
  Halfling: 'cheerful demeanor, curly hair, small stature',
  Gnome: 'curious expression, clever eyes',
  Human: 'versatile look, confident posture',
  Dragonborn: 'reptilian features, scaled skin',
  Tiefling: 'horns, glowing eyes, infernal heritage',
  'Half-Orc': 'greenish skin, tusks, muscular build',
  'Half-Elf': 'balanced features, mysterious gaze'
};

const classTraits: Record<string, string> = {
  Barbarian: 'covered in tribal tattoos, fierce presence',
  Bard: 'carrying a lute, flamboyant outfit',
  Cleric: 'holy symbol, divine aura',
  Druid: 'nature-infused garments, animal companion',
  Fighter: 'battle-worn armor, commanding stance',
  Monk: 'simple robes, martial discipline',
  Paladin: 'radiant golden armor, holy sword',
  Ranger: 'leather armor, hooded cloak, bow and quiver',
  Rogue: 'dark leather gear, shadowy ambiance',
  Sorcerer: 'arcane energy in hands, mystical eyes',
  Warlock: 'eldritch sigils, ominous aura',
  Wizard: 'long robes, staff with glowing crystal'
};

export function buildPrompt(details: CharacterDetails): string {
  const genderText =
    details.gender === 'Gender-neutral' ? 'androgynous' : details.gender.toLowerCase();
  const ethnicity =
    details.ethnicity && !['Dragonborn', 'Tiefling', 'Half-Orc'].includes(details.race)
      ? ` of ${details.ethnicity} descent`
      : '';
  const imageDesc =
    details.imageType === 'portrait'
      ? 'portrait'
      : details.imageType === 'full body'
      ? 'full body artwork'
      : 'image';
  const composition = imageDesc ? `${imageDesc} of a ` : '';
  const magicClasses = [
    'Bard',
    'Cleric',
    'Druid',
    'Paladin',
    'Ranger',
    'Sorcerer',
    'Warlock',
    'Wizard'
  ];
  const magicEffect = magicClasses.includes(details.class) ? ', powerful magical effects' : '';
  const raceDesc = raceTraits[details.race] || '';
  const classDesc = classTraits[details.class] || '';
  const colorName = classColorNames[details.class] || '';

  let prompt = `A highly detailed fantasy photorealistic digital painting of a ${composition}${genderText} ${details.race} ${details.class} Dungeons and Dragons character${ethnicity}. Cinematic lighting, vibrant colors, glowing ${colorName} particles in the background ${magicEffect}. Aspect ratio ${details.imageRatio}`;
  prompt += `. Traits: ${raceDesc}, ${classDesc}`;
  if (details.refinement) prompt += `. ${details.refinement}`;
  return prompt;
}

export const generateImage = async (
  details: CharacterDetails,
  prompt: string
): Promise<string | null> => {
  const {
    VITE_GENERATIVE_LANGUAGE_API_KEY: apiKey,
    FIRESTORE_EMULATOR_HOST,
    FIREBASE_AUTH_EMULATOR_HOST,
    FIREBASE_STORAGE_EMULATOR_HOST,
    MODE
  } = import.meta.env;

  try {
    const DEV_MODE =
      MODE !== 'production' ||
      FIRESTORE_EMULATOR_HOST ||
      FIREBASE_AUTH_EMULATOR_HOST ||
      FIREBASE_STORAGE_EMULATOR_HOST;

    if (DEV_MODE || !apiKey) {
      if (!apiKey) console.warn('No API key provided, using mock data');

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

      const color = classColors[details.class] || '#808080';
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Fill with class color
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 200, 200);

        // Add some text
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(details.race, 100, 80);
        ctx.fillText(details.class, 100, 100);
        ctx.fillText(details.gender, 100, 120);

        // Convert to base64
        const base64 = canvas.toDataURL('image/png');
        return base64;
      }

      // Fallback: simple base64 encoded 1x1 red pixel
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
    const payload = {
      instances: { prompt },
      parameters: { sampleCount: 1, aspectRatio: details.imageRatio }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('API request failed:', response.status, response.statusText);
      return null;
    }

    const result = await response.json();
    return result.predictions?.[0]?.bytesBase64Encoded
      ? `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`
      : null;
  } catch (error) {
    console.error('Image generation error:', error);
    return null;
  }
};
