import { parseListText } from '../src/utils/listParser';
import { findBestFuzzyMatch } from '../src/shared/utils/fuzzyMatch';

const testCases = [
    "1 gallon 2% milk",
    "2 dozen large eggs",
    "3 lb boneless skinless chicken breast",
    "2 lb ground beef 80/20",
    "1 loaf white bread (store brand)",
    "2 bags shredded cheddar cheese (8 oz each)",
    "1 large box Cheerios (18 oz)",
    "2 pints Blueberries",
    "3 Romaine Lettuce hearts",
    "2 cans soup",
    "1 carton eggs",
    "1/2 pint cream",
    "1 pkg strawberries"
];

const mockCandidates = [
    { name: "Whole Milk" },
    { name: "Eggs" },
    { name: "Chicken Breast" },
    { name: "Ground Beef" },
    { name: "White Bread" },
    { name: "Cheddar Cheese" },
    { name: "Cheerios" },
    { name: "Blueberries" },
    { name: "Romaine Lettuce" },
    { name: "Soup" },
    { name: "Cream" },
    { name: "Strawberries" }
];

console.log("Testing List Parser & Fuzzy Match...");

testCases.forEach(text => {
    const result = parseListText(text);
    if (result.length > 0) {
        const item = result[0];
        console.log(`\nInput: "${text}"`);
        console.log(`Parsed Name: "${item.itemName}"`);

        // Simulate PasteListModal behavior: map to strings
        const candidateStrings = mockCandidates.map(c => c.name);
        // PasteListModal passes 0.7 as threshold to Fuse (which is loose), but requires 0.7 similarity (strict)
        // Note: findBestFuzzyMatch uses threshold param for Fuse threshold.
        const match = findBestFuzzyMatch(item.itemName, candidateStrings, 0.7);

        if (match) {
            console.log(`MATCH: "${match.match}" (Similarity: ${match.similarity.toFixed(2)})`);
            if (match.similarity < 0.7) {
                console.log("  -> Would be rejected by PasteListModal (requires >= 0.7)");
            }
        } else {
            console.log("NO MATCH (Fuse returned nothing)");
        }
    } else {
        console.log(`\nInput: "${text}" -> Failed to parse`);
    }
});
