// content-generator.js - D&D Room Content Generator
// Generates rich room descriptions combining data from content tables and treasure system

import { atmosphereByTheme, roomDressing, traps, monstersByCR, roomAdjectives, containerTypes } from './content-tables.js';
import { generateTreasure } from './treasure.js';

// Helper function - picks random element from array
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function - rolls dice
function rollDice(count, sides) {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}

// Maps dungeon level to Challenge Rating
function getCRForDungeonLevel(level) {
  const crMap = {
    1: 0.5,
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 5,
    7: 6,
    8: 7,
    9: 8,
    10: 9
  };
  return crMap[level] || Math.max(0.5, level - 0.5);
}

// Format treasure into compact string
function formatTreasureCompact(treasure) {
  const parts = [];

  // Format coins
  const coinParts = [];
  if (treasure.coins.pp > 0) coinParts.push(`${treasure.coins.pp}pp`);
  if (treasure.coins.gp > 0) coinParts.push(`${treasure.coins.gp}gp`);
  if (treasure.coins.ep > 0) coinParts.push(`${treasure.coins.ep}ep`);
  if (treasure.coins.sp > 0) coinParts.push(`${treasure.coins.sp}sp`);
  if (treasure.coins.cp > 0) coinParts.push(`${treasure.coins.cp}cp`);
  if (coinParts.length > 0) parts.push(coinParts.join(', '));

  // Format gems (compact)
  if (treasure.gems.length > 0) {
    if (treasure.gems.length === 1) {
      parts.push(`${treasure.gems[0].name} (${treasure.gems[0].value}gp)`);
    } else {
      const totalGemValue = treasure.gems.reduce((sum, g) => sum + g.value, 0);
      parts.push(`${treasure.gems.length} gems (${totalGemValue}gp total)`);
    }
  }

  // Format art objects (compact)
  if (treasure.artObjects.length > 0) {
    if (treasure.artObjects.length === 1) {
      parts.push(`${treasure.artObjects[0].name} (${treasure.artObjects[0].value}gp)`);
    } else {
      const totalArtValue = treasure.artObjects.reduce((sum, a) => sum + a.value, 0);
      parts.push(`${treasure.artObjects.length} art objects (${totalArtValue}gp total)`);
    }
  }

  // Format magic items
  if (treasure.magicItems.length > 0) {
    treasure.magicItems.forEach(item => {
      parts.push(item.name);
    });
  }

  return parts.join(', ');
}

// Generate entrance room content
function generateEntranceContent(theme) {
  const entrances = [
    'Heavy iron doors stand ajar',
    'A crumbling archway marks the entrance',
    'Stairs descend into darkness',
    'A narrow passage opens here',
    'Ancient stone doors bear worn carvings'
  ];

  let content = randomElement(entrances) + '.';

  // 30% chance of guards
  if (Math.random() < 0.3) {
    const guards = monstersByCR[0.25] || monstersByCR[0.5] || [];
    if (guards.length > 0) {
      const guard = randomElement(guards);
      const count = rollDice(1, 2);
      content += ` ${count} ${guard.name}${count > 1 ? 's' : ''} (AC ${guard.ac}, HP ${guard.hp}, ${guard.attack}) stand watch.`;
    }
  }

  return content;
}

// Generate treasure room content
function generateTreasureRoomContent(dungeonLevel) {
  const cr = getCRForDungeonLevel(dungeonLevel);
  const treasure = generateTreasure(cr, true, true, true, true);
  const container = randomElement(containerTypes);

  let content = `${container} contains `;
  content += formatTreasureCompact(treasure) + '.';

  // 40% chance of trap protecting treasure
  if (Math.random() < 0.4) {
    const trap = randomElement(traps);
    content += ` Trapped (DC ${trap.dc} to detect, ${trap.damage} damage).`;
  }

  return content;
}

// Generate trap room content
function generateTrapRoomContent() {
  const trap = randomElement(traps);
  const triggers = [
    'A pressure plate',
    'A tripwire',
    'A false floor section',
    'A trapped door handle',
    'Hidden sensor runes'
  ];

  const trigger = randomElement(triggers);
  return `${trigger} triggers ${trap.name.toLowerCase()} (DC ${trap.dc} to spot/disarm, ${trap.damage} damage).`;
}

// Generate boss room content
function generateBossRoomContent(dungeonLevel, theme) {
  const cr = getCRForDungeonLevel(dungeonLevel) + 2; // Boss is higher CR
  const monsters = monstersByCR[cr] || monstersByCR[Math.floor(cr)] || [];

  let content = '';

  if (monsters.length > 0) {
    const boss = randomElement(monsters);
    content = `${boss.name} (AC ${boss.ac}, HP ${boss.hp}, ${boss.attack}) lairs here.`;
  } else {
    content = 'A powerful creature lairs here.';
  }

  // Boss always has special treasure
  const treasure = generateTreasure(cr + 2, true, true, true, true);
  const treasureStr = formatTreasureCompact(treasure);
  if (treasureStr) {
    content += ` Treasure: ${treasureStr}.`;
  }

  return content;
}

// Generate normal room content
function generateNormalRoomContent(dungeonLevel, theme) {
  const parts = [];

  // Add room dressing
  if (roomDressing && roomDressing.normal && roomDressing.normal.length > 0) {
    parts.push(randomElement(roomDressing.normal) + '.');
  }

  // 50% chance of encounter
  if (Math.random() < 0.5) {
    const cr = getCRForDungeonLevel(dungeonLevel);
    const monsters = monstersByCR[cr] || monstersByCR[Math.floor(cr)] || [];
    if (monsters.length > 0) {
      const monster = randomElement(monsters);
      const count = rollDice(1, 3);
      parts.push(`${count} ${monster.name}${count > 1 ? 's' : ''} (AC ${monster.ac}, HP ${monster.hp}, ${monster.attack}).`);
    }
  }

  // 30% chance of treasure
  if (Math.random() < 0.3) {
    const cr = getCRForDungeonLevel(dungeonLevel);
    const treasure = generateTreasure(Math.max(0, cr - 1), true, false, false, false);
    const treasureStr = formatTreasureCompact(treasure);
    if (treasureStr) {
      parts.push(`Contains ${treasureStr}.`);
    }
  }

  return parts.join(' ');
}

// Main export function - generates complete room content
export function generateRoomContent(room, theme, dungeonLevel = 1) {
  // Calculate room size in feet (5ft per grid square)
  const widthFt = room.w * 5;
  const heightFt = room.h * 5;

  // Start with room dimensions
  let description = `A ${widthFt}x${heightFt}ft chamber.`;

  // Add atmosphere based on theme
  if (atmosphereByTheme && atmosphereByTheme[theme]) {
    const atmosphere = randomElement(atmosphereByTheme[theme]);
    description += ` ${atmosphere}.`;
  }

  // Generate content based on room type
  let roomContent = '';
  switch (room.type) {
    case 'entrance':
      roomContent = generateEntranceContent(theme);
      break;
    case 'treasure':
      roomContent = generateTreasureRoomContent(dungeonLevel);
      break;
    case 'trap':
      roomContent = generateTrapRoomContent();
      break;
    case 'boss':
      roomContent = generateBossRoomContent(dungeonLevel, theme);
      break;
    case 'normal':
    default:
      roomContent = generateNormalRoomContent(dungeonLevel, theme);
      break;
  }

  if (roomContent) {
    description += ' ' + roomContent;
  }

  return description;
}
