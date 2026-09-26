type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
	private prefix = "[AI Extension]";

	private log(level: LogLevel, message: string, ...args: any[]) {
		const timestamp = new Date().toISOString();
		console[level](`${this.prefix} [${timestamp}] ${message}`, ...args);
	}

	info(message: string, ...args: any[]) {
		this.log("info", message, ...args);
	}

	warn(message: string, ...args: any[]) {
		this.log("warn", message, ...args);
	}

	error(message: string, ...args: any[]) {
		this.log("error", message, ...args);
	}

	debug(message: string, ...args: any[]) {
		if (import.meta.env.MODE === "development") {
			this.log("debug", message, ...args);
		}
	}
}

export const logger = new Logger();
