// Plan Generator JavaScript
// Handles form submission and URL generation

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('planForm');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            generatePlan();
        });
    }

    // If we're on the plan page, load and display the plan
    if (window.location.pathname.includes('plan.html')) {
        loadPlanFromURL();
    }
});

async function generatePlan() {
    // Collect all form data
    const formData = {
        // Race info
        raceLocation: document.getElementById('raceLocation').value,
        raceDate: document.getElementById('raceDate').value,
        raceDivision: document.getElementById('raceDivision').value,
        ageGroup: document.getElementById('ageGroup').value || null,
        
        // Current performance
        currentTime: timeToSeconds(
            parseInt(document.getElementById('currentTimeHour').value || 0),
            parseInt(document.getElementById('currentTimeMin').value || 0),
            parseInt(document.getElementById('currentTimeSec').value || 0)
        ),
        current5K: timeToSeconds(
            0,
            parseInt(document.getElementById('current5KMin').value || 0),
            parseInt(document.getElementById('current5KSec').value || 0)
        ),
        
        // Target goals
        targetTime: timeToSeconds(
            parseInt(document.getElementById('targetTimeHour').value || 0),
            parseInt(document.getElementById('targetTimeMin').value || 0),
            parseInt(document.getElementById('targetTimeSec').value || 0)
        ),
        target5K: timeToSeconds(
            0,
            parseInt(document.getElementById('target5KMin').value || 0),
            parseInt(document.getElementById('target5KSec').value || 0)
        ),
        
        // Body composition
        currentWeight: parseFloat(document.getElementById('currentWeight').value),
        currentBodyFat: parseFloat(document.getElementById('currentBodyFat').value),
        targetWeight: document.getElementById('targetWeight').value ? parseFloat(document.getElementById('targetWeight').value) : null,
        targetBodyFat: document.getElementById('targetBodyFat').value ? parseFloat(document.getElementById('targetBodyFat').value) : null,
        
        // Station times
        stationTimes: {
            skiErg: timeToSeconds(
                0,
                parseInt(document.getElementById('skiErgMin').value || 0),
                parseInt(document.getElementById('skiErgSec').value || 0)
            ),
            sledPush: timeToSeconds(
                0,
                parseInt(document.getElementById('sledPushMin').value || 0),
                parseInt(document.getElementById('sledPushSec').value || 0)
            ),
            sledPull: timeToSeconds(
                0,
                parseInt(document.getElementById('sledPullMin').value || 0),
                parseInt(document.getElementById('sledPullSec').value || 0)
            ),
            burpee: timeToSeconds(
                0,
                parseInt(document.getElementById('burpeeMin').value || 0),
                parseInt(document.getElementById('burpeeSec').value || 0)
            ),
            row: timeToSeconds(
                0,
                parseInt(document.getElementById('rowMin').value || 0),
                parseInt(document.getElementById('rowSec').value || 0)
            ),
            farmers: timeToSeconds(
                0,
                parseInt(document.getElementById('farmersMin').value || 0),
                parseInt(document.getElementById('farmersSec').value || 0)
            ),
            lunges: timeToSeconds(
                0,
                parseInt(document.getElementById('lungesMin').value || 0),
                parseInt(document.getElementById('lungesSec').value || 0)
            ),
            wallBalls: timeToSeconds(
                0,
                parseInt(document.getElementById('wallBallsMin').value || 0),
                parseInt(document.getElementById('wallBallsSec').value || 0)
            )
        },
        
        // Training schedule
        runDays: parseInt(document.getElementById('runDays').value),
        strengthDays: parseInt(document.getElementById('strengthDays').value),
        gymDays: parseInt(document.getElementById('gymDays').value),
        
        // Equipment
        equipment: Array.from(document.querySelectorAll('input[name="equipment"]:checked')).map(cb => cb.value)
    };

    // Auto-calculate target 5K if not provided
    if (!formData.target5K && formData.current5K && formData.currentTime && formData.targetTime) {
        const timeImprovement = (formData.currentTime - formData.targetTime) / formData.currentTime;
        formData.target5K = Math.round(formData.current5K * (1 - timeImprovement * 0.3));
    }

    // Generate unique ID
    const planId = generatePlanId();
    
    // Store plan data in localStorage
    localStorage.setItem('hyrox_plan_' + planId, JSON.stringify(formData));
    
    // Generate training plan using LLM
    try {
        await generatePlanFromData(formData, planId);
    } catch (error) {
        console.error('Error generating plan:', error);
        handleAPIError(error, planId);
    }
}

