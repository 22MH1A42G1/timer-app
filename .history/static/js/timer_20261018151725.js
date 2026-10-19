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
    
}