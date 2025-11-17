// treasure.js - D&D 5e Treasure Generation

// Treasure tables by CR
const coinsByChallenge = {
  0: { cp: [0, 100], sp: [0, 10], ep: [0, 5], gp: [0, 1], pp: [0, 0] },
  1: { cp: [0, 200], sp: [0, 50], ep: [0, 10], gp: [0, 10], pp: [0, 1] },
  2: { cp: [0, 500], sp: [0, 100], ep: [0, 50], gp: [0, 50], pp: [0, 5] },
  5: { cp: [0, 1000], sp: [100, 500], ep: [10, 100], gp: [10, 100], pp: [0, 10] },
  10: { cp: [0, 0], sp: [0, 500], ep: [0, 200], gp: [100, 1000], pp: [10, 100] },
  15: { cp: [0, 0], sp: [0, 0], ep: [0, 500], gp: [500, 5000], pp: [50, 500] },
  20: { cp: [0, 0], sp: [0, 0], ep: [0, 0], gp: [1000, 10000], pp: [100, 1000] }
};

const gemstones = {
  10: ['Azurite', 'Banded agate', 'Blue quartz', 'Eye agate', 'Hematite', 'Lapis lazuli', 'Malachite', 'Moss agate', 'Obsidian', 'Rhodochrosite', 'Tiger eye', 'Turquoise'],
  50: ['Bloodstone', 'Carnelian', 'Chalcedony', 'Chrysoprase', 'Citrine', 'Jasper', 'Moonstone', 'Onyx', 'Quartz', 'Sardonyx', 'Star rose quartz', 'Zircon'],
  100: ['Amber', 'Amethyst', 'Chrysoberyl', 'Coral', 'Garnet', 'Jade', 'Jet', 'Pearl', 'Spinel', 'Tourmaline'],
  500: ['Alexandrite', 'Aquamarine', 'Black pearl', 'Blue spinel', 'Peridot', 'Topaz'],
  1000: ['Black opal', 'Blue sapphire', 'Emerald', 'Fire opal', 'Opal', 'Star ruby', 'Star sapphire', 'Yellow sapphire'],
  5000: ['Black sapphire', 'Diamond', 'Jacinth', 'Ruby']
};

const artObjects = {
  25: ['Silver ewer', 'Carved bone statuette', 'Small gold bracelet', 'Cloth-of-gold vestments'],
  250: ['Gold ring set with bloodstones', 'Carved ivory statuette', 'Large gold bracelet', 'Silver necklace with a gemstone pendant'],
  750: ['Silver chalice with moonstones', 'Silver-plated sword with jet set in hilt', 'Carved harp of exotic wood with ivory inlay', 'Small gold idol'],
  2500: ['Gold dragon comb with red garnet eyes', 'Jeweled gold crown', 'Jeweled platinum ring', 'Gold music box'],
  7500: ['Jeweled gold crown', 'Jeweled platinum ring', 'Small gold idol', 'Gold dragon comb with red garnet eyes']
};

const magicItemsByRarity = {
  common: ['Potion of Healing', 'Spell Scroll (cantrip)', 'Potion of Climbing', 'Potion of Animal Friendship'],
  uncommon: ['Bag of Holding', 'Potion of Greater Healing', '+1 Weapon', 'Boots of Elvenkind', 'Cloak of Protection', 'Spell Scroll (1st level)', 'Wand of Magic Missiles'],
  rare: ['+2 Weapon', 'Flame Tongue', 'Potion of Superior Healing', 'Ring of Spell Storing', 'Wand of Fireballs', 'Boots of Speed', 'Bracers of Defense'],
  veryRare: ['+3 Weapon', 'Belt of Giant Strength (Fire)', 'Cloak of Invisibility', 'Manual of Bodily Health', 'Ring of Regeneration', 'Spell Scroll (6th level)'],
  legendary: ['Vorpal Sword', 'Ring of Three Wishes', 'Staff of the Magi', 'Holy Avenger', 'Luck Blade', 'Sphere of Annihilation']
};

function rollDice(count, sides) {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}

function randomRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function generateTreasure(challengeRating = 5, includeCoins = true, includeGems = true, includeArt = true, includeMagic = true) {
  const treasure = {
    coins: {},
    gems: [],
    artObjects: [],
    magicItems: [],
    totalValue: 0
  };

  // Find closest CR tier
  const crTiers = [0, 1, 2, 5, 10, 15, 20];
  const cr = crTiers.reduce((prev, curr) =>
    Math.abs(curr - challengeRating) < Math.abs(prev - challengeRating) ? curr : prev
  );

  // Generate coins
  if (includeCoins) {
    const coinTable = coinsByChallenge[cr];
    Object.keys(coinTable).forEach(coinType => {
      const [min, max] = coinTable[coinType];
      if (max > 0) {
        const amount = randomRange(min, max);
        if (amount > 0) {
          treasure.coins[coinType] = amount;
          // Calculate value in GP
          const values = { cp: 0.01, sp: 0.1, ep: 0.5, gp: 1, pp: 10 };
          treasure.totalValue += amount * values[coinType];
        }
      }
    });
  }

  // Generate gems
  if (includeGems && cr >= 2) {
    const gemCount = cr >= 10 ? rollDice(2, 4) : rollDice(1, 4);
    const gemValues = cr >= 15 ? [500, 1000, 5000] : cr >= 10 ? [100, 500, 1000] : [10, 50, 100];

    for (let i = 0; i < gemCount; i++) {
      const value = randomElement(gemValues);
      const gem = randomElement(gemstones[value]);
      treasure.gems.push({ name: gem, value });
      treasure.totalValue += value;
    }
  }

  // Generate art objects
  if (includeArt && cr >= 5) {
    const artCount = cr >= 15 ? rollDice(1, 6) : cr >= 10 ? rollDice(1, 4) : rollDice(1, 3);
    const artValues = cr >= 15 ? [750, 2500, 7500] : cr >= 10 ? [250, 750, 2500] : [25, 250];

    for (let i = 0; i < artCount; i++) {
      const value = randomElement(artValues);
      const art = randomElement(artObjects[value]);
      treasure.artObjects.push({ name: art, value });
      treasure.totalValue += value;
    }
  }

  // Generate magic items
  if (includeMagic && cr >= 5) {
    let rarity;
    if (cr >= 20) rarity = 'legendary';
    else if (cr >= 15) rarity = 'veryRare';
    else if (cr >= 10) rarity = 'rare';
    else if (cr >= 5) rarity = 'uncommon';
    else rarity = 'common';

    const itemCount = cr >= 15 ? rollDice(1, 4) : cr >= 10 ? rollDice(1, 3) : 1;

    for (let i = 0; i < itemCount; i++) {
      const item = randomElement(magicItemsByRarity[rarity]);
      treasure.magicItems.push({ name: item, rarity });
    }
  }

  return treasure;
}

export function formatTreasure(treasure) {
  let text = '💰 **Treasure Hoard**\n\n';

  if (Object.keys(treasure.coins).length > 0) {
    text += '**Coins:**\n';
    Object.entries(treasure.coins).forEach(([type, amount]) => {
      text += `- ${amount} ${type.toUpperCase()}\n`;
    });
    text += '\n';
  }

  if (treasure.gems.length > 0) {
    text += '**Gemstones:**\n';
    treasure.gems.forEach(gem => {
      text += `- ${gem.name} (${gem.value} gp)\n`;
    });
    text += '\n';
  }

  if (treasure.artObjects.length > 0) {
    text += '**Art Objects:**\n';
    treasure.artObjects.forEach(art => {
      text += `- ${art.name} (${art.value} gp)\n`;
    });
    text += '\n';
  }

  if (treasure.magicItems.length > 0) {
    text += '**Magic Items:**\n';
    treasure.magicItems.forEach(item => {
      text += `- ${item.name} (${item.rarity})\n`;
    });
    text += '\n';
  }

  text += `**Total Value:** ~${Math.round(treasure.totalValue)} gp`;

  return text;
}
