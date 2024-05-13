import addPoints from '../lib/addPoints'
import { MongoClient, ServerApiVersion } from 'mongodb';
const db = new MongoClient(process.env.DB_URI);

let users = new Map();

let testMember = {
    id: "TestingAccountID",
    user: {
        displayName: "TestingAccount"
    }
};

users.set(testMember.id, new Date().getTime())

// Bad practice, honestly probably don't need to test this functionn a test suite as this function is just db handling
describe("addPoints.js", () => {
    test("User successfully added", async () => {
        await addPoints(new Date().getTime(), testMember, users);
        const res = await db.db("points-db").collection("Users").findOne({_id: testMember.id});
    
        // Assertions
        expect(res._id).toBe("TestingAccountID");
        expect(res.points).toBe(0);
    
        // Clean up
        await db.db("points-db").collection("Users").deleteOne({_id: testMember.id})
    });
});
