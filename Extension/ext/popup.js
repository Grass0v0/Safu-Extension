document.addEventListener('DOMContentLoaded', function() {
  const domainFilterToggle = document.getElementById('extension-toggle');
  const phishingToggle = document.getElementById('phishing-toggle');
  const communityToggle = document.getElementById('community-toggle');
  const dashboardBtn = document.getElementById('dashboard-btn');

  // Load initial state
  chrome.storage.sync.get(
    ['domainFilterEnabled', 'phishingProtectionEnabled', 'communityDefenseEnabled'], 
    function(data) {
      domainFilterToggle.checked = data.domainFilterEnabled !== false; // Default to enabled
      phishingToggle.checked = data.phishingProtectionEnabled !== false; // Default to enabled
      communityToggle.checked = data.communityDefenseEnabled !== false; // Default to enabled
    }
  );

  // Toggle domain filter
  domainFilterToggle.addEventListener('change', function() {
    chrome.storage.sync.set({ domainFilterEnabled: domainFilterToggle.checked });
  });

  // Toggle phishing protection
  phishingToggle.addEventListener('change', function() {
    chrome.storage.sync.set({ phishingProtectionEnabled: phishingToggle.checked });
  });

  // Toggle community defense
  communityToggle.addEventListener('change', function() {
    chrome.storage.sync.set({ communityDefenseEnabled: communityToggle.checked });
  });

  // Open dashboard
  dashboardBtn.addEventListener('click', function() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard.html')
    });
  });
});