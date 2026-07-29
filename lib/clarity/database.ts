"use client";

import { createClient } from "../auth";


export async function getBusinessContext(userId:string){

const supabase = await createClient();


const [
 organisations,
 projects,
 tasks,
 campaigns,
 contacts,
 accounts
] = await Promise.all([

supabase
.from("organisations")
.select("*")
.eq("owner_id",userId),

supabase
.from("projects")
.select("*")
.eq("user_id",userId),

supabase
.from("tasks")
.select("*")
.eq("user_id",userId),

supabase
.from("campaigns")
.select("*")
.eq("user_id",userId),

supabase
.from("contacts")
.select("*")
.eq("user_id",userId),

supabase
.from("accounts")
.select("*")
.eq("user_id",userId)

])


return {

organisations: organisations.data,
projects: projects.data,
tasks: tasks.data,
campaigns: campaigns.data,
contacts: contacts.data,
accounts: accounts.data

}

}