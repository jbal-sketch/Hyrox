// HyResult URL Parser
// Parses race data from hyresult.com URLs

async function parseHyResultUrl() {
    const urlInput = document.getElementById('hyresultUrl');
    const statusDiv = document.getElementById('hyresultStatus');
    const url = urlInput.value.trim();

    if (!url) {
        statusDiv.innerHTML = '<div class="csv-error">Please enter a HyResult URL</div>';
        return;
    }

    if (!url.includes('hyresult.com/result/')) {
        statusDiv.innerHTML = '<div class="csv-error">Invalid HyResult URL. Please use a URL like: https://www.hyresult.com/result/...</div>';
        return;
    }

    statusDiv.innerHTML = '<p style="color: #666;">Fetching and parsing HyResult data...</p>';

    try {
        // Get API endpoint from config
        const apiEndpoint = window.API_CONFIG?.endpoint?.replace('/api/generate-plan', '/api/parse-hyresult') || '/api/parse-hyresult';
        
        // Call backend API to parse the URL
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
            populateFormFromHyResult(result.data);
            statusDiv.innerHTML = '<div class="csv-success">✓ HyResult data parsed successfully! Form fields have been populated.</div>';
        } else {
            throw new Error(result.error || 'Failed to parse HyResult data');
        }
    } catch (error) {
        console.error('HyResult Parse Error:', error);
        statusDiv.innerHTML = `<div class="csv-error">✗ Error: ${error.message}</div>`;
    }
}

function populateFormFromHyResult(data) {
    // Populate station times
    if (data.stationTimes.skiErg) {
        const time = secondsToTime(data.stationTimes.skiErg);
        document.getElementById('skiErgMin').value = time.minutes;
        document.getElementById('skiErgSec').value = time.seconds;
    }
    
    if (data.stationTimes.sledPush) {
        const time = secondsToTime(data.stationTimes.sledPush);
        document.getElementById('sledPushMin').value = time.minutes;
        document.getElementById('sledPushSec').value = time.seconds;
    }
    
    if (data.stationTimes.sledPull) {
        const time = secondsToTime(data.stationTimes.sledPull);
        document.getElementById('sledPullMin').value = time.minutes;
        document.getElementById('sledPullSec').value = time.seconds;
    }
    
    if (data.stationTimes.burpee) {
        const time = secondsToTime(data.stationTimes.burpee);
        document.getElementById('burpeeMin').value = time.minutes;
        document.getElementById('burpeeSec').value = time.seconds;
    }
    
    if (data.stationTimes.row) {
        const time = secondsToTime(data.stationTimes.row);
        document.getElementById('rowMin').value = time.minutes;
        document.getElementById('rowSec').value = time.seconds;
    }
    
    if (data.stationTimes.farmers) {
        const time = secondsToTime(data.stationTimes.farmers);
        document.getElementById('farmersMin').value = time.minutes;
        document.getElementById('farmersSec').value = time.seconds;
    }
    
    if (data.stationTimes.lunges) {
        const time = secondsToTime(data.stationTimes.lunges);
        document.getElementById('lungesMin').value = time.minutes;
        document.getElementById('lungesSec').value = time.seconds;
    }
    
    if (data.stationTimes.wallBalls) {
        const time = secondsToTime(data.stationTimes.wallBalls);
        document.getElementById('wallBallsMin').value = time.minutes;
        document.getElementById('wallBallsSec').value = time.seconds;
    }
    
    // Populate total race time if found
    if (data.totalTime) {
        const time = secondsToTime(data.totalTime);
        const hours = Math.floor(time.minutes / 60);
        const mins = time.minutes % 60;
        document.getElementById('currentTimeHour').value = hours;
        document.getElementById('currentTimeMin').value = mins;
        document.getElementById('currentTimeSec').value = time.seconds;
    }
}

function secondsToTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return { minutes: minutes, seconds: secs };
}

// Make function available globally
window.parseHyResultUrl = parseHyResultUrl;

