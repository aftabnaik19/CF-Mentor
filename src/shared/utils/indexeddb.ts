import { Contest, MentorData, Problem, Sheet, SheetProblem } from "../types/mentor";

const DB_NAME = "cf-mentor-db";
const DB_VERSION = 3; // Incremented version to trigger schema upgrade

export const MENTOR_STORE = {
	PROBLEMS: "problems",
	CONTESTS: "contests",
	SHEETS: "sheets",
	SHEETS_PROBLEMS: "sheets_problems",
};

const stores = [
	{ name: MENTOR_STORE.PROBLEMS, key: ["contestId", "index"] },
	{ name: MENTOR_STORE.CONTESTS, key: "id" },
	{ name: MENTOR_STORE.SHEETS, key: "id" },
	{ name: MENTOR_STORE.SHEETS_PROBLEMS, key: ["sheetId", "contestId", "index"] },
];

let db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
	if (db) {
		return db;
	}

	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			console.log("Upgrading IndexedDB schema...");
			stores.forEach(storeInfo => {
				// If the store already exists, delete it to ensure the keyPath is updated.
				if (db.objectStoreNames.contains(storeInfo.name)) {
					db.deleteObjectStore(storeInfo.name);
				}
				db.createObjectStore(storeInfo.name, { keyPath: storeInfo.key });
			});
		};

		request.onsuccess = (event) => {
			db = (event.target as IDBOpenDBRequest).result;
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
	data: (Problem | Contest | Sheet | SheetProblem)[],
): Promise<void> {
	const db = await openDB();
	const transaction = db.transaction(storeName, "readwrite");
	const store = transaction.objectStore(storeName);
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

export async function saveAllData(data: MentorData): Promise<void> {
	const db = await openDB();
	const transaction = db.transaction(Object.values(MENTOR_STORE), "readwrite");

	const dataMap = {
		[MENTOR_STORE.PROBLEMS]: data.problems,
		[MENTOR_STORE.CONTESTS]: data.contests,
		[MENTOR_STORE.SHEETS]: data.sheets,
		[MENTOR_STORE.SHEETS_PROBLEMS]: data.sheetsProblems,
	};

	Object.entries(dataMap).forEach(([storeName, storeData]) => {
		const store = transaction.objectStore(storeName);
		store.clear();
		storeData.forEach((item: any) => {
			store.add(item);
		});
	});

	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => {
			resolve();
		};
		transaction.onerror = (event) => {
			reject((event.target as IDBTransaction).error);
		};
	});
}

export async function getData<T>(
	storeName: string,
	ids?: IDBValidKey[],
): Promise<T[]> {
	const db = await openDB();
	const transaction = db.transaction(storeName, "readonly");
	const store = transaction.objectStore(storeName);

	return new Promise((resolve, reject) => {
		const request = store.getAll();

		request.onsuccess = (event) => {
			const results = (event.target as IDBRequest).result as T[];
			if (ids && ids.length > 0) {
				// This filtering is inefficient for large datasets, but acceptable for this extension's scale.
				// A more complex solution would involve cursors or multiple `get` requests.
				const idSet = new Set(ids);
				const filteredResults = results.filter(item => {
					const key = store.keyPath;
					// This is a simplified check; composite keys would need more robust handling.
					return idSet.has((item as any)[key as string]);
				});
				resolve(filteredResults);
			} else {
				resolve(results);
			}
		};

		request.onerror = (event) => {
			reject((event.target as IDBRequest).error);
		};
	});
}
