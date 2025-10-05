const DB_NAME = "cf-mentor-db";
const DB_VERSION = 2;

export const MENTOR_STORE = {
	PROBLEMS: "problems",
	CONTESTS: "contests",
	SHEETS: "sheets",
	SHEETS_PROBLEMS: "sheets_problems",
};

let db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
	if (db) {
		return db;
	}

	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(MENTOR_STORE.PROBLEMS)) {
				db.createObjectStore(MENTOR_STORE.PROBLEMS, {
					keyPath: ["contest_id", "index"],
				});
			}
			if (!db.objectStoreNames.contains(MENTOR_STORE.CONTESTS)) {
				db.createObjectStore(MENTOR_STORE.CONTESTS, { keyPath: "id" });
			}
			if (!db.objectStoreNames.contains(MENTOR_STORE.SHEETS)) {
				db.createObjectStore(MENTOR_STORE.SHEETS, { keyPath: "id" });
			}
			if (!db.objectStoreNames.contains(MENTOR_STORE.SHEETS_PROBLEMS)) {
				db.createObjectStore(MENTOR_STORE.SHEETS_PROBLEMS, {
					keyPath: ["sheet_id", "contest_id", "index"],
				});
			}
		};

		request.onsuccess = (event) => {
			db = (event.target as IDBOpenDBRequest).result;
			resolve(db);
		};

		request.onerror = (event) => {
			console.error(
				"IndexedDB error:",
				(event.target as IDBOpenDBRequest).error
			);
			reject((event.target as IDBOpenDBRequest).error);
		};
	});
}

export async function saveData(
	storeName: string,
	data: any[]
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

export async function saveAllData(data: {
	problems: any[];
	contests: any[];
	sheets: any[];
	sheets_problems: any[];
}): Promise<void> {
	const db = await openDB();
	const transaction = db.transaction(Object.values(MENTOR_STORE), "readwrite");

	const problemsStore = transaction.objectStore(MENTOR_STORE.PROBLEMS);
	problemsStore.clear();
	data.problems.forEach((item) => problemsStore.add(item));

	const contestsStore = transaction.objectStore(MENTOR_STORE.CONTESTS);
	contestsStore.clear();
	data.contests.forEach((item) => contestsStore.add(item));

	const sheetsStore = transaction.objectStore(MENTOR_STORE.SHEETS);
	sheetsStore.clear();
	data.sheets.forEach((item) => sheetsStore.add(item));

	const sheetProblemsStore = transaction.objectStore(
		MENTOR_STORE.SHEETS_PROBLEMS
	);
	sheetProblemsStore.clear();
	data.sheets_problems.forEach((item) => sheetProblemsStore.add(item));

	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => {
			resolve();
		};
		transaction.onerror = (event) => {
			reject((event.target as IDBTransaction).error);
		};
	});
}

export async function getData(
	storeName: string,
	ids?: string[]
): Promise<any[]> {
	const db = await openDB();
	const transaction = db.transaction(storeName, "readonly");
	const store = transaction.objectStore(storeName);

	return new Promise((resolve, reject) => {
		let request: IDBRequest;
		if (ids) {
			const results: any[] = [];
			let completed = 0;

			if (ids.length === 0) {
				resolve([]);
				return;
			}

			ids.forEach((id) => {
				request = store.get(id);
				request.onsuccess = (event) => {
					const result = (event.target as IDBRequest).result;
					if (result) {
						results.push(result);
					}
					completed++;
					if (completed === ids.length) {
						resolve(results);
					}
				};
			});

			transaction.onerror = (event) => {
				reject((event.target as IDBTransaction).error);
			};
		} else {
			request = store.getAll();
			request.onsuccess = (event) => {
				resolve((event.target as IDBRequest).result);
			};
			request.onerror = (event) => {
				reject((event.target as IDBRequest).error);
			};
		}
	});
}
