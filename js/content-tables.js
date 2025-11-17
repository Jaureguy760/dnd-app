/**
 * D&D Random Tables for Dungeon Room Content Generation
 * Comprehensive tables for atmospheric descriptions, room dressing, traps, monsters, and more.
 * Designed for auto-generating rich room descriptions in a one-page dungeon format.
 */

// Atmospheric descriptions organized by dungeon theme
export const atmosphereByTheme = {
    classic: [
        "The air smells of dust and ancient stone",
        "Cobwebs hang in thick sheets from the ceiling",
        "A faint breeze carries the scent of mildew",
        "Torch sconces line the walls, long since extinguished",
        "The sound of dripping water echoes in the distance",
        "Faded murals depict forgotten battles",
        "Cracks spider across the stone floor",
        "A musty odor permeates the chamber",
        "Shadows dance in the flickering torchlight",
        "Dust motes float lazily in the stale air",
        "The walls are damp with condensation",
        "Faint scratching sounds come from within the walls",
        "The ceiling is blackened with old soot",
        "Crumbling mortar reveals the stonework beneath",
        "A heavy silence presses against your ears",
        "Vermin have gnawed at the wooden fixtures",
        "Old bloodstains mar the flagstones",
        "The air tastes stale and metallic",
        "Lichen grows in patches along the walls",
        "Footprints in the dust suggest recent passage",
        "The stone floor is worn smooth by countless feet",
        "Rusted iron fixtures hang askew"
    ],
    undead: [
        "The stench of decay fills the air",
        "Skeletal remains are scattered across the floor",
        "A deathly chill permeates the chamber",
        "Funerary urns line the walls on stone shelves",
        "The walls are carved with necromantic symbols",
        "Tomb dust coats every surface",
        "Grave soil has been tracked across the floor",
        "The sound of rattling bones echoes faintly",
        "Corpse candles flicker with an eerie green light",
        "Burial shrouds hang from rusty hooks",
        "The air carries the sweet smell of embalming herbs",
        "Coffins are stacked against the walls",
        "Ghostly whispers seem to come from nowhere",
        "Tattered funeral banners hang limply",
        "The floor is covered in scattered grave goods",
        "Ossuary decorations adorn the walls",
        "A palpable sense of dread hangs in the air",
        "Dried blood trails lead to empty sarcophagi",
        "Broken phylacteries litter the ground",
        "The temperature drops noticeably",
        "Shadows seem to move of their own accord",
        "An unnatural silence muffles all sound"
    ],
    cavern: [
        "Water drips steadily from stalactites above",
        "The cave walls glisten with moisture",
        "Bioluminescent fungi cast an eerie glow",
        "The smell of wet earth fills your nostrils",
        "Stalagmites rise from the floor like stone teeth",
        "Underground streams trickle through crevices",
        "Bat guano coats patches of the floor",
        "Crystal formations catch the light",
        "The sound of rushing water echoes from below",
        "Cave moss grows in thick patches",
        "Natural columns of stone support the ceiling",
        "The air is cool and humid",
        "Mineral deposits streak the walls with color",
        "The passage narrows into natural stone",
        "Underground winds create an eerie whistling",
        "Flowstone formations cascade down the walls",
        "The cave opens into a vast natural chamber",
        "Fossilized creatures are embedded in the rock",
        "Pools of still water reflect the darkness",
        "The stone has been carved by eons of water",
        "Crawling insects scatter from the light",
        "The walls are marked by ancient water levels"
    ],
    arcane: [
        "Magical runes pulse with faint light",
        "The air crackles with residual energy",
        "Arcane symbols are etched into every surface",
        "A low hum of magical power vibrates through the floor",
        "Spectral lights drift near the ceiling",
        "The smell of ozone hangs heavy in the air",
        "Crystalline structures resonate with magic",
        "Mystical diagrams cover the floor",
        "The walls shimmer with enchantment",
        "Floating orbs of light provide illumination",
        "Ancient spellbooks lie open on lecterns",
        "The temperature fluctuates unnaturally",
        "Reality seems slightly distorted here",
        "Magical residue coats surfaces like dust",
        "Enchanted mirrors line the walls",
        "The air tastes of copper and lightning",
        "Glowing script writes itself across the walls",
        "Time seems to move differently here",
        "Arcane apparatus fills the chamber",
        "The fabric of reality appears thin",
        "Elemental energy swirls in contained forms",
        "Wards and protective glyphs bar certain passages"
    ]
};

