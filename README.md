# CF Mentor Extension 🚀

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)

A Chrome extension designed to supercharge your Codeforces experience. CF Mentor adds a suite of powerful tools directly into the Codeforces interface, helping you train smarter and stay organized.

## ✨ Features

CF Mentor enhances the Codeforces website with the following key features:

* ⏱ **Stopwatch & Session Tracking:** Time your problem-solving sessions to improve speed and track your progress over time.
* ⭐ **Bookmarks & Difficulty Ratings:** Never lose a problem again. Bookmark problems for later and assign your own difficulty rating to tailor your training.
* 📝 **In-Page Notes:** Jot down ideas, approaches, and learnings directly on the problem page. Your notes are saved and synced automatically.
* 🔍 **Advanced Filtering:** Quickly find the perfect problems to solve with advanced filters for tags, difficulty, and solved status.

## 🛠️ Setup & Installation

Follow these steps to get the extension up and running on your local machine.

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/your-username/cf-mentor-extension.git](https://github.com/your-username/cf-mentor-extension.git)
    cd cf-mentor-extension
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Build the Extension:**
    This command will watch for file changes and rebuild the extension automatically.
    ```bash
    npm run dev
    ```
    This will generate the necessary distributable files inside the `dist/` directory.

4.  **Load the Extension in Chrome:**
    * Navigate to `chrome://extensions/` in your Chrome browser.
    * Enable **Developer Mode** using the toggle in the top-right corner.
    * Click the **"Load unpacked"** button.
    * Select the `dist` directory from the project folder.

🎉 You're all set! The CF Mentor Extension icon should now appear in your browser's toolbar, and its features will be active on Codeforces pages.

## 📁 Project Structure

Here's a brief overview of the project's directory structure:
.
├── dist/             # Auto-generated build output for the extension
├── public/           # Static assets (icons, manifest.json)
└── src/              # Main source code
├── background/   # Background service worker
├── content/      # Scripts injected into Codeforces pages
├── popup/        # UI components for the extension popup
└── shared/       # Reusable logic and utilities

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features or improvements, feel free to open an issue to discuss it. Pull requests are also highly appreciated.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is distributed under the MIT License. See `LICENSE.txt` for more information.
