// CSV Parser for Hyrox Results
// Parses CSV files exported from Hyrox website and populates form fields

function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = document.getElementById('csvFileName');
    const statusDiv = document.getElementById('csvUploadStatus');
    
    fileName.textContent = `Selected: ${file.name}`;
    statusDiv.innerHTML = '<p style="color: #666;">Processing CSV file...</p>';

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csvText = e.target.result;
            const parsedData = parseHyroxCSV(csvText);
            
            if (parsedData.success) {
                populateFormFields(parsedData.data);
                statusDiv.innerHTML = '<div class="csv-success">✓ CSV file processed successfully! Form fields have been populated.</div>';
            } else {
                statusDiv.innerHTML = `<div class="csv-error">✗ Error: ${parsedData.error}</div>`;
            }
        } catch (error) {
            statusDiv.innerHTML = `<div class="csv-error">✗ Error parsing CSV: ${error.message}</div>`;
        }
    };
    
    reader.onerror = function() {
        statusDiv.innerHTML = '<div class="csv-error">✗ Error reading file. Please try again.</div>';
    };
    
    reader.readAsText(file);
}

function parseHyroxCSV(csvText) {
    try {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            return { success: false, error: 'CSV file appears to be empty or invalid' };
        }

        // Parse header row
        const headers = parseCSVLine(lines[0]);
        const headerMap = {};
        headers.forEach((header, index) => {
            headerMap[header.toLowerCase().trim()] = index;
        });

        // Find required columns
        const splitIndex = headerMap['split'] !== undefined ? headerMap['split'] : 
                         headerMap['station'] !== undefined ? headerMap['station'] : -1;
        const diffIndex = headerMap['diff'] !== undefined ? headerMap['diff'] : 
                         headerMap['time'] !== undefined ? headerMap['time'] : -1;
        const timeIndex = headerMap['time'] !== undefined ? headerMap['time'] : -1;

        if (splitIndex === -1) {
            return { success: false, error: 'Could not find "Split" or "Station" column in CSV' };
        }

        // Parse data rows
        const stationData = {};
        let totalTime = null;
        let previousTime = null;
        let wallBallsEntryTime = null; // Track wall balls entry time to calculate duration

        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);
            if (row.length === 0) continue;

            const splitName = row[splitIndex] ? row[splitIndex].trim().toLowerCase() : '';
            
            // Extract station times
            let timeValue = null;
            let diffValue = null;
            
            // Try to get time from Diff column first (this is the station duration)
            if (diffIndex !== -1 && row[diffIndex]) {
                diffValue = parseTimeString(row[diffIndex]);
            }
            
            // Also get cumulative time from Time column
            if (timeIndex !== -1 && row[timeIndex]) {
                timeValue = parseTimeString(row[timeIndex]);
            }

            // Calculate station time from difference or from previous time
            let stationTime = diffValue;
            if (!stationTime && previousTime && timeValue) {
                stationTime = timeValue - previousTime;
            }

            // Check for "Total Time" first to handle wall balls calculation
            if (splitName.includes('total') && (splitName.includes('time') || splitName.includes('finish'))) {
                // This is the total race time
                if (timeValue) {
                    totalTime = timeValue;
                    // If we have wall balls entry time but haven't captured wall balls station time yet,
                    // calculate it as the difference between total time and wall balls entry time
                    if (wallBallsEntryTime && !stationData.wallBalls) {
                        stationData.wallBalls = timeValue - wallBallsEntryTime;
                    }
                }
                previousTime = timeValue;
            }
            // Map station names to our form fields
            // Look for "Out" entries which indicate completion of a station
            else if (splitName.includes('ski') && (splitName.includes('erg') || splitName.includes('erg'))) {
                if (splitName.includes('out') || splitName.includes('1000m')) {
                    if (stationTime) stationData.skiErg = stationTime;
                }
                previousTime = timeValue;
            } else if (splitName.includes('sled') && splitName.includes('push')) {
                if (splitName.includes('out') || splitName.includes('50m')) {
                    if (stationTime) stationData.sledPush = stationTime;
                }
                previousTime = timeValue;
            } else if (splitName.includes('sled') && splitName.includes('pull')) {
                if (splitName.includes('out') || splitName.includes('50m')) {
                    if (stationTime) stationData.sledPull = stationTime;
                }
                previousTime = timeValue;
            } else if (splitName.includes('burpee') || (splitName.includes('broad') && splitName.includes('jump'))) {
                if (splitName.includes('out') || splitName.includes('80m')) {
                    if (stationTime) stationData.burpee = stationTime;
                }
                previousTime = timeValue;
            } else if (splitName.includes('row') && !splitName.includes('rox') && !splitName.includes('in')) {
                if (splitName.includes('out') || splitName.includes('1000m')) {
                    if (stationTime) stationData.row = stationTime;
                }
                previousTime = timeValue;
            } else if (splitName.includes('farmers') || (splitName.includes('carry') && !splitName.includes('sandbag'))) {
                if (splitName.includes('out') || splitName.includes('200m')) {
                    if (stationTime) stationData.farmers = stationTime;
                }
                previousTime = timeValue;
            } else if (splitName.includes('lunge') || splitName.includes('sandbag')) {
                if (splitName.includes('out') || splitName.includes('100m')) {
                    if (stationTime) stationData.lunges = stationTime;
                }
                previousTime = timeValue;
            } else if (splitName.includes('wall') && splitName.includes('ball')) {
                // Track wall balls entry time - it may not have 'out' in the name
                if (timeValue) {
                    wallBallsEntryTime = timeValue;
                }
                // If we have a direct station time (from diff or calculation), use it
                if (stationTime) {
                    stationData.wallBalls = stationTime;
                } else if (splitName.includes('out') || splitName.includes('100')) {
                    // Fallback: if it has 'out' or '100', try to use calculated time
                    if (previousTime && timeValue) {
                        stationData.wallBalls = timeValue - previousTime;
                    }
                }
                previousTime = timeValue;
            } else {
                // For any other row, just update previousTime
                previousTime = timeValue;
            }
        }

        // If we found a total time, use it for current race time
        if (totalTime) {
            stationData.totalTime = totalTime;
        }

        return { success: true, data: stationData };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