// Room dressing items organized by room type
export const roomDressing = {
    entrance: [
        "iron torch brackets mounted on either side",
        "heavy stone door with iron reinforcements",
        "warning inscriptions carved in ancient script",
        "murder holes in the ceiling above",
        "a portcullis mechanism with rusted chains",
        "arrow slits in the flanking walls",
        "a guardian statue with glowing gem eyes",
        "worn threshold showing centuries of passage",
        "discarded equipment from previous explorers",
        "a broken barricade of furniture",
        "defensive spikes embedded in the floor",
        "a welcome mat woven from humanoid hair",
        "graffiti warnings left by other adventurers"
    ],
    treasure: [
        "gilded display cases with broken glass",
        "empty weapon racks along the walls",
        "a large stone vault door slightly ajar",
        "scattered coins and gems on the floor",
        "a pedestal where something precious once rested",
        "complex lock mechanisms on iron chests",
        "wall safes hidden behind false panels",
        "trophy mounts for monster heads",
        "velvet-lined jewelry boxes, mostly empty",
        "a counting table with ancient ledgers",
        "guard alcoves on either side of the entrance",
        "magical detection runes around valuable items",
        "secret compartments revealed by triggered traps"
    ],
    boss: [
        "an ornate throne on a raised dais",
        "trophy skulls of defeated foes mounted on pikes",
        "war banners bearing a fearsome sigil",
        "a strategic map table with figurines",
        "personal quarters separated by heavy curtains",
        "weapon racks displaying prized armaments",
        "chains and shackles for prisoners",
        "a ritual circle for dark ceremonies",
        "tribute piles from subjugated creatures",
        "bone furniture crafted from victims",
        "a commanding view of approaches",
        "escape tunnel hidden behind the throne",
        "intimidation displays of violence and power"
    ],
    trap: [
        "pressure plates barely visible in the floor",
        "suspicious holes in the walls at chest height",
        "a tripwire strung across the doorway",
        "ceiling panels that appear hinged",
        "floor tiles of a different material",
        "scorch marks suggesting previous activations",
        "remains of previous victims",
        "reset mechanisms poorly concealed",
        "warning signs in a language you don't recognize",
        "a conspicuously clean section of floor",
        "small drainage channels in the floor",
        "mechanical clicking sounds from the walls",
        "loose stones that might trigger something"
    ],
    normal: [
        "overturned furniture scattered about",
        "rotting wooden crates stacked haphazardly",
        "a cold fire pit with old ashes",
        "crude bedding made from straw and rags",
        "discarded food scraps attracting vermin",
        "broken pottery and shattered clay jugs",
        "tattered cloth hangings on the walls",
        "a makeshift table from planks and barrels",
        "old torch stubs littered about",
        "graffiti scratched into the walls",
        "a pile of bones in the corner",
        "rusted tools and equipment",
        "water stains on the walls and ceiling",
        "fungal growth in damp corners",
        "collapsed shelving units"
    ]
};

