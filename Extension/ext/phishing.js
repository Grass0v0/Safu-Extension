document.addEventListener('DOMContentLoaded', function() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const suspiciousDomain = urlParams.get('domain');
    const legitimateDomain = urlParams.get('legitimate');

    // Display the domains
    document.getElementById('suspicious-domain').textContent = suspiciousDomain;
    document.getElementById('legitimate-domain').textContent = legitimateDomain;

    // Handle button clicks
    document.getElementById('goto-legitimate').addEventListener('click', function() {
        // Add protocol if not present
        const url = legitimateDomain.startsWith('http') ? legitimateDomain : `https://${legitimateDomain}`;
        window.location.href = url;
    });

    document.getElementById('go-back').addEventListener('click', function() {
        window.history.back();
    });
}); 