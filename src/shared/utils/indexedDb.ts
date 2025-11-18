import { Contest, MentorData, Problem, Sheet, SheetProblem } from "../types/mentor";

const DB_NAME = "cf-mentor-db";
const DB_VERSION = 4; // Incremented version to trigger schema upgrade

export const MENTOR_STORE = {
	PROBLEMS: "problems",
	CONTESTS: "contests",
	SHEETS: "sheets",
	SHEETS_PROBLEMS: "sheets_problems",
	USER_CACHE: "user_cache",
};

const stores = [
	{ name: MENTOR_STORE.PROBLEMS, key: ["contestId", "index"] },
	{ name: MENTOR_STORE.CONTESTS, key: "id" },
	{ name: MENTOR_STORE.SHEETS, key: "id" },
	{ name: MENTOR_STORE.SHEETS_PROBLEMS, key: ["sheetId", "contestId", "index"] },
	{ name: MENTOR_STORE.USER_CACHE, key: "key" },
];

async function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			console.log("Upgrading IndexedDB schema...");
			stores.forEach(storeInfo => {
				// Only create object stores if they don't already exist.
				if (!db.objectStoreNames.contains(storeInfo.name)) {
					db.createObjectStore(storeInfo.name, { keyPath: storeInfo.key });
				}
			});
		};

		request.onsuccess = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			resolve(db);
		};

		request.onerror = (event) => {
			console.error(
				"IndexedDB error:",
				(event.target as IDBOpenDBRequest).error,
			);
			reject((event.target as IDBOpenDBRequest).error);
		};
	});
}

export async function saveData(
	storeName: string,
	data: (Problem | Contest | Sheet | SheetProblem | any)[],
): Promise<void> {
	const db = await openDB();
	const transaction = db.transaction(storeName, "readwrite");
	const store = transaction.objectStore(storeName);
	
	// For user cache, we might be saving a single item or multiple. 
	// If it's a cache update, we usually just put/add.
	// The original saveData cleared the store, which is fine for bulk data but maybe not for cache?
	// Actually, for problems/contests we want to replace all.
	// For user cache, we probably want to append/update specific keys.
	// But this function is generic. Let's keep it as is for bulk updates (clearing store).
	// Wait, if I use this for cache, it will clear other users' cache!
	// I should probably NOT use `saveData` for single cache entry updates if it clears the store.
	// I'll add a `saveItem` or `updateItem` function, or modify `saveData` to have an option to not clear.
	// For now, I'll add `saveItems` which doesn't clear.
	
	// Actually, let's stick to the plan. I need `deleteData`.
	// And I probably need a way to save a single item without clearing.
	
	store.clear();
	data.forEach((item) => store.add(item));

	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => {
			resolve();
		};
		transaction.onerror = (event) => {
			reject((event.target as IDBTransaction).error);
		};
	});
}

export async function saveItems(
	storeName: string,
	items: any[]
): Promise<void> {
	const db = await openDB();
	const transaction = db.transaction(storeName, "readwrite");
	const store = transaction.objectStore(storeName);

	items.forEach((item) => store.put(item)); // put updates if exists

	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => resolve();
		transaction.onerror = (event) => reject((event.target as IDBTransaction).error);
	});
}

export async function deleteData(
	storeName: string,
	keys: IDBValidKey[]
): Promise<void> {
	const db = await openDB();
	const transaction = db.transaction(storeName, "readwrite");
	const store = transaction.objectStore(storeName);

	keys.forEach((key) => store.delete(key));

	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => resolve();
		transaction.onerror = (event) => reject((event.target as IDBTransaction).error);
	});
}

export async function saveAllData(data: MentorData): Promise<void> {
	console.log("Attempting to save data to IndexedDB...");
	const db = await openDB();
	const transaction = db.transaction(Object.values(MENTOR_STORE).filter(s => s !== MENTOR_STORE.USER_CACHE), "readwrite");

	const dataMap = {
		[MENTOR_STORE.PROBLEMS]: data.problems,
		[MENTOR_STORE.CONTESTS]: data.contests,
		[MENTOR_STORE.SHEETS]: data.sheets,
		[MENTOR_STORE.SHEETS_PROBLEMS]: data.sheetsProblems,
	};

	Object.entries(dataMap).forEach(([storeName, storeData]) => {
		console.log(`Saving ${storeData.length} items to ${storeName}`);
		const store = transaction.objectStore(storeName);
		store.clear();
		storeData.forEach((item: any) => {
			store.add(item);
		});
	});

	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => {
			console.log("Transaction complete. Data saved successfully.");
			resolve();
		};
		transaction.onerror = (event) => {
			console.error("Transaction error:", (event.target as IDBTransaction).error);
			reject((event.target as IDBTransaction).error);
		};
	});
}

export async function getData<T>(
	storeName: string,
	ids?: IDBValidKey[],
): Promise<T[]> {
	console.log(`Attempting to get data from store: ${storeName}`);
	const db = await openDB();
	const transaction = db.transaction(storeName, "readonly");
	const store = transaction.objectStore(storeName);

	return new Promise((resolve, reject) => {
		const request = store.getAll();

		request.onsuccess = (event) => {
			const results = (event.target as IDBRequest).result as T[];
			console.log(`Retrieved ${results.length} records from ${storeName}.`);
			if (ids && ids.length > 0) {
				const idSet = new Set(ids);
				const filteredResults = results.filter(item => {
					const key = store.keyPath;
					return idSet.has((item as any)[key as string]);
				});
				resolve(filteredResults);
			} else {
				resolve(results);
			}
		};

		request.onerror = (event) => {
			console.error(`Error getting data from ${storeName}:`, (event.target as IDBRequest).error);
			reject((event.target as IDBRequest).error);
		};
	});
}
