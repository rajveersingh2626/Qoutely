import { searchOccupanciesRAG, matchDistrictEQZone } from '../src/lib/rag';

console.log("=== EQ ZONE MATCHING TEST ===");
console.log("1. 'New Delhi 110044':", matchDistrictEQZone("New Delhi 110044"));
console.log("2. '110044':", matchDistrictEQZone("110044"));
console.log("3. 'Gurgaon, Haryana':", matchDistrictEQZone("Gurgaon, Haryana"));
console.log("4. 'Mumbai, Maharashtra':", matchDistrictEQZone("Mumbai, Maharashtra"));
console.log("5. 'Bengaluru 560001':", matchDistrictEQZone("Bengaluru 560001"));
console.log("6. 'Kutch, Gujarat':", matchDistrictEQZone("Kutch, Gujarat"));

console.log("\n=== RAG OCCUPANCY SEARCH TEST ===");
console.log("A. 'Trading and storage of food products, almond oil, cosmetic products':", searchOccupanciesRAG("Trading and storage of food products, almond oil, cosmetic products").primaryCandidate);
console.log("B. 'Retail shop dealing in readymade garments and clothes':", searchOccupanciesRAG("Retail shop dealing in readymade garments and clothes").primaryCandidate);
console.log("C. 'Automobile spare parts manufacturing and CNC workshop':", searchOccupanciesRAG("Automobile spare parts manufacturing and CNC workshop").primaryCandidate);
