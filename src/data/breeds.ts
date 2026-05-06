export type Breed = {
  id: string
  name: string
  coatHint: string
  defaultStyleId: string
  /**
   * Auto-pick is the highest-wow style for this breed shown on first run.
   * Per the design doc this is later tuned by install-to-paid conversion.
   */
  autoPickStyleId: string
}

export const BREEDS: Breed[] = [
  {
    id: 'goldendoodle',
    name: 'Goldendoodle',
    coatHint: 'curly, high-maintenance',
    defaultStyleId: 'teddy-bear',
    autoPickStyleId: 'lion-cut',
  },
  {
    id: 'standard-poodle',
    name: 'Standard Poodle',
    coatHint: 'curly, sculptable',
    defaultStyleId: 'continental',
    autoPickStyleId: 'continental',
  },
  {
    id: 'cocker-spaniel',
    name: 'Cocker Spaniel',
    coatHint: 'silky, feathered',
    defaultStyleId: 'puppy-cut',
    autoPickStyleId: 'lion-cut',
  },
  {
    id: 'shih-tzu',
    name: 'Shih Tzu',
    coatHint: 'flowing double coat',
    defaultStyleId: 'puppy-cut',
    autoPickStyleId: 'mohawk',
  },
  {
    id: 'yorkie',
    name: 'Yorkshire Terrier',
    coatHint: 'long silk coat',
    defaultStyleId: 'puppy-cut',
    autoPickStyleId: 'mohawk',
  },
  {
    id: 'bichon',
    name: 'Bichon Frise',
    coatHint: 'cottony double coat',
    defaultStyleId: 'powder-puff',
    autoPickStyleId: 'lion-cut',
  },
  {
    id: 'mini-schnauzer',
    name: 'Mini Schnauzer',
    coatHint: 'wiry double coat',
    defaultStyleId: 'kennel-cut',
    autoPickStyleId: 'mohawk',
  },
  {
    id: 'mixed',
    name: "I'm not sure (mixed)",
    coatHint: 'mystery coat',
    defaultStyleId: 'teddy-bear',
    autoPickStyleId: 'lion-cut',
  },
]
