require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI not found in environment');
            process.exit(1);
        }
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        for (const colInfo of collections) {
            const name = colInfo.name;
            const collection = db.collection(name);
            
            const docs = await collection.find({}).toArray();
            let count = 0;
            for (const doc of docs) {
                const docStr = JSON.stringify(doc);
                if (docStr.includes('default-placeholder')) {
                    console.log(`Found in collection: ${name}, field value:`);
                    // Find which keys have this value
                    for (const key of Object.keys(doc)) {
                        const val = doc[key];
                        if (typeof val === 'string' && val.includes('default-placeholder')) {
                            console.log(`  - ID: ${doc._id || doc.customId}, Field: ${key}, Value: "${val}"`);
                        } else if (typeof val === 'object' && val !== null) {
                            const valStr = JSON.stringify(val);
                            if (valStr.includes('default-placeholder')) {
                                console.log(`  - ID: ${doc._id || doc.customId}, Field: ${key} (object), Value:`, val);
                            }
                        }
                    }
                    count++;
                }
            }
        }
        console.log('Database check completed.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
