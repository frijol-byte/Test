// app.js
import { FACTIONS, SYSTEMS, ANOMALIES } from './data.js';

// Logic to filter and pick factions
function getFactions(config) {
    const eligible = FACTIONS.filter(f => 
        config.expansions.includes(f.expansion) && 
        f.complexity <= config.maxComplexity
    );
    
    // Shuffle and pick
    return eligible.sort(() => 0.5 - Math.random()).slice(0, config.numPlayers);
}

// Logic to generate balanced slices
function generateSlices(config) {
    let attempts = 0;
    while (attempts < 5000) {
        let pool = [...SYSTEMS].sort(() => 0.5 - Math.random());
        let slices = [];
        let validGalaxy = true;

        for (let i = 0; i < config.numPlayers; i++) {
            let slice = pool.slice(i * 3, (i + 1) * 3);
            let resources = slice.reduce((sum, sys) => 
                sum + sys.planets.reduce((pSum, p) => pSum + p.res, 0), 0);
            
            // Validation check (similar to your Python "is_slice_balanced")
            if (resources < config.minRes || resources > config.maxRes) {
                validGalaxy = false;
                break;
            }
            slices.push(slice);
        }

        if (validGalaxy) return slices;
        attempts++;
    }
    return null; // Failed to balance
}