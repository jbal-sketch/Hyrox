// Prompt Builder for LLM Training Plan Generation
// Builds the LLM prompt from user form data

function formatDivisionName(division) {
    return division
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace('Mens', "Men's")
        .replace('Womens', "Women's");
}

function buildLLMPrompt(formData, weeksUntilRace, priorities, raceWeights) {
    // Helper function to format time
    const formatTime = (seconds) => {
        if (!seconds) return 'N/A';
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate phase weeks
    const foundationWeeks = Math.max(2, Math.floor(weeksUntilRace * 0.25));
    const buildStartWeek = foundationWeeks + 1;
    const buildEndWeek = Math.floor(weeksUntilRace * 0.6);
    const intensityStartWeek = buildEndWeek + 1;
    const intensityEndWeek = Math.floor(weeksUntilRace * 0.85);
    const peakStartWeek = intensityEndWeek + 1;
    const peakEndWeek = weeksUntilRace - 1;
    const taperWeek = weeksUntilRace;

    // Build priorities list
    const prioritiesList = priorities.length > 0 
        ? priorities.map((p, i) => `${i + 1}. **${p.name}** - Current: ${p.current}, Target: ${p.target}, Potential Savings: ${p.savings}`).join('\n')
        : 'No previous race data provided. Focus on building all-around fitness.';

    // Build priority training focus
    const priorityTrainingFocus = priorities.length > 0
        ? priorities.slice(0, 3).map(p => {
            let focus = '';
            if (p.name.includes('Wall Balls')) {
                focus = '- **Wall Balls:** Practice 2-3x per week. Work up to sets of 25-30 unbroken. Always practice after running to simulate race fatigue.';
            } else if (p.name.includes('Burpee')) {
                focus = '- **Burpee Broad Jumps:** Practice 3x per week at home. Focus on efficiency: chest-to-ground, explosive jump forward. Target: 3.1 sec/burpee.';
            } else if (p.name.includes('Sled Pull')) {
                focus = '- **Sled Pull:** Weekly practice at gym. Focus on powerful arm pulls, driving with legs. Find optimal weight.';
            } else if (p.name.includes('Sandbag') || p.name.includes('Lunges')) {
                focus = '- **Sandbag Lunges:** Heavy DB walking lunges 2x/week at home. Build quad/glute endurance. Practice keeping upright posture.';
            } else if (p.name.includes('Running')) {
                focus = '- **Running:** Focus on tempo work and intervals. Practice running after stations (legs will feel different).';
            } else if (p.name.includes('Transitions')) {
                focus = '- **Transitions:** Practice running straight from treadmill to station. Have strategy ready. No rest between run finish and station start.';
            } else {
                focus = `- **${p.name}:** Dedicate extra training time to improve technique and efficiency.`;
            }
            return focus;
        }).join('\n')
        : '- Build all-around fitness with focus on Hyrox-specific movements';

    // Build equipment list
    const equipmentList = formData.equipment.length > 0
        ? formData.equipment.join(', ')
        : 'Limited equipment - bodyweight and basic movements';

    // Calculate station targets (in seconds)
    const calculateStationTarget = (stationName, currentTime) => {
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
        return targets[stationName] || 300;
    };

    // Build the prompt
    const prompt = `# Generate Hyrox Training Plan

## Athlete Information

### Race Information
- **Race Location:** ${formData.raceLocation}
- **Race Date:** ${formData.raceDate}
- **Weeks Until Race:** ${weeksUntilRace}
- **Race Division:** ${formatDivisionName(formData.raceDivision)}${formData.ageGroup ? ` (Age Group: ${formData.ageGroup})` : ''}
- **Race Weights:**
  - Sled Push: ${raceWeights.sledPush}kg (including sled)
  - Sled Pull: ${raceWeights.sledPull}kg (including sled)
  - Farmers Carry: ${raceWeights.farmersCarry}kg each (2x = ${raceWeights.farmersCarry * 2}kg total)
  - Sandbag Lunges: ${raceWeights.sandbagLunges}kg
  - Wall Balls: ${raceWeights.wallBalls}kg

### Current Performance
- **Current Race Time:** ${formatTime(formData.currentTime)} (${formData.currentTime} seconds)
- **Current 5K Time:** ${formatTime(formData.current5K)} (${formData.current5K} seconds)
- **Previous Race Station Times:**
  - 1000m SkiErg: ${formatTime(formData.stationTimes.skiErg) || 'N/A'}
  - 50m Sled Push: ${formatTime(formData.stationTimes.sledPush) || 'N/A'}
  - 50m Sled Pull: ${formatTime(formData.stationTimes.sledPull) || 'N/A'}
  - 80m Burpee Broad Jumps: ${formatTime(formData.stationTimes.burpee) || 'N/A'}
  - 1000m Row: ${formatTime(formData.stationTimes.row) || 'N/A'}
  - 200m Farmers Carry: ${formatTime(formData.stationTimes.farmers) || 'N/A'}
  - 100m Sandbag Lunges: ${formatTime(formData.stationTimes.lunges) || 'N/A'}
  - 100 Wall Balls: ${formatTime(formData.stationTimes.wallBalls) || 'N/A'}

### Target Goals
- **Target Race Time:** ${formatTime(formData.targetTime)} (${formData.targetTime} seconds)
- **Target 5K Time:** ${formatTime(formData.target5K)} (${formData.target5K} seconds)
- **Time to Find:** ${formatTime(formData.currentTime - formData.targetTime)} (${formData.currentTime - formData.targetTime} seconds)

${formData.targetWeight ? `
### Body Composition Goals
- **Current:** ${formData.currentWeight}kg, ${formData.currentBodyFat}% body fat
- **Target:** ${formData.targetWeight}kg, ${formData.targetBodyFat || 'N/A'}% body fat
- **Goal:** Lose ${(formData.currentWeight - formData.targetWeight).toFixed(1)}kg fat
` : ''}

### Training Priorities (ranked by improvement potential)
${prioritiesList}

### Training Schedule Constraints
- **Running Days per Week:** ${formData.runDays}
- **Strength Days per Week:** ${formData.strengthDays}
- **Gym/Hyrox Equipment Days per Week:** ${formData.gymDays}
- **Rest Days per Week:** ${7 - formData.runDays - formData.strengthDays - formData.gymDays}

### Available Equipment
${equipmentList}

## Training Plan Structure

Generate a complete ${weeksUntilRace}-week training plan with these phases:

1. **Weeks 1-${foundationWeeks} (Foundation Phase):** Learn equipment, build base fitness, establish routine
2. **Weeks ${buildStartWeek}-${buildEndWeek} (Build Phase):** Increase volume and intensity, improve station efficiency
3. **Weeks ${intensityStartWeek}-${intensityEndWeek} (Intensity Phase):** Race pace simulations, high intensity, full dress rehearsals
4. **Weeks ${peakStartWeek}-${peakEndWeek} (Peak Phase):** Maintain fitness while reducing fatigue, perfect race pace
5. **Week ${taperWeek} (Taper Week):** Light technique work, stay fresh, trust your training

## Priority-Based Training Focus

${priorityTrainingFocus}

## Station-Specific Targets

- **1000m SkiErg:** Target ${formatTime(calculateStationTarget('skiErg'))} (pace ~2:22/500m)
- **50m Sled Push:** Target ${formatTime(calculateStationTarget('sledPush'))}
- **50m Sled Pull:** Target ${formatTime(calculateStationTarget('sledPull'))}
- **80m Burpee Broad Jumps:** Target ${formatTime(calculateStationTarget('burpee'))} (aim for 3.1 sec/burpee)
- **1000m Row:** Target ${formatTime(calculateStationTarget('row'))} (pace ~2:22/500m)
- **200m Farmers Carry:** Target ${formatTime(calculateStationTarget('farmers'))}
- **100m Sandbag Lunges:** Target ${formatTime(calculateStationTarget('lunges'))}
- **100 Wall Balls:** Target ${formatTime(calculateStationTarget('wallBalls'))} (sets of 25-30 unbroken)

## Instructions

Generate a complete ${weeksUntilRace}-week Hyrox training plan in HTML format for ${formatDivisionName(formData.raceDivision)}${formData.ageGroup ? ` (Age Group: ${formData.ageGroup})` : ''}. The plan should:

1. Be structured week-by-week with daily workouts
2. Include specific exercises, sets, reps, and weights
3. Progressively increase intensity and volume
4. Focus on identified priorities
5. Adapt to available equipment: ${equipmentList}
6. Include proper periodization (foundation → build → intensity → peak → taper)
7. Account for training schedule: ${formData.runDays} runs, ${formData.strengthDays} strength, ${formData.gymDays} gym sessions per week
8. Include transition practice
9. Provide race-specific station work in gym sessions

### Output Format

Generate HTML that matches this structure for each week:

\`\`\`html
<section class="week-section">
    <div class="week-header">
        <h2>Week {weekNumber}: {phaseName}</h2>
        <p>Focus: {focusDescription}</p>
    </div>
    
    <div class="day-card">
        <div class="day-header">
            <span class="day-title">{dayName}</span>
            <span class="day-type">{sessionType}</span>
        </div>
        <ul class="exercise-list">
            <li class="exercise-item">
                <div class="exercise-name">{exerciseName}</div>
                <div class="exercise-details">{sets}x{reps} <span class="weight-badge">{weight}</span></div>
            </li>
        </ul>
    </div>
</section>
\`\`\`

### Key Principles

1. **Progressive Overload:** Gradually increase intensity, volume, or weight each week
2. **Specificity:** Train movements and energy systems specific to Hyrox
3. **Recovery:** Ensure adequate rest days
4. **Periodization:** Structure training in phases
5. **Individualization:** Adapt to athlete's schedule, equipment, and priorities
6. **Technique First:** Emphasize proper form before intensity
7. **Race Simulation:** Include full race simulations in later phases
8. **Transition Practice:** Dedicate time to practicing transitions

Generate the complete training plan now.`;

    return prompt;
}

// Function to prepare data for prompt building
function preparePromptData(formData, weeksUntilRace, priorities, raceWeights) {
    return {
        formData: formData,
        weeksUntilRace: weeksUntilRace,
        priorities: priorities,
        raceWeights: raceWeights
    };
}

