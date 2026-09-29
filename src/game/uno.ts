import { UnoCard, UnoCardType, UnoColor } from "@/types/game";

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
    recoveryAmount: 0,
  };
}

function createSpecialCard(
  color: UnoColor,
  type: UnoCardType,
  copy: number,
): UnoCard {
  let recoveryAmount = 0;

  if (type === "draw2") {
    recoveryAmount = 2;
  }

  if (type === "wildDraw4") {
    recoveryAmount = 4;
  }

  return {
    id: `${color}-${type}-${copy}`,
    color,
    type,
    value: null,
    recoveryAmount,
  };
}

export function createUnoDeck(): UnoCard[] {
  const deck: UnoCard[] = [];

  /*
   * CARTAS NUMÉRICAS
   *
   * Cada cor:
   *
   * 1x zero
   * 2x 1–9
   */
  for (const color of UNO_COLORS) {
    deck.push(createNumberCard(color, 0, 0));

    for (let value = 1; value <= 9; value += 1) {
      deck.push(createNumberCard(color, value, 1));

      deck.push(createNumberCard(color, value, 2));
    }
  }

  /*
   * CARTAS ESPECIAIS
   *
   * Cada cor:
   *
   * 2 Skip
   * 2 Reverse
   * 2 +2
   */
  for (const color of UNO_COLORS) {
    for (let copy = 1; copy <= 2; copy += 1) {
      deck.push(createSpecialCard(color, "skip", copy));

      deck.push(createSpecialCard(color, "reverse", copy));

      deck.push(createSpecialCard(color, "draw2", copy));
    }
  }

  /*
   * +4
   *
   * 4 cartas universais.
   */
  for (let copy = 1; copy <= 4; copy += 1) {
    deck.push({
      id: `wildDraw4-${copy}`,
      color: null,
      type: "wildDraw4",
      value: null,
      recoveryAmount: 4,
    });
  }

  /*
   * TROCA DE COR
   *
   * 4 cartas universais.
   *
   * No UNO CHESS ela permite trocar uma peça própria
   * com a peça inimiga não-Rei mais avançada
   * que esteja dentro da visão do jogador.
   */
  for (let copy = 1; copy <= 4; copy += 1) {
    deck.push({
      id: `colorSwap-${copy}`,
      color: null,
      type: "colorSwap",
      value: null,
      recoveryAmount: 0,
    });
  }

  return shuffleDeck(deck);
}

export function shuffleDeck(deck: UnoCard[]): UnoCard[] {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
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
