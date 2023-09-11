import express from 'express'
import { createUser, getUserByEmail } from '../db/users';

import {random, authentication} from '../helpers/index'

export const logIn = async(req:express.Request,res:express.Response) => {
    try{
        const {email,password} = req.body;
        if(!email || !password){
            return res.sendStatus(400)
        }

        const userEmail = (await getUserByEmail(email).select('+authentication.salt +authentication.password'));
        if(!userEmail){
            return res.sendStatus(400);
        }

        const expectedHash = authentication(userEmail.authentication.salt,password);

        if(userEmail.authentication.password != expectedHash){
            return res.sendStatus(403);
        }

        const salt = random();
        userEmail.authentication.sessionToken = authentication(salt, userEmail._id.toString());

        await userEmail.save();

        res.cookie('YOUSEF-NEGM',userEmail.authentication.sessionToken,{domain:'localhost',path:'/'})
        return res.status(200).json(userEmail).end();
    }
    catch(err){
        console.log(err);
        return res.sendStatus(400);
    }
}

export const register = async (req:express.Request,res:express.Response) => {
    try{
        const {email,password,username} = req.body;
        if(!email || !password || !username){
            return res.sendStatus(400);
        }

        const existingUser = await getUserByEmail(email);

        if(existingUser){
            return res.sendStatus(400);
        }

        const salt = random();
        const user = await createUser({
            email,
            username,
            authentication:{
                salt,
                password: authentication(salt,password),
            },
    })

        return res.status(200).json(user).end();
    }catch(err){
        console.log(err);
        return res.sendStatus(400);
    }
}