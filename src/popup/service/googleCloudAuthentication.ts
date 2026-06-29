export const authenticateWithGoogle = async () => {
    try {
        const token = await new Promise<string>((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: true }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError.message);
                    return;
                } 
                
                if (response) {
                    // Extract the token safely depending on how the browser returns it
                    const actualToken = typeof response === 'string' 
                        ? response 
                        : (response as any).token;
                        
                    if (actualToken) {
                        resolve(actualToken);
                    } else {
                        reject("Token object returned, but string is empty.");
                    }
                } else {
                    reject("No token returned");
                }
            });
        });

        console.log("Success! Here is your OAuth Token:", token);
        return token;
        
    } catch (error) {
        console.error("Authentication failed:", error);
    }
};