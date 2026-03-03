let blacklistedDomains = [];
let whitelistedDomains = [];
let filteredWhitelistedDomains = [];
const ITEMS_PER_PAGE = 100; // Number of items to show per page
let currentPage = 1;
let filteredDomains = [];
let currentSection = 'blacklist';

// Make changePage function global
window.changePage = function(newPage) {
  currentPage = newPage;
  if (currentSection === 'blacklist') {
    renderDomainsWithPagination(filteredDomains, 'domains-list');
  } else if (currentSection === 'phishing-protection') {
    renderDomainsWithPagination(filteredWhitelistedDomains, 'whitelist-domains');
  }
  updatePaginationControls();
}

async function loadBlacklist() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/scamsniffer/scam-database/refs/heads/main/blacklist/domains.json');
    blacklistedDomains = await response.json();
    filteredDomains = blacklistedDomains;
    renderDomainsWithPagination(filteredDomains, 'domains-list');
    updatePaginationControls();
  } catch (error) {
    console.error('Error loading blacklist:', error);
    document.getElementById('domains-list').innerHTML = 'Error loading blacklist';
  }
}

async function loadWhitelist() {
  try {
    const response = await fetch('http://<domain>.com:86/whitelist.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    whitelistedDomains = Array.isArray(data) ? data : [];
    filteredWhitelistedDomains = [...whitelistedDomains];
    console.log('Loaded whitelisted domains:', whitelistedDomains);
    renderDomainsWithPagination(filteredWhitelistedDomains, 'whitelist-domains');
    updatePaginationControls();
  } catch (error) {
    console.error('Error loading whitelist:', error);
    document.getElementById('whitelist-domains').innerHTML = 'Error loading whitelist';
  }
}

function renderDomainsWithPagination(domains, containerId) {
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const domainsToShow = domains.slice(startIndex, endIndex);
  
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }
  
  // Use DocumentFragment for better performance
  const fragment = document.createDocumentFragment();
  
  if (domainsToShow.length === 0) {
    const div = document.createElement('div');
    div.className = 'domain-item';
    div.textContent = 'No domains found';
    fragment.appendChild(div);
  } else {
    domainsToShow.forEach(domain => {
      const div = document.createElement('div');
      div.className = 'domain-item';
      div.textContent = domain;
      fragment.appendChild(div);
    });
  }
  
  container.innerHTML = '';
  container.appendChild(fragment);
}

function updatePaginationControls() {
  const domains = currentSection === 'blacklist' ? filteredDomains : filteredWhitelistedDomains;
  const totalPages = Math.ceil(domains.length / ITEMS_PER_PAGE);
  const paginationContainer = document.getElementById(currentSection === 'blacklist' ? 'pagination' : 'whitelist-pagination');
  
  if (!paginationContainer) {
    console.error('Pagination container not found');
    return;
  }

  const prevButton = document.createElement('button');
  prevButton.textContent = 'Previous';
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener('click', () => changePage(currentPage - 1));

  const pageInfo = document.createElement('span');
  pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;

  const nextButton = document.createElement('button');
  nextButton.textContent = 'Next';
  nextButton.disabled = currentPage === totalPages || totalPages === 0;
  nextButton.addEventListener('click', () => changePage(currentPage + 1));

  paginationContainer.innerHTML = '';
  paginationContainer.appendChild(prevButton);
  paginationContainer.appendChild(pageInfo);
  paginationContainer.appendChild(nextButton);
}

function setupSearch() {
  const searchInput = document.getElementById('search-input');
  const whitelistSearch = document.getElementById('whitelist-search');
  let debounceTimeout;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      const searchTerm = e.target.value.toLowerCase();
      filteredDomains = blacklistedDomains.filter(domain =>
        domain.toLowerCase().includes(searchTerm)
      );
      currentPage = 1;
      renderDomainsWithPagination(filteredDomains, 'domains-list');
      updatePaginationControls();
    }, 300);
  });

  whitelistSearch.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      const searchTerm = e.target.value.toLowerCase();
      filteredWhitelistedDomains = whitelistedDomains.filter(domain =>
        domain.toLowerCase().includes(searchTerm)
      );
      currentPage = 1;
      renderDomainsWithPagination(filteredWhitelistedDomains, 'whitelist-domains');
      updatePaginationControls();
    }, 300);
  });
}

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
      });
      
      item.classList.add('active');
      currentSection = item.dataset.section;
      currentPage = 1;
      
      const sectionId = `${currentSection}-section`;
      document.getElementById(sectionId).classList.add('active');
      
      if (currentSection === 'phishing-protection') {
        loadWhitelist();
      } else if (currentSection === 'blacklist') {
        loadBlacklist();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  loadBlacklist();
  setupSearch();
  setupNavigation();
});

