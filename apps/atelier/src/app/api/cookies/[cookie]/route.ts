
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const DELETE = async (_: NextRequest, { params }: { params: Promise<{ cookie: string }> }) => {
    const cookieStore = await cookies();
    const cookieName = (await params).cookie;
    if(!cookieName){
        return NextResponse.json({ message: 'Cookie name is required' }, { status: 400 });
    }
    cookieStore.set(cookieName as string, '', {
        httpOnly: true,
        maxAge: 0
    });
    return NextResponse.json({ message: 'Cookie deleted' });
}

const POST = async (request: NextRequest, { params }: { params: Promise<{ cookie: string }> }) => {
    const cookieStore = await cookies();
    const cookieName = (await params).cookie;
    const body = await request.json();
    const {value,maxAge} = body;
    if(!cookieName){
        return NextResponse.json({ message: 'Cookie name is required' }, { status: 400 });
    }
    if(!value){
        return NextResponse.json({ message: 'Value is required' }, { status: 400 });
    }
    cookieStore.set(cookieName as string, value, {
        httpOnly: true,
        maxAge: maxAge
    });
}

export { DELETE, POST };
