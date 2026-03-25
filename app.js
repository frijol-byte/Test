import { FACTIONS, SYSTEMS, ANOMALIES } from './data.js';

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