// Add Community Defense functionality
function loadReportedDomains() {
  fetch('http://<domain>.com:85/api/domains')
    .then(response => response.json())
    .then(data => {
      const domainsList = document.getElementById('reported-domains-list');
      if (data.domains && Object.keys(data.domains).length > 0) {
        domainsList.innerHTML = '';
        Object.entries(data.domains)
          .sort((a, b) => b[1] - a[1]) // Sort by report count descending
          .forEach(([domain, count]) => {
            const domainItem = document.createElement('div');
            domainItem.className = 'domain-item';
            domainItem.innerHTML = `
              <span class="domain-name">${domain}</span>
              <span class="report-count">${count} reports</span>
            `;
            domainsList.appendChild(domainItem);
          });
      } else {
        domainsList.innerHTML = '<p>No reported domains yet.</p>';
      }
    })
    .catch(error => {
      console.error('Error loading reported domains:', error);
      document.getElementById('reported-domains-list').innerHTML = 
        '<p>Error loading reported domains. Please try again later.</p>';
    });
}

// Domain validation function
function validateDomain(domain) {
  if (!domain) {
    return { isValid: false, error: "Domain name cannot be empty." };
  }

  if (domain.length > 253) {
    return { isValid: false, error: "Domain name cannot exceed 253 characters." };
  }

  // Check for invalid characters
  if (/[~!@#$%^&*()+={}[\]|\\:;"'<>,?/\s]/.test(domain)) {
    return { isValid: false, error: "Domain contains invalid characters. Only letters, numbers, and hyphens are allowed." };
  }

  // Check for at least one dot
  if (!domain.includes('.')) {
    return { isValid: false, error: "Domain must contain at least one dot (e.g., example.com)." };
  }

  // Split domain into labels
  const labels = domain.split('.');
  const tld = labels[labels.length - 1];

  // Check TLD
  if (tld.length < 2) {
    return { isValid: false, error: "Invalid or missing top-level domain." };
  }

  // Check each label
  for (const label of labels) {
    if (label.length > 63) {
      return { isValid: false, error: "Each part of the domain must be less than 64 characters." };
    }
    if (label.startsWith('-') || label.endsWith('-')) {
      return { isValid: false, error: "Hyphens cannot be at the start or end of a label." };
    }
    if (/_/.test(label)) {
      return { isValid: false, error: "Underscores are not allowed in domain names." };
    }
  }

  // Check if it's an IP address
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
    return { isValid: false, error: "IP addresses are not allowed." };
  }

  return { isValid: true };
}

// Show notification function
function showNotification(message, isError = false) {
  const notification = document.createElement('div');
  notification.className = `notification ${isError ? 'error' : 'success'}`;
  notification.textContent = message;

  // Remove any existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(n => n.remove());

  // Add the new notification
  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(() => notification.classList.add('show'), 10);

  // Remove notification after 5 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Update the domain reporting handler
document.getElementById('submit-report')?.addEventListener('click', function() {
  const domainInput = document.getElementById('report-domain');
  const domain = domainInput.value.trim().toLowerCase();
  
  const validation = validateDomain(domain);
  if (!validation.isValid) {
    showNotification(validation.error, true);
    return;
  }

  fetch('http://<domain>.com:85/api/domain', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ domain: domain })
  })
    .then(response => response.json())
    .then(data => {
      showNotification('Domain reported successfully!');
      domainInput.value = '';
      loadReportedDomains(); // Refresh the list
    })
    .catch(error => {
      console.error('Error reporting domain:', error);
      showNotification('Error reporting domain. Please try again later.', true);
    });
});

// Load reported domains when the community defense section is shown
document.querySelector('[data-section="community-defense"]')?.addEventListener('click', function() {
  loadReportedDomains();
});

// Initial load if community defense section is active
if (document.querySelector('#community-defense-section.active')) {
  loadReportedDomains();
}