// Trap definitions with mechanical properties
export const traps = [
    {
        name: "Poison Dart Trap",
        trigger: "pressure plate",
        dc: 12,
        damage: "1d4 poison",
        save: "DEX"
    },
    {
        name: "Pit Trap",
        trigger: "weight on false floor",
        dc: 10,
        damage: "2d6 bludgeoning",
        save: "DEX"
    },
    {
        name: "Swinging Blade",
        trigger: "tripwire",
        dc: 14,
        damage: "2d8 slashing",
        save: "DEX"
    },
    {
        name: "Poison Gas Vent",
        trigger: "opening container",
        dc: 13,
        damage: "2d6 poison",
        save: "CON"
    },
    {
        name: "Falling Block",
        trigger: "pressure plate",
        dc: 11,
        damage: "3d6 bludgeoning",
        save: "DEX"
    },
    {
        name: "Fire Glyph",
        trigger: "stepping on glyph",
        dc: 15,
        damage: "3d6 fire",
        save: "DEX"
    },
    {
        name: "Spiked Pit",
        trigger: "weight on false floor",
        dc: 12,
        damage: "2d6 bludgeoning + 1d6 piercing",
        save: "DEX"
    },
    {
        name: "Crossbow Turret",
        trigger: "beam of light interrupted",
        dc: 13,
        damage: "2d6 piercing",
        save: "DEX"
    },
    {
        name: "Crushing Walls",
        trigger: "door closure",
        dc: 16,
        damage: "4d6 bludgeoning",
        save: "STR"
    },
    {
        name: "Sleep Gas",
        trigger: "opening door",
        dc: 14,
        damage: "unconscious 1 minute",
        save: "CON"
    },
    {
        name: "Lightning Rod",
        trigger: "touching metal object",
        dc: 14,
        damage: "2d8 lightning",
        save: "DEX"
    },
    {
        name: "Net Trap",
        trigger: "tripwire",
        dc: 10,
        damage: "restrained",
        save: "DEX"
    },
    {
        name: "Scything Blade",
        trigger: "opening chest",
        dc: 13,
        damage: "2d10 slashing",
        save: "DEX"
    },
    {
        name: "Acid Spray",
        trigger: "pressure plate",
        dc: 12,
        damage: "2d6 acid",
        save: "DEX"
    },
    {
        name: "Collapsing Ceiling",
        trigger: "removing key item",
        dc: 15,
        damage: "4d8 bludgeoning",
        save: "DEX"
    },
    {
        name: "Charm Rune",
        trigger: "reading inscription",
        dc: 14,
        damage: "charmed 1 hour",
        save: "WIS"
    },
    {
        name: "Freezing Jet",
        trigger: "opening container",
        dc: 13,
        damage: "2d6 cold",
        save: "CON"
    }
];

