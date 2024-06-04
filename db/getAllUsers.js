import {db} from "../app.js";

export const getAllUsers = async () => {
    const res = await db.db("points-db").collection("Users").find(
        {}, {sort: {points: -1}}
    );

    return await res.toArray();
}