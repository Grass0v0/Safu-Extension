document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const domain = params.get('domain');
    const reportCount = params.get('reportCount');
    
    document.getElementById('blocked-domain').textContent = domain;
    document.getElementById('report-count').textContent = reportCount;

    document.getElementById('back-btn').addEventListener('click', function() {
        history.back();    });

    document.getElementById('continue-btn').addEventListener('click', function() {
        chrome.runtime.sendMessage({
            action: 'allowDomain',
            domain: domain
        }, function(response) {
            if (response && response.success) {
                window.location.href = 'http://' + domain;
            }
        });
    });
}); 

