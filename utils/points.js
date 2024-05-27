import { db } from "../app.js";
import points from "../commands/getPoints.js";

export const addTimePoints = (currTime, member, users) => {
    // 10 points per minute
    const points = Math.floor(((currTime - users.get(member.id)) / 1000) / 60) * 10;
    postPoints(points, member);
}

export const addPoints = (points, member) => {
    postPoints(points, member);
}

export const removePoints = (points, member) => {
    postPoints(-points, member);
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


// for testing
export const removeTenPoints = (member) => {
    const points = 10;
    postPointsTest(-points, member);
}

// check if points on hand are higher than points bet (ie cost of bet)
export const pointsEnough = async (memberId, cost) => {

    try {
        const user = await db.db("points-db").collection("Users").findOne({_id: memberId});
        if (user && user.points >= cost) {
            return true;
        }
        
        return false;
    } catch (error) {
        console.log(error);
        return false;
    }
}


// test function to adjust points for a SPECIFIC MEMBER (identified by member ID)
// only for testing
async function postPointsTest(points, memberID) {
    try {
        // Check if the user exists in the database
        const user = await db.db("points-db").collection("Users").findOne({_id: memberID});
        
        db.db("points-db").collection("Users").updateOne(
            { _id: memberID },
            { $inc: {points: points }})

        console.log(`Removed ${points} from minihawwy`);
    } catch (error) {
        console.log(error)
    };
}
export default {removePoints, removeTenPoints, pointsEnough };