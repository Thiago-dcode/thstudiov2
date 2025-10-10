import authService from "@/modules/auth/auth.service";
import { deleteUserSession, setUserSession } from "@/modules/auth/server-actions/user-session.action";
import { NextRequest, NextResponse } from "next/server";


const POST = async (request: NextRequest) => {
    console.log('Refresh token route called');
    let refreshed = false;
    
    try {
        // Get user data from request body (since cookies aren't forwarded in server-to-server fetch)
        const body = await request.json();
        const { user_id, token } = body;
        
        if (!user_id || !token) {
            console.log('Missing user_id or token in request body');
            return NextResponse.json({ 
                message: 'Missing credentials', 
                refreshed: false 
            }, { status: 400 });
        }
        
        console.log('Attempting to refresh token for user:', user_id);
        const result = await authService.refreshToken({
            user_id,
            token,
        });
        
        console.log('Refresh token result:', result.error ? 'failed' : 'success');
        
        if (result.error || !result.data) {
            console.log('Token refresh failed - clearing session');
            await deleteUserSession();
            refreshed = false;
        } else {
            console.log('Token refreshed successfully - updating session');
            await setUserSession(result.data);
            refreshed = true;
        }
    } catch (error) {
        console.error('Error in refresh token route:', error);
        return NextResponse.json({ 
            message: 'Error refreshing token', 
            refreshed: false 
        }, { status: 500 });
    }
    
    return NextResponse.json({ 
        message: refreshed ? 'Token refreshed' : 'Token refresh failed', 
        refreshed 
    });
}

export { POST };
