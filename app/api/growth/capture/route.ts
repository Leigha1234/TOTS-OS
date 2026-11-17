import { NextResponse } from 'next/server';
export const runtime='nodejs';
// Deliberately disabled: public capture requires rate limiting and bot protection.
export async function POST(){return NextResponse.json({error:'Public lead capture is disabled until rate limiting and bot protection are configured.'},{status:503});}