async function generatePlanFromData(formData, planId) {
    // Calculate weeks until race
    const raceDate = new Date(formData.raceDate);
    const today = new Date();
    const weeksUntilRace = Math.ceil((raceDate - today) / (1000 * 60 * 60 * 24 * 7));
    
    // Get race weights
    const raceWeights = getRaceWeights(formData.raceDivision);
    
    // Calculate priorities
    const priorities = calculatePriorities(formData);
    
    // Build LLM prompt
    const prompt = buildLLMPrompt(formData, weeksUntilRace, priorities, raceWeights);
    
    // Call LLM API to generate plan
    const trainingPlanHTML = await callLLMAPI(prompt);
    
    // Store generated plan HTML
    localStorage.setItem('hyrox_plan_html_' + planId, trainingPlanHTML);
    
    // Hide loading state
    hideLoadingState();
    
    // Redirect to plan page
    const planURL = `plan.html?id=${planId}`;
    window.location.href = planURL;
}

function generatePlanId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function formatDivisionName(division) {
    return division
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace('Mens', "Men's")
        .replace('Womens', "Women's");
}

function timeToSeconds(hours, minutes, seconds) {
    if (arguments.length === 2) {
        // Backward compatibility: if only 2 args, treat as minutes and seconds
        return arguments[0] * 60 + arguments[1];
    }
    return hours * 3600 + minutes * 60 + seconds;
}

function secondsToTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return { minutes: mins, seconds: secs };
}

function formatTime(seconds) {
    if (!seconds) return 'N/A';
    const { minutes, seconds: secs } = secondsToTime(seconds);
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function loadPlanFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('id');
    
    if (!planId) {
        document.body.innerHTML = '<div class="container"><div class="card"><h2>Error</h2><p>No plan ID found. Please <a href="input.html">create a new plan</a>.</p></div></div>';
        return;
    }
    
    const planData = localStorage.getItem('hyrox_plan_' + planId);
    
    if (!planData) {
        document.body.innerHTML = '<div class="container"><div class="card"><h2>Error</h2><p>Plan not found. Please <a href="input.html">create a new plan</a>.</p></div></div>';
        return;
    }
    
    const data = JSON.parse(planData);
    displayPlan(data, planId);
}

function displayPlan(data, planId) {
    // Calculate weeks until race
    const raceDate = new Date(data.raceDate);
    const today = new Date();
    const weeksUntilRace = Math.ceil((raceDate - today) / (1000 * 60 * 60 * 24 * 7));
    
    // Calculate time to find
    const timeToFind = data.currentTime - data.targetTime;
    const timeToFindFormatted = formatTime(timeToFind);
    
    // Get race weights based on division
    const raceWeights = getRaceWeights(data.raceDivision);
    
    // Calculate priorities based on station times
    const priorities = calculatePriorities(data);
    
    // Check if we have a generated plan HTML
    const generatedPlanHTML = localStorage.getItem('hyrox_plan_html_' + planId);
    
    if (generatedPlanHTML) {
        // Display the LLM-generated plan
        const overviewHTML = generatePlanHTML(data, weeksUntilRace, timeToFindFormatted, raceWeights, priorities, planId);
        document.body.innerHTML = overviewHTML;
        
        // Insert the generated training plan into the content area
        const planContentDiv = document.getElementById('training-plan-content');
        if (planContentDiv) {
            planContentDiv.innerHTML = generatedPlanHTML;
        } else {
            // If div doesn't exist, append after overview sections
            const container = document.querySelector('.container');
            const planSection = document.createElement('div');
            planSection.id = 'training-plan-content';
            planSection.innerHTML = generatedPlanHTML;
            container.appendChild(planSection);
        }
    } else {
        // Fallback: Show overview only with message
        const html = generatePlanHTML(data, weeksUntilRace, timeToFindFormatted, raceWeights, priorities, planId);
        document.body.innerHTML = html;
        
        // Add message about plan generation
        const container = document.querySelector('.container');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'card';
        messageDiv.style.marginTop = '2rem';
        messageDiv.innerHTML = `
            <h2>Training Plan Generation</h2>
            <p>The detailed training plan is being generated. Please check back shortly or regenerate your plan.</p>
            <button onclick="window.location.href='input.html'" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                Regenerate Plan
            </button>
        `;
        container.appendChild(messageDiv);
    }
}

