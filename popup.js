const tabList = document.getElementById('tab-list');
const saveCurrentBtn = document.getElementById('save-current');
const saveAllBtn = document.getElementById('save-all');
const searchInput = document.getElementById('search-input');
const clearTabs = document.getElementById('clear-tabs');
const newFolder = document.getElementById('newFolder');
const viewFolders = document.getElementById('viewFolders');


let savedTabs = [];

// Render the saved tabs from the local storage
function renderSavedTabs() {
  const savedTabsJSON = localStorage.getItem('savedTabs');
  if (savedTabsJSON !== null) {
    savedTabs = JSON.parse(savedTabsJSON); //SavedTabs is array stored pages
    savedTabs.sort((a, b) => a.index - b.index); // Sort tabs based on index
    for (let tab of savedTabs) {
      const listItem = createListItem(tab);
      tabList.appendChild(listItem);
    }
  }
}

function saveCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    const { title, url } = tab;
    const favicon = tab.favIconUrl;
    const index = savedTabs.length; // Set the index to the current length of savedTabs array
    savedTabs.unshift({ title, url, favicon, index }); // Add the index property and unshift the tab
    updateTabIndexes(); // Update the indexes of existing tabs
    localStorage.setItem('savedTabs', JSON.stringify(savedTabs));
    const listItem = createListItem({ title, url, favicon, index });
    tabList.insertBefore(listItem, tabList.firstChild);
  });
}

function saveAllTabs() {
  chrome.tabs.query({ currentWindow: true }, function (tabs) {
    const tabsWithFavicons = tabs.map((tab, index) => {
      const { title, url, favIconUrl: favicon } = tab;
      return { title, url, favicon, index: -index }; // Use negative indexes to reverse the order
    });

    savedTabs.unshift(...tabsWithFavicons);
    updateTabIndexes();
    localStorage.setItem('savedTabs', JSON.stringify(savedTabs));
    tabList.innerHTML = ''; // Clear the tabList before rendering
    for (let tab of savedTabs) {
      const listItem = createListItem(tab);
      tabList.appendChild(listItem);
    }
  });
}

function CreateNewFolder() {
  return null;
}

function ViewFolders() {
  return null;
}

function ClearTabs() {
  console.log(savedTabs)
  savedTabs.splice(0, savedTabs.length)
  console.log(savedTabs)
  renderSavedTabs()


}


function updateTabIndexes() {
  savedTabs.forEach((tab, index) => {
    tab.index = index; // Update the index of each tab in the savedTabs array
  });
}


// Filter the saved tabs array based on the search input value and render the results
function searchSavedTabs() {
  const searchTerm = searchInput.value.toLowerCase();
  const filteredTabs = savedTabs.filter(tab => tab.title.toLowerCase().includes(searchTerm));
  tabList.innerHTML = '';
  for (let tab of filteredTabs) {
    const listItem = createListItem(tab);
    tabList.appendChild(listItem);
  }
}

function extractFaviconFromHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const iconLink = doc.querySelector('link[rel="icon"]');
  if (iconLink) {
    return iconLink.href;
  }
  const appleTouchIconLink = doc.querySelector('link[rel="apple-touch-icon"]');
  if (appleTouchIconLink) {
    return appleTouchIconLink.href;
  }
  const shortcutIconLink = doc.querySelector('link[rel="shortcut icon"]');
  if (shortcutIconLink) {
    return shortcutIconLink.href;
  }
  return null;
}


// Resolve the favicon URL
function resolveFaviconUrl(faviconUrl, baseUrl) {
  if (!faviconUrl) return null;

  // Check if the favicon URL is absolute
  if (faviconUrl.startsWith('http') || faviconUrl.startsWith('//')) {
    return faviconUrl;
  }

  // Check if the favicon URL is relative
  if (faviconUrl.startsWith('/')) {
    const tempElement = document.createElement('a');
    tempElement.href = baseUrl;
    return tempElement.protocol + '//' + tempElement.host + faviconUrl;
  }

  // Favicon URL is relative to the base URL
  const baseUrlWithoutPath = baseUrl.split('/').slice(0, 3).join('/');
  return baseUrlWithoutPath + '/' + faviconUrl;
}

