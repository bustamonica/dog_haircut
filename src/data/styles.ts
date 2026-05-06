export type StyleCategory = 'groomer-real' | 'fun' | 'seasonal' | 'designer'

/**
 * Each style has a coat-shape preset that the SVG dog renderer reads:
 * - bodyFluff / headFluff / earFluff: 0..1 multipliers for fur volume
 * - tone: hex tint for the coat (separate from breed base color)
 * - accent: optional accent color (mohawk, dye, etc)
 * - silhouette: extra path embellishments ("mohawk", "topknot", "shaved", "lion-mane")
 * - description / groomerBrief: language the user shows to a groomer
 */
export type Style = {
  id: string
  name: string
  category: StyleCategory
  pro: boolean
  blurb: string // internet-pilled tagline
  description: string // what the user actually wants
  groomerBrief: string // technical request to bring to the groomer
  /**
   * Filename (in /public/references) of a reference photo of a poodle/doodle
   * wearing this haircut. When present, the Gemini call uses the reference
   * as a visual target instead of relying on text alone.
   * Example: 'mohawk.jpg' → loaded from /references/mohawk.jpg.
   */
  referenceImage?: string
  coat: {
    bodyFluff: number
    headFluff: number
    earFluff: number
    tone?: string
    accent?: string
    silhouette?: 'standard' | 'mohawk' | 'topknot' | 'shaved' | 'lion-mane' | 'mullet' | 'sculpted'
    saturate?: number
  }
}