function parseTimeString(timeStr) {
    if (!timeStr) return null;
    
    // Remove any whitespace
    timeStr = timeStr.trim();
    
    // Handle formats like "00:05:15", "5:15", "05:15", "315" (seconds)
    const parts = timeStr.split(':');
    
    if (parts.length === 3) {
        // HH:MM:SS format
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseInt(parts[2]) || 0;
        return hours * 3600 + minutes * 60 + seconds;
    } else if (parts.length === 2) {
        // MM:SS format
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;
        return minutes * 60 + seconds;
    } else {
        // Try to parse as total seconds
        const totalSeconds = parseInt(timeStr);
        if (!isNaN(totalSeconds)) {
            return totalSeconds;
        }
    }
    
    return null;
}

function populateFormFields(data) {
    // Populate station times
    if (data.skiErg) {
        const time = secondsToTime(data.skiErg);
        document.getElementById('skiErgMin').value = time.minutes;
        document.getElementById('skiErgSec').value = time.seconds;
    }
    
    if (data.sledPush) {
        const time = secondsToTime(data.sledPush);
        document.getElementById('sledPushMin').value = time.minutes;
        document.getElementById('sledPushSec').value = time.seconds;
    }
    
    if (data.sledPull) {
        const time = secondsToTime(data.sledPull);
        document.getElementById('sledPullMin').value = time.minutes;
        document.getElementById('sledPullSec').value = time.seconds;
    }
    
    if (data.burpee) {
        const time = secondsToTime(data.burpee);
        document.getElementById('burpeeMin').value = time.minutes;
        document.getElementById('burpeeSec').value = time.seconds;
    }
    
    if (data.row) {
        const time = secondsToTime(data.row);
        document.getElementById('rowMin').value = time.minutes;
        document.getElementById('rowSec').value = time.seconds;
    }
    
    if (data.farmers) {
        const time = secondsToTime(data.farmers);
        document.getElementById('farmersMin').value = time.minutes;
        document.getElementById('farmersSec').value = time.seconds;
    }
    
    if (data.lunges) {
        const time = secondsToTime(data.lunges);
        document.getElementById('lungesMin').value = time.minutes;
        document.getElementById('lungesSec').value = time.seconds;
    }
    
    if (data.wallBalls) {
        const time = secondsToTime(data.wallBalls);
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