// Create a list item element with a delete button
function createListItem(tab) {
  const listItem = document.createElement('li');
  listItem.className = 'list-item';

  // Create the container for favicon and text
  const contentContainer = document.createElement('div');
  contentContainer.className = 'content-container';

  // Create the favicon image element
  const faviconImg = new Image();
  faviconImg.className = 'favicon-img';
  faviconImg.onerror = function () {
    // Set a default favicon image if the favicon cannot be loaded
    this.src = 'icons/default.png';
  };
  faviconImg.src = tab.favicon;

  // Create the link with the tab title
  const link = document.createElement('a');
  link.href = tab.url;
  link.innerText = tab.title;
  link.target = '_blank';
  link.className = 'tab-link';

  // Add the favicon and link to the content container
  contentContainer.appendChild(faviconImg);
  contentContainer.appendChild(link);

  // Create the arrow up icon
  const arrowUpIcon = document.createElement('span');
  arrowUpIcon.className = 'arrow-icon up';
  arrowUpIcon.innerHTML = '&#8593;';
  arrowUpIcon.addEventListener('click', function (event) {
    event.stopPropagation(); // prevent the URL from opening
    moveTabUp(tab);
  });

  // Create the arrow down icon
  const arrowDownIcon = document.createElement('span');
  arrowDownIcon.className = 'arrow-icon down';
  arrowDownIcon.innerHTML = '&#8595;';
  arrowDownIcon.addEventListener('click', function (event) {
    event.stopPropagation(); // prevent the URL from opening
    moveTabDown(tab);
  });

  // Add the link and arrow icons to the content container
  contentContainer.appendChild(link);
  contentContainer.appendChild(arrowUpIcon);
  contentContainer.appendChild(arrowDownIcon);

  listItem.appendChild(contentContainer);


  // create the delete button
  const deleteIcon = document.createElement('span');
  deleteIcon.className = 'delete-icon';
  deleteIcon.innerHTML = '&#10005;';
  deleteIcon.addEventListener('click', function (event) {
    event.stopPropagation(); // prevent the URL from opening
    const index = savedTabs.indexOf(tab);
    if (index > -1) {
      savedTabs.splice(index, 1);
      localStorage.setItem('savedTabs', JSON.stringify(savedTabs));
    }
    listItem.remove();
  });

  // create the edit button
  const editIcon = document.createElement('span');
  editIcon.className = 'edit-icon';
  editIcon.innerHTML = '&#9998;';
  editIcon.addEventListener('click', function (event) {
    event.stopPropagation(); // prevent the URL from opening
    const newTitle = prompt('Enter the new title:', tab.title);
    if (newTitle !== null) {
      tab.title = newTitle;
      link.innerText = newTitle;
      localStorage.setItem('savedTabs', JSON.stringify(savedTabs));
    }
  });

  // Add the favicon, title, and link to the list item
  listItem.appendChild(faviconImg);
  listItem.appendChild(link);

  // Add event listener to open the tab when clicked on the title
  link.addEventListener('mousedown', function (event) {
    event.stopPropagation(); // Prevent the event from bubbling up
    chrome.tabs.create({ url: tab.url });
  });


  // add the edit button and delete button to the list item
  listItem.appendChild(editIcon);
  listItem.appendChild(deleteIcon);

  return listItem;
}

function moveTabUp(tab) {
  const currentIndex = savedTabs.indexOf(tab);
  if (currentIndex > 0) {
    const newIndex = currentIndex - 1;
    savedTabs.splice(currentIndex, 1); // Remove the tab from current position
    savedTabs.splice(newIndex, 0, tab); // Insert the tab at new position

    updateTabIndexes(); // Update the indexes of existing tabs
    localStorage.setItem('savedTabs', JSON.stringify(savedTabs));

    // Re-render the tabs list
    tabList.innerHTML = '';
    for (let tab of savedTabs) {
      const listItem = createListItem(tab);
      tabList.appendChild(listItem);
    }
  }
}

function moveTabDown(tab) {
  const currentIndex = savedTabs.indexOf(tab);
  if (currentIndex < savedTabs.length - 1) {
    const newIndex = currentIndex + 1;
    savedTabs.splice(currentIndex, 1); // Remove the tab from current position
    savedTabs.splice(newIndex, 0, tab); // Insert the tab at new position

    updateTabIndexes(); // Update the indexes of existing tabs
    localStorage.setItem('savedTabs', JSON.stringify(savedTabs));

    // Re-render the tabs list
    tabList.innerHTML = '';
    for (let tab of savedTabs) {
      const listItem = createListItem(tab);
      tabList.appendChild(listItem);
    }
  }
}

// Attach event listeners to buttons and render saved tabs
saveCurrentBtn.addEventListener('click', saveCurrentTab);
saveAllBtn.addEventListener('click', saveAllTabs);
searchInput.addEventListener('input', searchSavedTabs);
clearTabs.addEventListener('click', ClearTabs);
newFolder.addEventListener('click', CreateNewFolder);
viewFolders.addEventListener('click', ViewFolders);
renderSavedTabs();