export const STYLES: Style[] = [
  {
    id: 'teddy-bear',
    name: 'Teddy Bear',
    category: 'groomer-real',
    pro: false,
    blurb: 'The one everyone asks for and nobody can explain.',
    description: 'Even, rounded fluff at about 1 to 1.5 inches. Round face, round paws, round everything.',
    groomerBrief:
      'Teddy bear cut: 1–1.5" body length, scissor-finished. Round head, round muzzle, round paws. No shaved face. Blend ears into head shape.',
    referenceImage: 'teddy-bear.jpg',
    coat: { bodyFluff: 0.9, headFluff: 0.95, earFluff: 0.85, silhouette: 'standard' },
  },
  {
    id: 'puppy-cut',
    name: 'Puppy Cut',
    category: 'groomer-real',
    pro: false,
    blurb: 'Forever 6 months old.',
    description: 'Short, even all over. Easy to maintain, hard to mess up.',
    groomerBrief: 'Puppy cut: 1/2" all over with #4F or #5F blade. Tidy face and feet, no scissor work needed.',
    referenceImage: 'puppy-cut.jpg',
    coat: { bodyFluff: 0.55, headFluff: 0.6, earFluff: 0.55, silhouette: 'standard' },
  },
  {
    id: 'kennel-cut',
    name: 'Kennel Cut',
    category: 'groomer-real',
    pro: false,
    blurb: "It's giving 'low maintenance era'.",
    description: 'The shortest reasonable length. For when your dog is a swamp creature by week 3.',
    groomerBrief: 'Kennel cut: #7F blade body, #10 sanitary. Clean ears and feet. Function over form.',
    referenceImage: 'kennel-cut.jpg',
    coat: { bodyFluff: 0.35, headFluff: 0.4, earFluff: 0.35, silhouette: 'standard' },
  },
  {
    id: 'lion-cut',
    name: 'Lion Cut',
    category: 'groomer-real',
    pro: false,
    blurb: 'Tiny dog. Major Sphinx energy.',
    description: 'Body shaved short, full mane around head and shoulders, tail tuft at the end.',
    groomerBrief: 'Lion cut: #7F body, leave full mane to shoulders and around face. Pom on tail tip. Clean feet.',
    referenceImage: 'lion-cut.jpg',
    coat: { bodyFluff: 0.25, headFluff: 1, earFluff: 0.85, silhouette: 'lion-mane' },
  },
  {
    id: 'continental',
    name: 'Continental',
    category: 'groomer-real',
    pro: true,
    blurb: 'Show ring or bust.',
    description: 'Sculpted poodle silhouette. Pompoms on legs and tail, shaved hindquarters and face.',
    groomerBrief: 'Continental clip: shave hindquarters, face, and feet. Leave rosettes on hips, bracelets on legs, full pom on tail. Topknot banded.',
    referenceImage: 'continental.jpg',
    coat: { bodyFluff: 0.5, headFluff: 1, earFluff: 0.7, silhouette: 'sculpted' },
  },
  {
    id: 'powder-puff',
    name: 'Powder Puff',
    category: 'groomer-real',
    pro: false,
    blurb: 'A cloud. With a face.',
    description: 'Maximum round fluff, scissor-finished. Show-style without the show.',
    groomerBrief: 'Round-scissored finish at 2"+, fluffed and powdered. No clipper marks. Bichon-style head.',
    referenceImage: 'powder-puff.jpg',
    coat: { bodyFluff: 1, headFluff: 1, earFluff: 0.95, silhouette: 'standard' },
  },
  {
    id: 'summer-shave',
    name: 'Summer Shave',
    category: 'seasonal',
    pro: false,
    blurb: 'August in Phoenix energy.',
    description: 'Short to the skin everywhere. We know, we know — vet says it can affect coat regrowth on doubles. Pick wisely.',
    groomerBrief: '#10 blade body, #15 sanitary, light scissor on head if requested. Note: not advised for double-coated breeds.',
    referenceImage: 'summer-shave.jpg',
    coat: { bodyFluff: 0.18, headFluff: 0.25, earFluff: 0.25, silhouette: 'shaved' },
  },
  {
    id: 'show-cut',
    name: 'Show Cut',
    category: 'groomer-real',
    pro: true,
    blurb: 'For the dog with a LinkedIn.',
    description: 'Breed-standard show coat. Fully scissored, hand-stripped where required.',
    groomerBrief: 'Breed-standard show clip per current AKC profile. Hand-stripped. Confirm event date for grow-out.',
    referenceImage: 'show-cut.jpg',
    coat: { bodyFluff: 0.85, headFluff: 0.9, earFluff: 0.9, silhouette: 'standard' },
  },
  {
    id: 'mohawk',
    name: 'Mohawk',
    category: 'fun',
    pro: false,
    blurb: 'Punk is not dead. It is just at the groomer.',
    description: 'Body short, narrow ridge of fluff straight down the spine and through the topknot.',
    groomerBrief: '#5F body. Leave 1.5" ridge from base of skull to mid-back, scissored upright. Optional gel hold.',
    referenceImage: 'mohawk.jpg',
    coat: { bodyFluff: 0.45, headFluff: 0.7, earFluff: 0.5, silhouette: 'mohawk', accent: '#1A1815' },
  },
  {
    id: '70s-rockstar',
    name: '1970s Rockstar',
    category: 'fun',
    pro: true,
    blurb: 'Has a backstage rider.',
    description: 'Loose, layered shag. Volume on top, feathered ears like sideburns.',
    groomerBrief: 'Long body coat layered with thinning shears. Heavy feathering on ears and tail. Center part on head.',
    referenceImage: '70s-rockstar.jpg',
    coat: { bodyFluff: 0.95, headFluff: 0.9, earFluff: 1, silhouette: 'mullet' },
  },
  {
    id: 'hes-just-a-boy',
    name: "He's Just A Boy",
    category: 'fun',
    pro: true,
    blurb: 'Soft. Confused. Beloved.',
    description: 'Slightly overgrown puppy cut with permanent bedhead. Eyes barely visible. Forgivable.',
    groomerBrief: 'Scruffy 1.5" body, intentionally uneven. Light face shaping but leave eye fringe. Do NOT clean up too much.',
    referenceImage: 'hes-just-a-boy.jpg',
    coat: { bodyFluff: 0.8, headFluff: 1, earFluff: 0.85, silhouette: 'standard', tone: '#E2BD83' },
  },
  {
    id: 'main-character',
    name: 'Main Character',
    category: 'fun',
    pro: true,
    blurb: 'You are not the protagonist. The dog is.',
    description: 'Deliberate volume on the head, dramatic ear feathering, body kept clean to draw the eye up.',
    groomerBrief: 'Long head + ear coat scissored for volume. Body trimmed clean at 1/2" to contrast.',
    referenceImage: 'main-character.jpg',
    coat: { bodyFluff: 0.45, headFluff: 1, earFluff: 1, silhouette: 'topknot' },
  },
  {
    id: 'witness-protection',
    name: 'Witness Protection',
    category: 'fun',
    pro: true,
    blurb: 'Cannot be photographed. Will not testify.',
    description: 'All face fringe, pulled forward. Plausibly deniable identity.',
    groomerBrief: 'Leave full face fringe forward over eyes and muzzle. Body kept at 1" for contrast.',
    referenceImage: 'witness-protection.jpg',
    coat: { bodyFluff: 0.6, headFluff: 1, earFluff: 0.95, silhouette: 'standard' },
  },
  {
    id: 'business-casual',
    name: 'Business Casual',
    category: 'groomer-real',
    pro: false,
    blurb: 'The Zoom-from-the-shoulders cut.',
    description: 'Tidy face and ears, slightly longer body. The "I have things to do today" look.',
    groomerBrief: 'Face and ears scissored clean. Body 1" with #4F. Tidy feet. Sanitary trim.',
    referenceImage: 'business-casual.jpg',
    coat: { bodyFluff: 0.6, headFluff: 0.7, earFluff: 0.6, silhouette: 'standard' },
  },
  {
    id: 'autumn-drop',
    name: 'Pumpkin Spice',
    category: 'seasonal',
    pro: true,
    blurb: 'Limited time. Like the latte.',
    description: 'Warmer copper undertone, leaf-pile volume. Drops every September.',
    groomerBrief: 'Same as breed-default cut, plus a pet-safe rinse to warm the coat tone.',
    referenceImage: 'autumn-drop.jpg',
    coat: { bodyFluff: 0.9, headFluff: 0.95, earFluff: 0.9, silhouette: 'standard', tone: '#C97B3F' },
  },
  {
    id: 'winter-fluff',
    name: 'Winter Fluff',
    category: 'seasonal',
    pro: true,
    blurb: 'Built different. Built warmer.',
    description: 'Maximum length retained. The pre-cut. For January only.',
    groomerBrief: 'Bath, blow-out, deshed. NO length removed. Tidy paws and sanitary only.',
    referenceImage: 'winter-fluff.jpg',
    coat: { bodyFluff: 1, headFluff: 1, earFluff: 1, silhouette: 'standard' },
  },
  {
    id: 'designer-paloma',
    name: 'Paloma × Coif',
    category: 'designer',
    pro: true,
    blurb: 'Designer drop. Unhinged. On purpose.',
    description: 'Asymmetric ear lengths, single dyed paw. Not for the dog who plays by rules.',
    groomerBrief: 'Asymmetric ears (2:1 ratio). Single front paw dyed slate blue, pet-safe. Body 3/4".',
    referenceImage: 'designer-paloma.jpg',
    coat: { bodyFluff: 0.7, headFluff: 0.85, earFluff: 1, silhouette: 'standard', accent: '#5E7A8C' },
  },
  {
    id: 'designer-emil',
    name: 'Emil × Coif',
    category: 'designer',
    pro: true,
    blurb: 'Brutalist. Geometric. Quietly furious.',
    description: 'Exaggerated boxy silhouette. Sharp 90-degree edges everywhere. The dog is now architecture.',
    groomerBrief: 'Square scissored silhouette. 90deg corners at chest, hip, and head. Lock the line. No softening.',
    referenceImage: 'designer-emil.jpg',
    coat: { bodyFluff: 0.75, headFluff: 0.85, earFluff: 0.7, silhouette: 'standard' },
  },
  {
    id: 'rugrat',
    name: 'Rugrat',
    category: 'fun',
    pro: true,
    blurb: 'Floor mop. Cherished.',
    description: 'Length to the floor, parted down the spine. Looks like an heirloom rug.',
    groomerBrief: 'Maximum coat retention. Brush out only. Center part along spine. Hair pulled into top knot to clear eyes.',
    referenceImage: 'rugrat.jpg',
    coat: { bodyFluff: 1, headFluff: 1, earFluff: 1, silhouette: 'topknot' },
  },
  {
    id: 'astroturf',
    name: 'Astroturf',
    category: 'fun',
    pro: true,
    blurb: 'Shocking. Electric. Slightly green.',
    description: 'Vivid pet-safe green tipping. The dog is a putting green now.',
    groomerBrief: 'Pet-safe green tipping (Opawz / similar). Even saturation across body. Leave face natural.',
    referenceImage: 'astroturf.jpg',
    coat: { bodyFluff: 0.7, headFluff: 0.7, earFluff: 0.7, silhouette: 'standard', accent: '#9FCB6B' },
  },
  {
    id: 'sad-prince',
    name: 'Sad Prince',
    category: 'fun',
    pro: true,
    blurb: 'Inherited the kingdom. Hates it.',
    description: 'Long, mournful ear feathering. Slightly windswept body. Permanent main-character melancholy.',
    groomerBrief: 'Maximum ear length scissored to a point. Body 1.5" with vertical scissor sweep front-to-back.',
    referenceImage: 'sad-prince.jpg',
    coat: { bodyFluff: 0.85, headFluff: 1, earFluff: 1, silhouette: 'standard' },
  },
  {
    id: 'bouncer',
    name: 'Bouncer',
    category: 'fun',
    pro: true,
    blurb: 'You are not on the list.',
    description: 'Squared shoulders, tight body, intimidating brow fringe. The dog now works the door.',
    groomerBrief: 'Square shoulder line, tight #4F body. Heavy brow fringe left forward. Clean muzzle.',
    referenceImage: 'bouncer.jpg',
    coat: { bodyFluff: 0.55, headFluff: 0.95, earFluff: 0.55, silhouette: 'standard' },
  },
  {
    id: 'spring-bloom',
    name: 'Spring Bloom',
    category: 'seasonal',
    pro: true,
    blurb: 'Allergy season survivor.',
    description: 'A clean rebirth. Even, light body, soft pastel accent on ears.',
    groomerBrief: 'Body 1/2", pet-safe pastel pink rinse on ear tips only. Brighten and deshed.',
    referenceImage: 'spring-bloom.jpg',
    coat: { bodyFluff: 0.6, headFluff: 0.7, earFluff: 0.7, silhouette: 'standard', accent: '#F2B8C6' },
  },
  {
    id: 'father-figure',
    name: 'Father Figure',
    category: 'fun',
    pro: true,
    blurb: "He's tired. He's proud. He's grilling.",
    description: 'Dignified gray scattered through the muzzle. Slightly relaxed silhouette. Conveys gravitas.',
    groomerBrief: 'Pet-safe silver highlight on muzzle. Body left at 1.5", relaxed line. No styling on top of head.',
    referenceImage: 'father-figure.jpg',
    coat: { bodyFluff: 0.85, headFluff: 0.85, earFluff: 0.8, silhouette: 'standard', tone: '#A99B86' },
  },
  {
    id: 'silent-film',
    name: 'Silent Film',
    category: 'fun',
    pro: true,
    blurb: 'Cannot speak. Says everything.',
    description: 'High-contrast black and white. Dramatic. Era-appropriate.',
    groomerBrief: 'Bath with brightening shampoo to amplify natural contrast in the coat. No styling beyond breed default.',
    referenceImage: 'silent-film.jpg',
    coat: { bodyFluff: 0.8, headFluff: 0.9, earFluff: 0.85, silhouette: 'standard', saturate: 0 },
  },
]

export const STYLES_BY_ID: Record<string, Style> = Object.fromEntries(
  STYLES.map(s => [s.id, s]),
)
