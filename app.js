import { FACTIONS, SYSTEMS, ANOMALIES } from './data.js';

// Add to the top of app.js
const POSITIONS = ["Speaker", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

export function createDraftPool(config) {
    const { numPlayers, maxComplexity, expansions } = config;

    // 1. Faction Pool (usually numPlayers + 2 or 3 for choice)
    const factionPool = shuffle(
        FACTIONS.filter(f => expansions.includes(f.expansion) && f.complexity <= maxComplexity)
    ).slice(0, numPlayers + 3);

    // 2. Slice Pool (generating individual balanced slices)
    let slicePool = [];
    while (slicePool.length < numPlayers + 1) {
        const result = generateGalaxy({ ...config, numPlayers: 1 });
        if (result) slicePool.push(result[0]);
    }

    // 3. Position Pool
    const positionPool = POSITIONS.slice(0, numPlayers);

    // 4. Draft Order (Randomized list of Player 1, Player 2, etc.)
    const playerNumbers = Array.from({length: numPlayers}, (_, i) => i + 1);
    const draftOrder = shuffle(playerNumbers);

    return { 
        factions: factionPool, 
        slices: slicePool, 
        positions: positionPool,
        draftOrder: draftOrder 
    };
}

/**
 * Creates a shared pool for a Milty-style draft
 */
export function createDraftPool(config) {
    const { numPlayers, numFactionsInPool, numSlicesInPool, maxComplexity, expansions } = config;

    // 1. Get Faction Pool
    const eligibleFactions = FACTIONS.filter(f => 
        expansions.includes(f.expansion) && 
        f.complexity <= maxComplexity
    );
    const factionPool = shuffle(eligibleFactions).slice(0, numFactionsInPool);

    // 2. Get Slice Pool (using your existing galaxy logic)
    // We generate more slices than players so there are choices left for the last person
    let slicePool = [];
    let attempts = 0;
    while (slicePool.length < numSlicesInPool && attempts < 20000) {
        const potentialGalaxy = generateGalaxy({ ...config, numPlayers: 1 }); // Generate 1 slice at a time
        if (potentialGalaxy) {
            slicePool.push(potentialGalaxy[0]);
        }
        attempts++;
    }

    return { factions: factionPool, slices: slicePool };
}

/**
 * Utility to shuffle an array (Fisher-Yates algorithm)
 */
function shuffle(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * Faction Selection Logic
 */
export function pickFactions(config) {
    const { numPlayers, maxComplexity, expansions } = config;

    const eligible = FACTIONS.filter(f => 
        expansions.includes(f.expansion) && 
        f.complexity <= maxComplexity
    );

    if (eligible.length < numPlayers) {
        throw new Error(`Not enough factions (${eligible.length}) for ${numPlayers} players.`);
    }

    return shuffle(eligible).slice(0, numPlayers);
}

/**
 * Galaxy Generation Logic
 */
export function generateGalaxy(config) {
    const { numPlayers, minRes, maxRes, minInf, maxInf } = config;
    const bluePerSlice = 3;
    const redPerSlice = 2;

    let attempts = 0;
    const maxAttempts = 10000;

    while (attempts < maxAttempts) {
        const shuffledBlue = shuffle(SYSTEMS);
        const shuffledRed = shuffle(ANOMALIES);
        const slices = [];
        let allSlicesValid = true;

        for (let i = 0; i < numPlayers; i++) {
            const playerBlue = shuffledBlue.slice(i * bluePerSlice, (i + 1) * bluePerSlice);
            const playerRed = shuffledRed.slice(i * redPerSlice, (i + 1) * redPerSlice);
            const combined = [...playerBlue, ...playerRed];

            // Calculate Stats
            const stats = combined.reduce((acc, sys) => {
                if (sys.planets) {
                    sys.planets.forEach(p => {
                        acc.res += p.res;
                        acc.inf += p.inf;
                    });
                }
                return acc;
            }, { res: 0, inf: 0 });

            // Balance Check
            if (stats.res < minRes || stats.res > maxRes || stats.inf < minInf || stats.inf > maxInf) {
                allSlicesValid = false;
                break;
            }

            slices.push({ player: i + 1, tiles: combined, stats });
        }

        if (allSlicesValid) return slices;
        attempts++;
    }

    return null; // Failed to find a balance
}
