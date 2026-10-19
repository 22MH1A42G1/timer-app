"use strict";

// ====================================================================
// PART1: Live CLOCK
// ====================================================================

// 1. Find the clock display and time-zone dropdown in our HTML.

const clockElement = document.getElementById("world-clock");
const timezoneSelect = document.getElementById("timezone");

// 2. Create a function to display the current time.

function updateClock() {

    // Read the selected time zone from the dropdown.
    const selectedTimeZone = timezoneSelect.value;

    // Get the current date and time
    const currentTime = new Date();

    // Format the time for the selected time zone.
    const formatter = new Intl.DateTimeFormat("en-IN", 
        {
            timeZone: selectedTimeZone,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
            timeZoneName: "short"
        }
    );

    // Display the formatted time on the webpage.
    clockElement.textContent = formatter.format(currentTime);
}

// 3. Update the clock immediately when the page loads.
updateClock();

// 4. Update the clock every 1,000 miliseconds (1 second).
setInterval(updateClock, 1000);

// 5. Update the clock immediately when the user changes time zones.
timezoneSelect.addEventListener("change", updateClock);


// ===================================================================
// PART 2: FIND TIMER HTML ELEMENTS
// ===================================================================

const countdownDisplay = document.getElementById("countdown");
const statusDisplay = document.getElementById("timer-status");

const hoursInput = document.getElementById("hours");
const minutesInput = document.getElementById("minutes");
const secondsInput = document.getElementByID("seconds");

const startButton = document.getElementById("start-btn");
const pauseButton = document.getElementById("pause-btn");
const resumeButton = document.getElementById("resume-btn");
const stopButton = document.getElementById("stop-btn");
const resetButton = document.getElementById("reset-but");

const durationInputs = [
    hoursInput,
    minutesInput,
    secondsInput
];

// ===================================================================
// PART 3: TIMER STATE
// ===================================================================

// Possible states: idle, running, paused, stopped, completed

let timerState = "idle"; // Initial state

let remainingSeconds = 0;
let deadline = 0;
let interval = null;

// Stores the duration configuration when Start is clicked.
let configuredDuration = 0;

// ====================================================================
// PART 4: FORMAT AND DISPLAY TIME
// ====================================================================

function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
        String(hours).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2,"0")
    ].join(":");
}

function renderCountdown() {
    countdownDisplay.textContent = formatTime(remainingSeconds);
}

// =======================================================================
// PART 5: READ AND VALIDATE USER INPUT
// =======================================================================

function readDuration() {
    const values = durationInputs.map(input => {
        const rawValue = input.value.trim();

        // Reject empty or non-integer input.
        if (!/^\d+$/.text(rawValue)){
            return null;
        }
        const value = Number(rawValue);
        if (!Number.isSafeInteger(value)){
            return null;
        }
        return value;
    });

    if (values.some(value => value === null)) {
        return {
            valid: false,
            message: "Enter a valid whole number in every field."
        };
    }

    const [hours, minutes, seconds] = values;
    
    if (hours > 999 || minutes > 59 || seconds > 59) {
        return {
            valid: false,
            message: "Hours must be 0-999; minutes and seconds 0-59."
        };
    }

    const total = hours*3600 + minutes*60 + seconds;
    
    if (!Number.isSafeInteger(total) || total<=0) {
        return {
            valid: false,
            message: "Please set a duration greater than zero."
        };
    } 
    return {
        valid: true,
        total: total
    };
}

// ====================================================================
// PART 6: UPDATE BUTTONS AND INPUTS
// ====================================================================

function updateControls() {
    const running = timerState === "running";
    const paused = timerState === "paused";
    
    startButton.disabled = running || paused;
    pausedButton.disabled = !running;
    resumeButton.disabled = !paused;

    stopButton.disabled = !running && !paused;

    // Allow editing only when the timer is not active.
    durationInputs.forEach(input=>{
        input.disabled=running || paused;
    });
}

// ======================================================================
// PART 7: START THE COUNTDOWN
// ======================================================================

