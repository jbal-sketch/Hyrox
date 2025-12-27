# LLM Prompt for Training Plan Generation - Review Document

## Overview

This document outlines the LLM prompt system for generating personalized Hyrox training plans. The prompt is dynamically built from user form inputs and sent to an LLM API to generate a complete, week-by-week training plan.

## Files Created

1. **`llm-prompt-template.md`** - Full prompt template with placeholders
2. **`prompt-builder.js`** - JavaScript function that builds the prompt from form data

## How It Works

### Step 1: User Fills Form
User completes the input form with:
- Race information (location, date, category)
- Current performance (race time, 5K time, station times)
- Target goals (target time, 5K goal)
- Body composition (if applicable)
- Training schedule preferences
- Available equipment

### Step 2: Generate Button Clicked
When user clicks "Generate My Training Plan":
1. Form data is collected
2. Calculations are performed:
   - Weeks until race
   - Time to find
   - Training priorities (if previous race data exists)
   - Race weights based on category
3. Prompt is built using `buildLLMPrompt()` function
4. Prompt is sent to LLM API (to be implemented)
5. LLM generates HTML training plan
6. Plan is displayed on the plan page

### Step 3: Prompt Structure

The prompt includes:

#### Context Section
- Race information (location, date, weeks until race, category)
- Race weights (specific to category)
- Current performance metrics
- Previous race station times (if available)
- Target goals
- Body composition goals (if provided)

#### Training Priorities
- Ranked list of stations by improvement potential
- Current vs target times
- Potential time savings
- Specific training focus for top 3 priorities

#### Training Constraints
- Running days per week
- Strength days per week
- Gym/Hyrox equipment days per week
- Rest days per week
- Available equipment list

#### Phase Structure
- Foundation Phase (Weeks 1-X)
- Build Phase (Weeks X-Y)
- Intensity Phase (Weeks Y-Z)
- Peak Phase (Weeks Z-A)
- Taper Week (Final week)

#### Station-Specific Targets
- Target times for each station
- Pacing guidelines
- Technique cues

#### Output Format Requirements
- HTML structure matching existing design
- Week sections with day cards
- Exercise lists with sets, reps, weights
- Proper CSS classes for styling

## Example Prompt (Abbreviated)

```
# Generate Hyrox Training Plan

## Athlete Information

### Race Information
- Race Location: Glasgow
- Race Date: 2024-03-14
- Weeks Until Race: 11
- Race Category: womens-open
- Race Weights:
  - Sled Push: 102kg
  - Sled Pull: 78kg
  - Farmers Carry: 16kg each (32kg total)
  - Sandbag Lunges: 10kg
  - Wall Balls: 4kg

### Current Performance
- Current Race Time: 1:40:32 (6032 seconds)
- Current 5K Time: 26:00 (1560 seconds)
- Previous Race Station Times:
  - 1000m SkiErg: 5:15
  - 50m Sled Push: 3:00
  - 50m Sled Pull: 6:29
  - 80m Burpee Broad Jumps: 8:27
  - 1000m Row: 5:25
  - 200m Farmers Carry: 2:30
  - 100m Sandbag Lunges: 6:56
  - 100 Wall Balls: 11:39

### Target Goals
- Target Race Time: 1:30:00 (5400 seconds)
- Target 5K Time: 24:00 (1440 seconds)
- Time to Find: 10:32 (632 seconds)

### Training Priorities
1. Wall Balls - Current: 11:39, Target: 3:30, Potential Savings: 8:09
2. Transitions - Current: 11:39, Target: 4:00, Potential Savings: 7:39
3. Burpee Broad Jumps - Current: 8:27, Target: 5:00, Potential Savings: 3:27

### Training Schedule
- Running Days: 3x per week
- Strength Days: 2x per week
- Gym Days: 1x per week
- Rest Days: 1x per week

### Available Equipment
dumbbells, treadmill, bench

## Instructions
[Full instructions for generating the plan...]
```

## Integration Points

### Where to Hook Up

1. **In `plan-generator.js`** - Modify `generatePlan()` function:
   ```javascript
   // After storing data in localStorage
   const prompt = buildLLMPrompt(formData, weeksUntilRace, priorities, raceWeights);
   
   // Call LLM API
   const trainingPlanHTML = await callLLMAPI(prompt);
   
   // Store generated plan
   localStorage.setItem('hyrox_plan_html_' + planId, trainingPlanHTML);
   ```

2. **In `plan.html` or plan display function**:
   ```javascript
   // Load generated plan HTML
   const planHTML = localStorage.getItem('hyrox_plan_html_' + planId);
   if (planHTML) {
       // Display the generated plan
       document.getElementById('training-plan-content').innerHTML = planHTML;
   }
   ```

### LLM API Options

1. **OpenAI GPT-4**
   - Model: `gpt-4` or `gpt-4-turbo`
   - Temperature: 0.7 (creative but consistent)
   - Max tokens: 4000-8000 (for full plan)

2. **Anthropic Claude**
   - Model: `claude-3-opus` or `claude-3-sonnet`
   - Good for structured output

3. **Local LLM** (if privacy is concern)
   - Ollama, LM Studio, etc.
   - Run locally for data privacy

## Prompt Quality Features

✅ **Comprehensive Context** - All user inputs included
✅ **Structured Output** - Clear HTML format requirements
✅ **Progressive Training** - Phased approach built in
✅ **Priority-Based** - Focuses on biggest improvements
✅ **Equipment-Aware** - Adapts to available equipment
✅ **Schedule-Aware** - Respects user's training frequency
✅ **Race-Specific** - Hyrox-specific movements and targets

## Next Steps

1. **Review this prompt structure** - Does it capture everything needed?
2. **Choose LLM provider** - OpenAI, Anthropic, or other?
3. **Implement API integration** - Add API call function
4. **Add error handling** - What if LLM fails?
5. **Add loading states** - Show progress while generating
6. **Add caching** - Cache generated plans to avoid re-generation
7. **Add edit/regenerate** - Allow users to regenerate with tweaks

## Testing

To test the prompt builder:
```javascript
// In browser console or test file
const testData = {
    raceLocation: "Glasgow",
    raceDate: "2024-03-14",
    raceCategory: "womens-open",
    currentTime: 6032,
    current5K: 1560,
    targetTime: 5400,
    target5K: 1440,
    // ... more test data
};

const prompt = buildLLMPrompt(testData, 11, priorities, raceWeights);
console.log(prompt);
```

## Questions for Review

1. Is the prompt comprehensive enough?
2. Should we include more Hyrox-specific knowledge?
3. Do we need to adjust the phase structure?
4. Should we add more specific exercise recommendations?
5. Do we need to include nutrition guidance in the plan?
6. Should the plan include recovery/rehab recommendations?

## Ready for Integration

Once you approve this prompt structure, we can:
1. Set up the LLM API integration
2. Add the API call to the generate button
3. Display the generated plan on the plan page
4. Add error handling and loading states
5. Test with real user data

