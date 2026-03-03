// Global variables
let blacklistedDomains = [];
let legitimateDomains = [];
let whitelistedDomains = new Set();
let previousUrls = new Map(); // Store previous URLs for each tab
let temporaryAllowedDomains = new Set(); // Temporary memory for allowed community domains

// Function to calculate Levenshtein distance
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }
  return dp[m][n];
}

// Function to detect phishing domains
function detectPhishing(domain) {
  console.log('Checking domain for phishing:', domain);
  const normalizedDomain = normalizeDomain(domain);
  console.log('Normalized domain:', normalizedDomain);
  
  // Check if domain is whitelisted
  if (whitelistedDomains.has(normalizedDomain)) {
    console.log('Domain is whitelisted:', normalizedDomain);
    return null;
  }

  console.log('Number of legitimate domains to check against:', legitimateDomains.length);
  for (const legitDomain of legitimateDomains) {
    const normalizedLegit = normalizeDomain(legitDomain);
    console.log('Comparing with legitimate domain:', normalizedLegit);
    
    // Skip if domains are identical
    if (normalizedDomain === normalizedLegit) {
      console.log('Domains are identical, skipping');
      continue;
    }

    // Calculate similarity
    const distance = levenshteinDistance(normalizedDomain, normalizedLegit);
    const maxLength = Math.max(normalizedDomain.length, normalizedLegit.length);
    const similarity = 1 - (distance / maxLength);
    console.log('Similarity score:', similarity);

    // If similarity is high (>0.85) but domains are not identical, it might be a phishing attempt
    if (similarity > 0.75) {
      console.log('Potential phishing detected! Similarity:', similarity);
      return {
        suspiciousDomain: domain,
        legitimateDomain: legitDomain,
        similarity: similarity
      };
    }
  }
  console.log('No phishing detected for domain:', domain);
  return null;
}

// Function to load legitimate domains
async function loadLegitimateDomains() {
  try {
    console.log('Attempting to load legitimate domains from:', 'http://<domain>.com:86/whitelist.json');
    const response = await fetch('http://<domain>.com:86/whitelist.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Raw whitelist data received:', data);
    legitimateDomains = Array.isArray(data) ? data : [];
    console.log('Legitimate domains loaded:', legitimateDomains.length);
    console.log('Sample legitimate domains:', legitimateDomains.slice(0, 5));
  } catch (error) {
    console.error('Error loading legitimate domains:', error);
    console.error('Error details:', error.message);
  }
}

// Function to load blacklist
async function loadBlacklist() {
  try {
    console.log('Loading blacklist...');
    const response = await fetch('https://raw.githubusercontent.com/scamsniffer/scam-database/main/blacklist/domains.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    blacklistedDomains = data;
    console.log('Blacklist loaded successfully:', blacklistedDomains.length, 'domains');
    console.log('Sample domains:', blacklistedDomains.slice(0, 5));
  } catch (error) {
    console.error('Error loading blacklist:', error);
  }
}

// Function to normalize domain
function normalizeDomain(domain) {
  return domain.toLowerCase().replace(/^www\./, '');
}

// Function to check if a domain is blacklisted
function isBlacklisted(testDomain) {
  const normalizedTestDomain = normalizeDomain(testDomain);
  console.log('Checking domain:', normalizedTestDomain);
  
  for (const blockedDomain of blacklistedDomains) {
    const normalizedBlockedDomain = normalizeDomain(blockedDomain);
    
    if (normalizedTestDomain === normalizedBlockedDomain ||
        normalizedTestDomain.endsWith('.' + normalizedBlockedDomain)) {
      console.log('Match found! Domain is blacklisted:', normalizedTestDomain);
      return true;
    }
  }
  
  console.log('Domain is not blacklisted:', normalizedTestDomain);
  return false;
}

// Function to check if a domain is reported by community
async function checkCommunityReports(domain) {
  try {
    const normalizedDomain = normalizeDomain(domain);
    // First check if domain is in temporary allowed list
    if (temporaryAllowedDomains.has(normalizedDomain)) {
      return null;
    }

    const response = await fetch('http://<domain>.com:85/api/domains');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    if (data.domains && data.domains[normalizedDomain]) {
      return {
        reportCount: data.domains[normalizedDomain],
        domain: normalizedDomain
      };
    }
    return null;
  } catch (error) {
    console.error('Error checking community reports:', error);
    return null;
  }
}

// Modify the navigation monitoring
function setupNavigationMonitoring() {
  console.log('Setting up navigation monitoring...');
  
  chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    console.log('Navigation detected:', details.url);
    
    if (details.frameId !== 0) {
      console.log('Skipping non-main frame navigation');
      return;
    }

    try {
      const { 
        domainFilterEnabled, 
        phishingProtectionEnabled,
        communityDefenseEnabled 
      } = await chrome.storage.sync.get({ 
        domainFilterEnabled: true,
        phishingProtectionEnabled: true,
        communityDefenseEnabled: true
      });

      const url = new URL(details.url);
      
      if (url.protocol === 'chrome:' || url.protocol === 'chrome-extension:') {
        console.log('Skipping browser internal page');
        return;
      }

      const domain = url.hostname;
      console.log('Processing navigation to domain:', domain);

      // Store the current URL before any blocking occurs
      previousUrls.set(details.tabId, details.url);

      // Check community reports if community defense is enabled
      if (communityDefenseEnabled) {
        const communityReport = await checkCommunityReports(domain);
        if (communityReport) {
          console.log('Domain reported by community:', communityReport);
          const blockUrl = chrome.runtime.getURL('community_blocked.html') + 
            '?domain=' + encodeURIComponent(domain) + 
            '&reportCount=' + encodeURIComponent(communityReport.reportCount);
          await chrome.tabs.update(details.tabId, { url: blockUrl });
          return;
        }
      }

      // Check blacklist only if domain filter is enabled
      if (domainFilterEnabled) {
        if (blacklistedDomains.length === 0) {
          console.log('Reloading blacklist...');
          await loadBlacklist();
        }

        if (isBlacklisted(domain)) {
          console.log('Blocking navigation to blacklisted domain:', domain);
          const blockUrl = chrome.runtime.getURL('blocked.html') + '?domain=' + encodeURIComponent(domain);
          await chrome.tabs.update(details.tabId, { url: blockUrl });
          return;
        }
      }

      // Check for phishing only if phishing protection is enabled
      if (phishingProtectionEnabled) {
        if (legitimateDomains.length === 0) {
          console.log('Loading legitimate domains...');
          await loadLegitimateDomains();
        }

        const phishingResult = detectPhishing(domain);
        if (phishingResult) {
          console.log('Potential phishing detected:', phishingResult);
          const phishingUrl = chrome.runtime.getURL('phishing.html') + 
            '?domain=' + encodeURIComponent(domain) + 
            '&legitimate=' + encodeURIComponent(phishingResult.legitimateDomain);
          await chrome.tabs.update(details.tabId, { url: phishingUrl });
        }
      }
    } catch (error) {
      console.error('Error processing navigation:', error);
    }
  });
}