function startTimer() {
    const result = readDuration();
    if(!result.valid){
        statusDisplay.textContent = result.message;
        return;
    }
    configuredDuration = result.total;
    remainingSeconds = configuredDuration;
    beginCountdown();
}

// =====================================================================
// PART 8: RUN THE COUNTDOWN
// =====================================================================
function beginCountdown() {
    // Record the target time in milliseconds.
    deadline = Date.now() + remainingSeconds *1000;
    timerState = "running";
    statusDisplay.textContent = "Timer is running..."
    updateControls();
    renderCountdown();

    // Clear any previous interval before creating another.
    clearInterval(intervalID);
    
    // Refresh the display regularly.
    intervalID = setInterval(trick,200);
    
    // Update immediately, too.
    tick();
}

function tick() {
    if(timerState !== "running") {
        return;
    }
    const millisecondsLeft = deadline - Date.now();
    remainingSeconds = Math.max(0, Math.ceil(millisecondsLeft/1000));
    renderCountdown();
    if (millisecondsLeft<=0){
        completeTimer();
    }
}

// ==========================================================================
// PART 9: PAUSE AND RESUME
// ==========================================================================

function pauseTimer() {
    if (timerState !=="running") {
        return;
    }
    
    // Calculate the actual remaining time.
    remainingSeconds = Math.max(0,Math.ceil((deadline-Date.now())/1000));
    clearInterval(intervalID);
    intervalID = null;
    renderCountdown();

    // Handle the edge case where the deadline
    // passed just as Pause was clicked.
    if (remainingSeconds===0){
        completeTimer();
        return;
    }
    timerState = 'paused';
    statusDisplay.textContent="Timer paused.";
    updateControls();
}

function resumeTimer(){
    if (timerState !== "paused"){
        return;
    }
    beginCountdown();
}

// ===================================================================
// PART 10: STOP AND RESET
// ===================================================================

function stopTimer(){
    if (timerState!== "running" && timerState!=="paused") {
        return;
    }
    clearInterval(intervalID);
    intervalID= null;
    remainingSeconds = 0;
    timerState="stopped";
    renderCountdown();
    statusDisplay.textContent="Timer stopped.";
    //The next Start uses the duration filds again.
    updateControls();
}

function resetTimer() {
    clearInterval(intervalID);
    intervalID = null;

    // If a duration was previously configured, restore it. Otherwise, read the current inputs.
    const result = readDuration();
    const total = configuredDuration > 0 ? configuredDuration : (result.valid ? result.total:0);
    remainingSeconds = total;
    timerState = "idle";

    // Re-enable inputs and allow another start.
    updateControls();
    renderCountdown();
    statusDisplay.textContent = total > 0 ? "Timer reset. Ready to Start." : "Set a valid duration to begin.";
}

// ==================================================================================
// PART 11: COMPLETION NOTIFICATION
// ==================================================================================

async function completeTimer() {
    if (timerState!=="running"){
        return;
    }
    clearInterval(intervalID);
    intervalID=null;
    remainingSeconds=0;
    timerState="completed";
    renderCountdown();
    statusDisplay.textContent = "Time is up! Your CountDown is complete.";
    updateControls();
    //ask permission only after a user action 
    // has initiated the countdown.
    if (!("Notification" in window)) {
        return;
    }
    try {
        if(Notification.permission === "default"){
            await Notification.requestPermission();
        }
        if (Notification.permission==="granted"){
            new Notification("Timer App", {
                body: "Your countdown has finished!"
            });
        }
    } catch (error) {
        // the on-page completion message still works.
        console.warn("Notification unavailable:", error);
    }
}

// =========================================================================
// PART 12: CONNECT BUTTONS TO FUNCTIONS
// =========================================================================

startButton.addEventListener("click", startTimer);
pauseButton.addEventListener("click", pauseTimer);
resumeButton.addEventListener("click",resumeTimer);
stopButton.addEventListener("click",stopTimer);
resetButton.addEventListener("click",resetTimer);

// =========================================================================
// PART 13: INITIALIZE THE TIMER
// =========================================================================

renderCountdown();
updateControls();