function getRaceWeights(division) {
    const weights = {
        'womens-open': {
            sledPush: 102,
            sledPull: 78,
            farmersCarry: 16,
            sandbagLunges: 10,
            wallBalls: 4
        },
        'mens-open': {
            sledPush: 102,
            sledPull: 78,
            farmersCarry: 24,
            sandbagLunges: 20,
            wallBalls: 6
        },
        'womens-pro': {
            sledPush: 102,
            sledPull: 78,
            farmersCarry: 24,
            sandbagLunges: 20,
            wallBalls: 6
        },
        'mens-pro': {
            sledPush: 102,
            sledPull: 78,
            farmersCarry: 32,
            sandbagLunges: 30,
            wallBalls: 9
        },
        'womens-doubles': {
            sledPush: 102,
            sledPull: 78,
            farmersCarry: 16,
            sandbagLunges: 10,
            wallBalls: 4
        },
        'mens-doubles': {
            sledPush: 102,
            sledPull: 78,
            farmersCarry: 24,
            sandbagLunges: 20,
            wallBalls: 6
        },
        'mixed-doubles': {
            sledPush: 102,
            sledPull: 78,
            farmersCarry: 20,
            sandbagLunges: 15,
            wallBalls: 5
        },
        'womens-pro-doubles': {
            sledPush: 102,
            sledPull: 78,
            farmersCarry: 24,
            sandbagLunges: 20,
            wallBalls: 6
        },
        'mens-pro-doubles': {
            sledPush: 102,
            sledPull: 78,
            farmersCarry: 32,
            sandbagLunges: 30,
            wallBalls: 9
        },
        'womens-relay': {
            sledPush: 102,
            sledPull: 78,
            farmersCarry: 16,
            sandbagLunges: 10,
            wallBalls: 4
        },
        'mens-relay': {
            sledPush: 102,
            sledPull: 78,
            farmersCarry: 24,
            sandbagLunges: 20,
            wallBalls: 6
        },
        'mixed-relay': {
            sledPush: 102,
            sledPull: 78,
            farmersCarry: 20,
            sandbagLunges: 15,
            wallBalls: 5
        },
        'womens-adaptive': {
            sledPush: 102,
            sledPull: 78,
            farmersCarry: 16,
            sandbagLunges: 10,
            wallBalls: 4
        },
        'mens-adaptive': {
            sledPush: 102,
            sledPull: 78,
            farmersCarry: 24,
            sandbagLunges: 20,
            wallBalls: 6
        }
    };
    return weights[division] || weights['womens-open'];
}

function calculatePriorities(data) {
    const priorities = [];
    const targets = {
        skiErg: 285, // 4:45
        sledPush: 150, // 2:30
        sledPull: 210, // 3:30
        burpee: 300, // 5:00
        row: 285, // 4:45
        farmers: 150, // 2:30
        lunges: 270, // 4:30
        wallBalls: 210 // 3:30
    };
    
    const stationNames = {
        skiErg: 'SkiErg',
        sledPush: 'Sled Push',
        sledPull: 'Sled Pull',
        burpee: 'Burpee Broad Jumps',
        row: 'Row',
        farmers: 'Farmers Carry',
        lunges: 'Sandbag Lunges',
        wallBalls: 'Wall Balls'
    };
    
    Object.keys(data.stationTimes).forEach(key => {
        const current = data.stationTimes[key];
        const target = targets[key];
        if (current > 0 && current > target) {
            const savings = current - target;
            priorities.push({
                name: stationNames[key],
                current: formatTime(current),
                target: formatTime(target),
                savings: formatTime(savings),
                savingsSeconds: savings
            });
        }
    });
    
    // Sort by savings (highest first)
    priorities.sort((a, b) => b.savingsSeconds - a.savingsSeconds);
    
    return priorities;
}