// Initialize everything
async function initialize() {
  console.log('Initializing extension...');
  await Promise.all([
    loadBlacklist(),
    loadLegitimateDomains()
  ]);
  console.log('Initial load complete');
}

// Update message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'resetExtension') {
    resetExtension();
  } else if (message.action === 'goBack' && sender.tab) {
    const previousUrl = previousUrls.get(sender.tab.id);
    if (previousUrl) {
      chrome.tabs.get(sender.tab.id, (tab) => {
        chrome.tabs.create({
          url: previousUrl,
          index: tab.index,
          active: true
        }, () => {
          chrome.tabs.remove(sender.tab.id);
        });
      });
    } else {
      chrome.tabs.remove(sender.tab.id);
    }
  } else if (message.action === 'addToWhitelist') {
    whitelistedDomains.add(normalizeDomain(message.domain));
    chrome.storage.sync.set({ whitelistedDomains: Array.from(whitelistedDomains) });
  } else if (message.action === 'removeFromWhitelist') {
    whitelistedDomains.delete(normalizeDomain(message.domain));
    chrome.storage.sync.set({ whitelistedDomains: Array.from(whitelistedDomains) });
  } else if (message.action === 'allowDomain') {
    // Add domain to temporary allowed list and allow access
    const normalizedDomain = normalizeDomain(message.domain);
    temporaryAllowedDomains.add(normalizedDomain);
    console.log('Added to temporary allowed list:', normalizedDomain);
    
    if (sender.tab) {
      chrome.tabs.update(sender.tab.id, { url: 'http://' + message.domain });
    }
    sendResponse({ success: true });
  }
  return true; // Required for async response
});

// Load whitelist from storage during initialization
chrome.storage.sync.get({ whitelistedDomains: [] }, (result) => {
  whitelistedDomains = new Set(result.whitelistedDomains);
});

// Set up periodic blacklist refresh
function setupPeriodicRefresh() {
  console.log('Setting up periodic refresh...');
  setInterval(loadBlacklist, 3600000); // Refresh every hour
}

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed or updated');
  initialize();
});

// Add this new function to reset the extension state
async function resetExtension() {
  console.log('Resetting extension state...');
  blacklistedDomains = [];
  await loadBlacklist();
  console.log('Extension reset complete');
}

// Clean up previousUrls when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  previousUrls.delete(tabId);
});

// Initialize everything
initialize();
setupNavigationMonitoring();
setupPeriodicRefresh();

// Final loading confirmation
console.log('Background script setup complete');