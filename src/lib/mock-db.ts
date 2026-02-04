// Simple in-memory database for local development
import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'mock_dynamo.json');
console.log("[MockDB] Database file path:", DB_FILE);

// Load DB from file if exists
let inMemoryDB: Map<string, any> = new Map();
try {
    if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        if (data.trim()) {
            inMemoryDB = new Map(JSON.parse(data));
            console.log(`[MockDB] Loaded ${inMemoryDB.size} items from disk.`);
        }
    } else {
        console.log("[MockDB] No existing mock_dynamo.json found, starting fresh.");
    }
} catch (e) {
    console.error("[MockDB] Failed to load mock_dynamo.json:", e);
    try { fs.renameSync(DB_FILE, `${DB_FILE}.bak`); } catch { }
}

function saveDB() {
    try {
        const data = JSON.stringify(Array.from(inMemoryDB.entries()), null, 2);
        fs.writeFileSync(DB_FILE, data);
        console.log(`[MockDB] Saved ${inMemoryDB.size} items to ${DB_FILE}`);
    } catch (e) {
        console.error("[MockDB] Failed to save mock_dynamo.json:", e);
    }
}

export const mockDB = {
    send: async (command: any) => {
        const commandName = command.constructor.name;
        console.log(`[MockDB] Executing ${commandName}`);

        // Handle PutCommand
        if (commandName === 'PutCommand') {
            const key = `${command.input.Item.PK}#${command.input.Item.SK}`;
            inMemoryDB.set(key, command.input.Item);
            saveDB();
            return { $metadata: {} };
        }

        // Handle GetCommand
        if (commandName === 'GetCommand') {
            const key = `${command.input.Key.PK}#${command.input.Key.SK}`;
            const Item = inMemoryDB.get(key);
            console.log(`[MockDB] Get ${key} -> ${Item ? 'Found' : 'Not Found'}`);
            return { Item };
        }

        // Handle QueryCommand
        if (commandName === 'QueryCommand') {
            const items: any[] = [];

            const pkValue = command.input.ExpressionAttributeValues?.[':pk'];
            const skValue = command.input.ExpressionAttributeValues?.[':sk'];

            console.log(`[MockDB] Query PK=${pkValue}, SK=${skValue}`);

            inMemoryDB.forEach((value, key) => {
                if (pkValue && !key.startsWith(pkValue)) {
                    return;
                }

                if (skValue) {
                    if (!key.includes(skValue)) return;
                }

                items.push(value);
            });
            console.log(`[MockDB] Query found ${items.length} items`);

            return { Items: items };
        }

        // Handle ScanCommand
        if (commandName === 'ScanCommand') {
            const items: any[] = [];
            inMemoryDB.forEach((value) => {
                if (command.input.FilterExpression) {
                    const skValue = command.input.ExpressionAttributeValues?.[':sk'];
                    if (skValue) {
                        if (command.input.FilterExpression.includes('begins_with(SK')) {
                            if (value.SK.startsWith(skValue)) items.push(value);
                        }
                        else if (value.SK === skValue) {
                            items.push(value);
                        }
                    }
                } else {
                    items.push(value);
                }
            });
            return { Items: items };
        }

        // Handle UpdateCommand
        if (commandName === 'UpdateCommand') {
            const key = `${command.input.Key.PK}#${command.input.Key.SK}`;
            const existing = inMemoryDB.get(key) || { ...command.input.Key };

            const updates = command.input.ExpressionAttributeValues || {};
            Object.keys(updates).forEach(placeholder => {
                const attrName = placeholder.replace(':', '');
                existing[attrName] = updates[placeholder];
            });

            inMemoryDB.set(key, existing);
            saveDB();
            return { $metadata: {}, Attributes: existing };
        }

        return { $metadata: {} };
    }
};

export function clearMockDB() {
    inMemoryDB.clear();
    saveDB();
}
