// 2. Creates the blank spreadsheet in Google Drive
export const createGoogleSheet = async (token: string) => {
    try {
        console.log("Creating new Google Sheet...");
        const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                properties: { title: "Codeforces Bookmarks Sync" }
            })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        return {
            spreadsheetId: data.spreadsheetId,
            spreadsheetUrl: data.spreadsheetUrl
        };
    } catch (error) {
        console.error("Failed to create spreadsheet:", error);
    }
};

// 3. Writes the 2D array of bookmarks to the sheet
export const exportBookmarksToSheet = async (token: string, spreadsheetId: string, bookmarks: any[]) => {
    try {
        console.log("Writing data to Google Sheets...");

        // 1. Expanded Headers to match your new interface
        const sheetData = [
            ["Problem ID", "Problem Rating", "Tags", "My Difficulty (1-5)", "Time Required (s)", "Notes", "Date Bookmarked"]
        ];

        // 2. Loop through and format the specific data types
        bookmarks.forEach(bookmark => {
            // Combine contestId and problemIdx (e.g., "158" + "A" = "158A")
            const problemId = `${bookmark.contestId || ""}${bookmark.problemIdx || ""}`;

            // Arrays need to be joined into a single comma-separated string for Google Sheets
            const tagsString = Array.isArray(bookmark.problemTags) ? bookmark.problemTags.join(", ") : "";

            // Convert the unix timestamp into a readable human date
            const dateBookmarked = bookmark.bookmarkedAt ? new Date(bookmark.bookmarkedAt).toLocaleDateString() : "";

            sheetData.push([
                problemId,
                bookmark.problemRating || "",
                tagsString,
                bookmark.difficultyRating || "",
                bookmark.timeRequiredSeconds || "",
                bookmark.notes || "",
                dateBookmarked
            ]);
        });

        // 3. Notice the URL changed to Sheet1!A1:G because we now have 7 columns!
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:G?valueInputOption=USER_ENTERED`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ values: sheetData })
        });

        if (!response.ok) throw new Error(`Failed to write data: ${response.statusText}`);

        console.log("Data successfully written!");
        return await response.json();

    } catch (error) {
        console.error("Error writing to sheet:", error);
    }
};