// --- MAIN SERVICE ---
export const BookmarkBackupService = {
    
    async exportBookmarksToUser(handle: string): Promise<void> {
        const dynamicKey = `cf_mentor_bookmarks_${handle}`;
        const bookmarkResult = await chrome.storage.sync.get([dynamicKey]);
        const bookmarks = bookmarkResult[dynamicKey] || { bookmarkedProblems: {} };

        // 1. JSON -> Raw Bytes
        const jsonString = JSON.stringify(bookmarks);
        const rawBytes = new TextEncoder().encode(jsonString);

        // 2. Gzip Compress
        const cs = new CompressionStream('gzip');
        const writer = cs.writable.getWriter();
        writer.write(rawBytes as any);
        writer.close();
        const gzippedBuffer = await new Response(cs.readable).arrayBuffer();
        const gzippedBytes = new Uint8Array(gzippedBuffer);

        // 3. SHA-256 Checksum (Hex string is always 64 characters)
        const hashBuffer = await crypto.subtle.digest('SHA-256', gzippedBytes);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // 4. Combine Checksum + Payload in raw memory
        const checksumBytes = new TextEncoder().encode(checksum); // Exactly 64 bytes
        const combinedBytes = new Uint8Array(checksumBytes.length + gzippedBytes.length);
        
        combinedBytes.set(checksumBytes, 0); 
        combinedBytes.set(gzippedBytes, checksumBytes.length); 

        // 5. NO BASE64! Write the raw binary bytes directly to the file
        const blob = new Blob([combinedBytes], { type: 'application/octet-stream' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cf_mentor_backup_${handle}_${new Date().toISOString().split('T')[0]}.cfbackup`;
        a.click();
        
        URL.revokeObjectURL(url);
    },

    async importBookmarksFromUser(file: File, handle: string): Promise<void> {
        // 1. Read the file as a raw ArrayBuffer, NOT as text!
        const arrayBuffer = await file.arrayBuffer();
        const combinedBytes = new Uint8Array(arrayBuffer);

        if (combinedBytes.length <= 64) {
            throw new Error("Invalid .cfbackup file format.");
        }

        // 2. Split the memory block: First 64 bytes = Checksum, Rest = Payload
        const checksumBytes = combinedBytes.slice(0, 64);
        const gzippedBytes = combinedBytes.slice(64);

        const expectedChecksum = new TextDecoder().decode(checksumBytes);

        // 3. Verify Checksum against the payload
        const hashBuffer = await crypto.subtle.digest('SHA-256', gzippedBytes);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const calculatedChecksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        if (calculatedChecksum !== expectedChecksum) {
            throw new Error("Checksum mismatch! The backup file is corrupted or tampered with.");
        }

        // 4. Decompress Gzip payload
        const ds = new DecompressionStream('gzip');
        const writer = ds.writable.getWriter();
        writer.write(gzippedBytes as any);
        writer.close();
        const decompressedBuffer = await new Response(ds.readable).arrayBuffer();

        // 5. Decode to JSON and Parse
        const jsonString = new TextDecoder().decode(decompressedBuffer);
        const restoredBookmarks = JSON.parse(jsonString);

        // 6. Save back to Chrome Sync Storage
        const dynamicKey = `cf_mentor_bookmarks_${handle}`;
        await chrome.storage.sync.set({ [dynamicKey]: restoredBookmarks });
    }
};