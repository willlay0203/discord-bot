import { db } from "../app.js";

export const addTimePoints = (currTime, member) => {
    // 10 points per minute
    const points = Math.floor(((currTime - users.get(member.id)) / 1000) / 60) * 10;
    postPoints(points, member);
}

export const addPoints = (points, member) => {
    postPoints(points, member);
}

async function postPoints(points, member) {
    try {
        // Check if the user exists in the database
        const user = await db.db("points-db").collection("Users").findOne({_id: member.id});
        
        if (user === null) {
            db.db("points-db").collection("Users").insertOne({_id: member.id, displayName: member.user.displayName, points: points});
        } else {
            db.db("points-db").collection("Users").updateOne(
                { _id: member.id },
                { $inc: {points: points }}
            );
        }
        console.log(`Added ${points} points to ${member.user.displayName}`);
    } catch (error) {
        console.log(error)
    };
}
export default addTimePoints;