// Monsters organized by Challenge Rating (D&D 5e SRD)
export const monstersByCR = {
    0.25: [
        {
            name: "Goblin",
            ac: 15,
            hp: 7,
            attack: "+4 to hit",
            damage: "1d6+2 slashing",
            xp: 50
        },
        {
            name: "Kobold",
            ac: 12,
            hp: 5,
            attack: "+4 to hit",
            damage: "1d4+2 piercing",
            xp: 50
        },
        {
            name: "Skeleton",
            ac: 13,
            hp: 13,
            attack: "+4 to hit",
            damage: "1d6+2 piercing",
            xp: 50
        },
        {
            name: "Zombie",
            ac: 8,
            hp: 22,
            attack: "+3 to hit",
            damage: "1d6+1 bludgeoning",
            xp: 50
        }
    ],
    0.5: [
        {
            name: "Orc",
            ac: 13,
            hp: 15,
            attack: "+5 to hit",
            damage: "1d12+3 slashing",
            xp: 100
        },
        {
            name: "Hobgoblin",
            ac: 18,
            hp: 11,
            attack: "+3 to hit",
            damage: "1d8+1 slashing",
            xp: 100
        },
        {
            name: "Gnoll",
            ac: 15,
            hp: 22,
            attack: "+4 to hit",
            damage: "1d8+2 piercing",
            xp: 100
        },
        {
            name: "Shadow",
            ac: 12,
            hp: 16,
            attack: "+4 to hit",
            damage: "2d6+2 necrotic",
            xp: 100
        }
    ],
    1: [
        {
            name: "Bugbear",
            ac: 16,
            hp: 27,
            attack: "+4 to hit",
            damage: "2d8+2 piercing",
            xp: 200
        },
        {
            name: "Ghoul",
            ac: 12,
            hp: 22,
            attack: "+4 to hit",
            damage: "2d6+2 piercing",
            xp: 200
        },
        {
            name: "Specter",
            ac: 12,
            hp: 22,
            attack: "+4 to hit",
            damage: "3d6 necrotic",
            xp: 200
        },
        {
            name: "Giant Spider",
            ac: 14,
            hp: 26,
            attack: "+5 to hit",
            damage: "1d8+3 piercing + 2d8 poison",
            xp: 200
        },
        {
            name: "Dire Wolf",
            ac: 14,
            hp: 37,
            attack: "+5 to hit",
            damage: "2d6+3 piercing",
            xp: 200
        }
    ],
    2: [
        {
            name: "Ogre",
            ac: 11,
            hp: 59,
            attack: "+6 to hit",
            damage: "2d8+4 bludgeoning",
            xp: 450
        },
        {
            name: "Ghast",
            ac: 13,
            hp: 36,
            attack: "+5 to hit",
            damage: "2d8+3 piercing",
            xp: 450
        },
        {
            name: "Mimic",
            ac: 12,
            hp: 58,
            attack: "+5 to hit",
            damage: "1d8+3 bludgeoning + 1d8 acid",
            xp: 450
        },
        {
            name: "Gelatinous Cube",
            ac: 6,
            hp: 84,
            attack: "+4 to hit",
            damage: "3d6 acid",
            xp: 450
        }
    ],
    3: [
        {
            name: "Owlbear",
            ac: 13,
            hp: 59,
            attack: "+7 to hit",
            damage: "2d8+5 slashing",
            xp: 700
        },
        {
            name: "Minotaur",
            ac: 14,
            hp: 76,
            attack: "+6 to hit",
            damage: "2d12+4 slashing",
            xp: 700
        },
        {
            name: "Wight",
            ac: 14,
            hp: 45,
            attack: "+4 to hit",
            damage: "1d8+2 slashing + 1d6 necrotic",
            xp: 700
        },
        {
            name: "Phase Spider",
            ac: 13,
            hp: 32,
            attack: "+4 to hit",
            damage: "1d10+2 piercing + 4d8 poison",
            xp: 700
        }
    ],
    5: [
        {
            name: "Troll",
            ac: 15,
            hp: 84,
            attack: "+7 to hit",
            damage: "2d6+4 slashing",
            xp: 1800
        },
        {
            name: "Wraith",
            ac: 13,
            hp: 67,
            attack: "+6 to hit",
            damage: "4d8+3 necrotic",
            xp: 1800
        },
        {
            name: "Hill Giant",
            ac: 13,
            hp: 105,
            attack: "+8 to hit",
            damage: "3d8+5 bludgeoning",
            xp: 1800
        },
        {
            name: "Flesh Golem",
            ac: 9,
            hp: 93,
            attack: "+7 to hit",
            damage: "2d8+4 bludgeoning",
            xp: 1800
        }
    ]
};

// Adjectives to describe room conditions
export const roomAdjectives = [
    "ancient",
    "crumbling",
    "damp",
    "dusty",
    "bloodstained",
    "cobweb-filled",
    "shadowy",
    "musty",
    "decrepit",
    "forgotten",
    "haunted",
    "ransacked",
    "partially collapsed",
    "waterlogged",
    "scorched",
    "frost-covered",
    "vine-choked",
    "eerily silent",
    "foul-smelling",
    "dimly lit",
    "smoke-stained",
    "moss-covered",
    "unstable",
    "vermin-infested",
    "battle-scarred",
    "long-abandoned",
    "mysteriously warm",
    "bone-littered",
    "recently disturbed",
    "magically warded"
];

// Types of containers that might hold treasure
export const containerTypes = [
    "locked chest",
    "stone coffer",
    "hidden alcove",
    "rotted sack",
    "iron strongbox",
    "wooden crate",
    "burial urn",
    "leather pouch",
    "concealed compartment",
    "clay pot sealed with wax",
    "velvet bag",
    "ornate jewelry box",
    "hollowed book",
    "secret drawer",
    "trapped lockbox",
    "cursed reliquary",
    "magically sealed container",
    "ancient amphora",
    "monster's gullet",
    "false bottom barrel"
];