function generatePlanHTML(data, weeks, timeToFind, weights, priorities, planId) {
    const currentTimeFormatted = formatTime(data.currentTime);
    const targetTimeFormatted = formatTime(data.targetTime);
    const current5KFormatted = formatTime(data.current5K);
    const target5KFormatted = formatTime(data.target5K);
    
    return `
    <nav class="navbar">
        <div class="nav-container">
            <h1 class="logo">Hyrox Training Plan</h1>
            <ul class="nav-menu">
                <li><a href="index.html">Home</a></li>
                <li><a href="input.html">Create Plan</a></li>
                <li><a href="plan.html?id=${planId}" class="active">My Plan</a></li>
            </ul>
        </div>
    </nav>

    <main class="container">
        <header class="hero">
            <h1>${data.raceLocation} Hyrox</h1>
            <h2>${new Date(data.raceDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h2>
            <p class="subtitle">${formatDivisionName(data.raceDivision)}${data.ageGroup ? ` (${data.ageGroup})` : ''} - ${weeks}-Week Training Plan</p>
            <div style="margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.2); border-radius: 8px;">
                <p style="margin: 0.5rem 0;"><strong>Your Plan URL:</strong></p>
                <input type="text" value="${window.location.href}" readonly style="width: 100%; max-width: 600px; padding: 0.5rem; border-radius: 5px; font-size: 0.9rem;" id="planUrl">
                <button onclick="copyPlanUrl()" style="margin-top: 0.5rem; padding: 0.5rem 1.5rem; background: white; color: var(--primary-color); border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Copy URL</button>
            </div>
        </header>

        <section class="overview">
            <div class="card">
                <h2>Current Status</h2>
                <ul>
                    <li><strong>Current Time:</strong> ${currentTimeFormatted}</li>
                    <li><strong>Target Time:</strong> ${targetTimeFormatted}</li>
                    <li><strong>Time to Find:</strong> ${timeToFind}</li>
                    <li><strong>Current 5K:</strong> ${current5KFormatted}</li>
                    <li><strong>Target 5K:</strong> ${target5KFormatted}</li>
                </ul>
            </div>

            <div class="card">
                <h2>Training Schedule</h2>
                <ul>
                    <li><strong>Running Days:</strong> ${data.runDays}x per week</li>
                    <li><strong>Strength Days:</strong> ${data.strengthDays}x per week</li>
                    <li><strong>Gym/Hyrox Days:</strong> ${data.gymDays}x per week</li>
                    <li><strong>Rest Days:</strong> ${7 - data.runDays - data.strengthDays - data.gymDays}x per week</li>
                </ul>
            </div>

            ${data.targetWeight ? `
            <div class="card">
                <h2>Body Composition Goals</h2>
                <ul>
                    <li><strong>Current:</strong> ${data.currentWeight}kg, ${data.currentBodyFat}% body fat</li>
                    <li><strong>Target:</strong> ${data.targetWeight}kg, ${data.targetBodyFat || 'N/A'}% body fat</li>
                    <li><strong>Goal:</strong> Lose ${(data.currentWeight - data.targetWeight).toFixed(1)}kg</li>
                </ul>
            </div>
            ` : ''}
        </section>

        ${priorities.length > 0 ? `
        <section class="priorities">
            <h2>Key Training Priorities</h2>
            <div class="priority-grid">
                ${priorities.map((p, index) => `
                <div class="priority-item priority-${index + 1}">
                    <span class="priority-number">${index + 1}</span>
                    <h3>${p.name}</h3>
                    <p>${p.current} → ${p.target}</p>
                    <p class="savings">Save ${p.savings}</p>
                </div>
                `).join('')}
            </div>
        </section>
        ` : ''}

        <section class="race-weights">
            <h2>${formatDivisionName(data.raceDivision)}${data.ageGroup ? ` (${data.ageGroup})` : ''} Race Weights</h2>
            <div class="weights-grid">
                <div class="weight-item">
                    <h3>Sled Push</h3>
                    <p class="weight">${weights.sledPush}kg</p>
                    <p class="note">(including sled)</p>
                </div>
                <div class="weight-item">
                    <h3>Sled Pull</h3>
                    <p class="weight">${weights.sledPull}kg</p>
                    <p class="note">(including sled)</p>
                </div>
                <div class="weight-item">
                    <h3>Farmers Carry</h3>
                    <p class="weight">2 x ${weights.farmersCarry}kg</p>
                    <p class="note">${weights.farmersCarry * 2}kg total</p>
                </div>
                <div class="weight-item">
                    <h3>Sandbag Lunges</h3>
                    <p class="weight">${weights.sandbagLunges}kg</p>
                </div>
                <div class="weight-item">
                    <h3>Wall Balls</h3>
                    <p class="weight">${weights.wallBalls}kg</p>
                </div>
            </div>
        </section>

        <section class="card" style="margin-top: 2rem;">
            <h2>Training Plan Overview</h2>
            <p>Your personalized ${weeks}-week training plan is being generated. This plan is customized based on:</p>
            <ul style="margin-top: 1rem;">
                <li>Your current race time: ${currentTimeFormatted}</li>
                <li>Your target time: ${targetTimeFormatted}</li>
                <li>Your available equipment: ${data.equipment.join(', ')}</li>
                <li>Your training schedule: ${data.runDays} runs, ${data.strengthDays} strength, ${data.gymDays} gym sessions per week</li>
            </ul>
            <p style="margin-top: 1rem;"><strong>Note:</strong> Full detailed training plan coming soon. For now, use the <a href="training-plan.html">template training plan</a> as a guide.</p>
        </section>
    </main>

    <footer>
        <p>&copy; 2024 Hyrox Training Plan Generator</p>
    </footer>

    <script>
        function copyPlanUrl() {
            const urlInput = document.getElementById('planUrl');
            urlInput.select();
            urlInput.setSelectionRange(0, 99999);
            document.execCommand('copy');
            alert('Plan URL copied to clipboard!');
        }
    </script>
    `;
}

