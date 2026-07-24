const saveBtn = document.getElementById("saveBtn");
const bookmarkList = document.getElementById("bookmarkList");
const search = document.getElementById("search");
const darkModeBtn = document.getElementById("darkModeBtn");
const tabs = document.querySelectorAll(".tab");
const bookmarkCount = document.getElementById("bookmarkCount");

let currentTab = "all"; // 'all' or 'favorites'

// Initialize setup on popup open
document.addEventListener("DOMContentLoaded", () => {
    initDarkMode();
    loadBookmarks();
});

// Event Listeners
saveBtn.addEventListener("click", saveCurrentTab);
search.addEventListener("input", loadBookmarks);

darkModeBtn.addEventListener("click", toggleDarkMode);

tabs.forEach(tab => {
    tab.addEventListener("click", (e) => {
        tabs.forEach(t => t.classList.remove("active"));
        const selectedTab = e.currentTarget;
        selectedTab.classList.add("active");
        currentTab = selectedTab.getAttribute("data-tab");
        loadBookmarks();
    });
});

// Dark Mode Toggle
function toggleDarkMode() {
    const isDark = document.body.classList.toggle("dark-mode");
    chrome.storage.local.set({ darkMode: isDark });
    updateDarkModeIcon(isDark);
}

function initDarkMode() {
    chrome.storage.local.get(["darkMode"], (data) => {
        if (data.darkMode) {
            document.body.classList.add("dark-mode");
            updateDarkModeIcon(true);
        }
    });
}

function updateDarkModeIcon(isDark) {
    const icon = darkModeBtn.querySelector("i");
    if (isDark) {
        icon.className = "fa-solid fa-sun";
    } else {
        icon.className = "fa-solid fa-moon";
    }
}

// Save Current Browser Tab
function saveCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let tab = tabs[0];

        chrome.storage.local.get(["bookmarks"], function (data) {
            let bookmarks = data.bookmarks || [];

            // Prevent duplicate bookmarks
            let exists = bookmarks.some(bookmark => bookmark.url === tab.url);

            if (exists) {
                alert("This page is already bookmarked.");
                return;
            }

            bookmarks.push({
                title: tab.title,
                url: tab.url,
                isFavorite: false
            });

            chrome.storage.local.set({ bookmarks: bookmarks }, function () {
                loadBookmarks();
            });
        });
    });
}

// Display Bookmarks
function loadBookmarks() {
    chrome.storage.local.get(["bookmarks"], function (data) {
        let bookmarks = data.bookmarks || [];
        bookmarkList.innerHTML = "";

        let keyword = search.value.toLowerCase();
        let displayedCount = 0;

        bookmarks.forEach((bookmark, index) => {
            const matchesTab = currentTab === "all" || (currentTab === "favorites" && bookmark.isFavorite);
            const matchesSearch = bookmark.title.toLowerCase().includes(keyword) ||
                                  bookmark.url.toLowerCase().includes(keyword);

            if (matchesTab && matchesSearch) {
                displayedCount++;

                let card = document.createElement("div");
                card.className = "card";

                // Header inside Card (Title + Star Favorite button)
                let cardHeader = document.createElement("div");
                cardHeader.className = "card-header";

                let title = document.createElement("div");
                title.className = "title";
                title.textContent = bookmark.title;

                let favBtn = document.createElement("button");
                favBtn.className = `fav-btn ${bookmark.isFavorite ? 'active' : ''}`;
                favBtn.innerHTML = `<i class="${bookmark.isFavorite ? 'fa-solid' : 'fa-regular'} fa-star"></i>`;
                favBtn.title = bookmark.isFavorite ? "Remove from Favorites" : "Add to Favorites";

                favBtn.addEventListener("click", function () {
                    toggleFavorite(index);
                });

                cardHeader.appendChild(title);
                cardHeader.appendChild(favBtn);

                // URL
                let url = document.createElement("div");
                url.className = "url";
                url.textContent = bookmark.url;

                // Action Buttons
                let actions = document.createElement("div");
                actions.className = "actions";

                // Open Button
                let openBtn = document.createElement("button");
                openBtn.textContent = "Open";

                openBtn.addEventListener("click", function () {
                    chrome.tabs.create({ url: bookmark.url });
                });

                // Delete Button
                let deleteBtn = document.createElement("button");
                deleteBtn.textContent = "Delete";

                deleteBtn.addEventListener("click", function () {
                    if (confirm("Delete this bookmark?")) {
                        deleteBookmark(index);
                    }
                });

                actions.appendChild(openBtn);
                actions.appendChild(deleteBtn);

                card.appendChild(cardHeader);
                card.appendChild(url);
                card.appendChild(actions);

                bookmarkList.appendChild(card);
            }
        });

        // Update Stats Counter
        bookmarkCount.textContent = bookmarks.length;

        if (displayedCount === 0) {
            const msg = currentTab === "favorites" ? "No favorite bookmarks." : "No bookmarks saved.";
            bookmarkList.innerHTML = `<p style='text-align:center;color:gray;padding-top:20px;'>${msg}</p>`;
        }
    });
}

// Toggle Favorite State
function toggleFavorite(index) {
    chrome.storage.local.get(["bookmarks"], function (data) {
        let bookmarks = data.bookmarks || [];
        if (bookmarks[index]) {
            bookmarks[index].isFavorite = !bookmarks[index].isFavorite;
            chrome.storage.local.set({ bookmarks: bookmarks }, function () {
                loadBookmarks();
            });
        }
    });
}

// Delete Bookmark
function deleteBookmark(index) {
    chrome.storage.local.get(["bookmarks"], function (data) {
        let bookmarks = data.bookmarks || [];
        bookmarks.splice(index, 1);

        chrome.storage.local.set({ bookmarks: bookmarks }, function () {
            loadBookmarks();
        });
    });
}