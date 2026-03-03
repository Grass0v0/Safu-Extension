document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const domain = urlParams.get('domain');
  const contentDiv = document.getElementById('content');

  contentDiv.innerHTML = `
    <h1>Domain Blocked</h1>
    <p>This domain has been blocked by the Domain Filter extension:</p>
    <div class="domain">${domain}</div>
  `;

  document.getElementById('go-back').addEventListener('click', function() {
    history.back();
  });
});

function goBack() {
  chrome.runtime.sendMessage({ action: 'goBack' });
} 