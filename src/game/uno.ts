import { UnoCard, UnoColor } from "@/types/game";

const UNO_COLORS: UnoColor[] = ["red", "yellow", "green", "blue"];

function createNumberCard(
  color: UnoColor,
  value: number,
  copy: number,
): UnoCard {
  return {
    id: `${color}-${value}-${copy}`,
    color,
    type: "number",
    value,
  };
}

export function createUnoDeck(): UnoCard[] {
  const deck: UnoCard[] = [];

  for (const color of UNO_COLORS) {
    // Uma carta 0 de cada cor
    deck.push(createNumberCard(color, 0, 0));

    // Duas cartas de cada número 1-9
    for (let value = 1; value <= 9; value++) {
      deck.push(createNumberCard(color, value, 1));

      deck.push(createNumberCard(color, value, 2));
    }
  }

  return shuffleDeck(deck);
}

export function shuffleDeck(deck: UnoCard[]): UnoCard[] {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function drawUnoCard(deck: UnoCard[]): {
  card: UnoCard | null;
  remainingDeck: UnoCard[];
} {
  if (deck.length === 0) {
    return {
      card: null,
      remainingDeck: [],
    };
  }

  const [card, ...remainingDeck] = deck;

  return {
    card,
    remainingDeck,
  };
}
