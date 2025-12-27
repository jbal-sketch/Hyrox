// Vercel Serverless Function to parse HyResult URLs
// Fetches and parses race data from hyresult.com

const https = require('https');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Validate URL is from hyresult.com
        if (!url.includes('hyresult.com/result/')) {
            return res.status(400).json({ error: 'Invalid HyResult URL' });
        }

        // Fetch the page
        const html = await fetchPage(url);
        
        // Parse the data
        const raceData = parseHyResultPage(html);

        return res.status(200).json({
            success: true,
            data: raceData
        });

    } catch (error) {
        console.error('HyResult Parse Error:', error);
        return res.status(500).json({
            error: 'Failed to parse HyResult page',
            message: error.message
        });
    }
};

/**
 * Fetch HTML page
 */
function fetchPage(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve(data);
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

/**
 * Parse HyResult page HTML to extract race data
 */
function parseHyResultPage(html) {
    const data = {
        totalTime: null,
        stationTimes: {},
        transitions: [],
        splits: []
    };

    const rows = [];
    
    // Try multiple parsing strategies
    
    // Strategy 1: Parse HTML table structure
    const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
    if (tableMatch) {
        const tableHTML = tableMatch[1];
        // Parse table rows
        const trPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let trMatch;
        
        while ((trMatch = trPattern.exec(tableHTML)) !== null) {
            const rowHTML = trMatch[1];
            const tdPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
            const cells = [];
            let tdMatch;
            
            while ((tdMatch = tdPattern.exec(rowHTML)) !== null) {
                let cellText = tdMatch[1].trim();
                // Remove HTML tags
                cellText = cellText.replace(/<[^>]+>/g, '').trim();
                cells.push(cellText);
            }
            
            if (cells.length >= 4 && cells[0] !== 'Split') { // Skip header row
                rows.push({
                    split: cells[0],
                    timeOfDay: cells[1],
                    cumulativeTime: cells[2],
                    diff: cells[3]
                });
            }
        }
    }
    
    // Strategy 2: If table parsing didn't work, try markdown-style table format
    if (rows.length === 0) {
        const markdownTablePattern = /\|\s*([^|]+?)\s*\|\s*(\d{2}:\d{2}:\d{2})\s*\|\s*([\d:]+)\s*\|\s*([\d:]+)\s*\|/g;
        let match;
        
        while ((match = markdownTablePattern.exec(html)) !== null) {
            const splitName = match[1].trim().replace(/<[^>]+>/g, '');
            // Skip header rows
            if (splitName.toLowerCase().includes('split') || splitName.toLowerCase().includes('time of day')) {
                continue;
            }
            
            rows.push({
                split: splitName,
                timeOfDay: match[2],
                cumulativeTime: match[3],
                diff: match[4]
            });
        }
    }
    
    // Strategy 3: Look for JSON data in the page (some sites embed data)
    if (rows.length === 0) {
        const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/);
        if (jsonMatch) {
            try {
                const pageData = JSON.parse(jsonMatch[1]);
                // Try to extract splits from JSON structure
                // This would depend on HyResult's actual data structure
            } catch (e) {
                // JSON parsing failed, continue
            }
        }
    }

    // Process rows to extract station times
    // Calculate station times from "In" to "Out" entries
    let previousCumulative = 0;
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const splitName = row.split.toLowerCase().trim();
        const diffSeconds = parseTimeToSeconds(row.diff);
        const cumulativeSeconds = parseTimeToSeconds(row.cumulativeTime);

        // Skip empty or invalid rows
        if (!splitName) continue;

        // Calculate time difference from previous row if diff is not available or seems wrong
        let stationTime = diffSeconds;
        if (stationTime === 0 && cumulativeSeconds > previousCumulative) {
            stationTime = cumulativeSeconds - previousCumulative;
        }
        previousCumulative = cumulativeSeconds;

        // Map station names to our format - look for "Out" entries which indicate station completion
        // Format examples: "SkiErg Out", "Sled Push Out", "Burpee Broad Jump Out"
        
        if (splitName.includes('ski') && splitName.includes('erg')) {
            if (splitName.includes('out') && !splitName.includes('in')) {
                data.stationTimes.skiErg = stationTime;
            }
        } else if (splitName.includes('sled') && splitName.includes('push')) {
            if (splitName.includes('out') && !splitName.includes('in')) {
                data.stationTimes.sledPush = stationTime;
            }
        } else if (splitName.includes('sled') && splitName.includes('pull')) {
            if (splitName.includes('out') && !splitName.includes('in')) {
                data.stationTimes.sledPull = stationTime;
            }
        } else if (splitName.includes('burpee') || (splitName.includes('broad') && splitName.includes('jump'))) {
            if (splitName.includes('out') && !splitName.includes('in')) {
                data.stationTimes.burpee = stationTime;
            }
        } else if (splitName.includes('row') && !splitName.includes('rox') && !splitName.includes('zone')) {
            if (splitName.includes('out') && !splitName.includes('in')) {
                data.stationTimes.row = stationTime;
            }
        } else if (splitName.includes('farmers') || (splitName.includes('carry') && !splitName.includes('sandbag'))) {
            if (splitName.includes('out') && !splitName.includes('in')) {
                data.stationTimes.farmers = stationTime;
            }
        } else if (splitName.includes('lunge') || splitName.includes('sandbag')) {
            if (splitName.includes('out') && !splitName.includes('in')) {
                data.stationTimes.lunges = stationTime;
            }
        } else if (splitName.includes('wall') && splitName.includes('ball')) {
            // Wall balls - use diff if available, or calculate from previous
            if (splitName.includes('out') || (!splitName.includes('in') && stationTime > 0)) {
                data.stationTimes.wallBalls = stationTime;
            }
        } else if (splitName.includes('total') || (splitName.includes('time') && i === rows.length - 1)) {
            data.totalTime = cumulativeSeconds;
        }
    }
    
    // Fallback: If we didn't find some stations, try alternative matching
    // Sometimes the format is slightly different
    if (!data.stationTimes.skiErg || !data.stationTimes.sledPush || !data.stationTimes.sledPull) {
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const splitName = row.split.toLowerCase().trim();
            const diffSeconds = parseTimeToSeconds(row.diff);
            
            if (diffSeconds === 0) continue;
            
            // More flexible matching
            if (!data.stationTimes.skiErg && splitName.includes('ski') && splitName.includes('erg') && splitName.includes('out')) {
                data.stationTimes.skiErg = diffSeconds;
            }
            if (!data.stationTimes.sledPush && splitName.includes('sled') && splitName.includes('push') && splitName.includes('out')) {
                data.stationTimes.sledPush = diffSeconds;
            }
            if (!data.stationTimes.sledPull && splitName.includes('sled') && splitName.includes('pull') && splitName.includes('out')) {
                data.stationTimes.sledPull = diffSeconds;
            }
            if (!data.stationTimes.burpee && (splitName.includes('burpee') || (splitName.includes('broad') && splitName.includes('jump'))) && splitName.includes('out')) {
                data.stationTimes.burpee = diffSeconds;
            }
            if (!data.stationTimes.row && splitName.includes('row') && !splitName.includes('rox') && splitName.includes('out')) {
                data.stationTimes.row = diffSeconds;
            }
            if (!data.stationTimes.farmers && (splitName.includes('farmers') || splitName.includes('carry')) && !splitName.includes('sandbag') && splitName.includes('out')) {
                data.stationTimes.farmers = diffSeconds;
            }
            if (!data.stationTimes.lunges && (splitName.includes('lunge') || splitName.includes('sandbag')) && splitName.includes('out')) {
                data.stationTimes.lunges = diffSeconds;
            }
            if (!data.stationTimes.wallBalls && splitName.includes('wall') && splitName.includes('ball')) {
                data.stationTimes.wallBalls = diffSeconds;
            }
        }
    }

    return data;
}

/**
 * Parse time string to seconds
 * Handles formats like "1:40:32", "04:12", "05:15"
 */
function parseTimeToSeconds(timeStr) {
    if (!timeStr) return 0;
    
    const parts = timeStr.trim().split(':');
    
    if (parts.length === 3) {
        // HH:MM:SS
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseInt(parts[2]) || 0;
        return hours * 3600 + minutes * 60 + seconds;
    } else if (parts.length === 2) {
        // MM:SS
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;
        return minutes * 60 + seconds;
    }
    
    return 0;
}

