
"use strict";

// ==========================================
// PART 1: LIVE CLOCK
// ==========================================

const clockElement = document.getElementById("world-clock");
const timezoneSelect = document.getElementById("timezone");

function updateClock() {
    const selectedTimeZone = timezoneSelect.value;
    const currentTime = new Date();

    const formatter = new Intl.DateTimeFormat("en-IN", {
        timeZone: selectedTimeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZoneName: "short"
    });

    clockElement.textContent = formatter.format(currentTime);
}

updateClock();
setInterval(updateClock, 1000);
timezoneSelect.addEventListener("change", updateClock);


// ==========================================
// PART 2: FIND TIMER HTML ELEMENTS
// ==========================================

const countdownDisplay = document.getElementById("countdown");
const statusDisplay = document.getElementById("timer-status");

const hoursInput = document.getElementById("hours");
const minutesInput = document.getElementById("minutes");
const secondsInput = document.getElementById("seconds");

const startButton = document.getElementById("start-btn");
const pauseButton = document.getElementById("pause-btn");
const resumeButton = document.getElementById("resume-btn");
const stopButton = document.getElementById("stop-btn");
const resetButton = document.getElementById("reset-btn");

const durationInputs = [
    hoursInput,
    minutesInput,
    secondsInput
];

/* ==========================================
   ALARM SOUND ENGINE
========================================== */

const enableAlarmButton =
    document.getElementById("enable-alarm-btn");

const dismissAlarmButton =
    document.getElementById("dismiss-alarm-btn");

let audioContext = null;
let alarmIntervalId = null;
let alarmEnabled = false;

async function enableAlarmSound() {
    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            statusDisplay.textContent =
                "Your browser does not support alarm audio.";
            return;
        }

        if (!audioContext) {
            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            await audioContext.resume();
        }

        alarmEnabled = audioContext.state === "running";

        if (alarmEnabled) {
            enableAlarmButton.textContent = "✓ Alarm Sound Enabled";

            if (timerState === "completed") {
                statusDisplay.textContent =
                    "Time is up! Alarm is ringing.";
                startAlarm();
            } else {
                statusDisplay.textContent =
                    "Alarm sound is enabled and ready.";
            }
        } else {
            statusDisplay.textContent =
                "Audio is not active. Please try again.";
        }
    } catch (error) {
        console.error("Could not enable alarm sound:", error);

        statusDisplay.textContent =
            "Could not enable audio. Check browser permissions.";
    }
}

function playAlarmBeep() {
    if (!audioContext || !alarmEnabled ||
        audioContext.state !== "running") {
        return;
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    // A clear, high-pitched alarm tone.
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
        880, audioContext.currentTime
    );

    // Fade the beep in and out to avoid clicks.
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.18, audioContext.currentTime + 0.03
    );
    gain.gain.exponentialRampToValueAtTime(
        0.001, audioContext.currentTime + 0.35
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.36);

    oscillator.addEventListener("ended", () => {
        oscillator.disconnect();
        gain.disconnect();
    }, { once: true });
}

function startAlarm() {
    // Prevent duplicate alarm loops.
    stopAlarm();

    dismissAlarmButton.hidden = false;

    if (!alarmEnabled || !audioContext ||
        audioContext.state !== "running") {
        statusDisplay.textContent =
            "Time is up! Click Enable Alarm Sound, then try again.";
        return;
    }

    // Ring immediately, then repeat approximately every 800 ms.
    playAlarmBeep();
    alarmIntervalId = setInterval(playAlarmBeep, 800);
}

function stopAlarm() {
    if (alarmIntervalId !== null) {
        clearInterval(alarmIntervalId);
        alarmIntervalId = null;
    }

    dismissAlarmButton.hidden = true;
}

enableAlarmButton.addEventListener(
    "click", enableAlarmSound
);

dismissAlarmButton.addEventListener("click", () => {
    stopAlarm();

    statusDisplay.textContent =
        "Alarm dismissed. Your timer has finished.";
});


// ==========================================
// PART 3: TIMER STATE
// ==========================================

// Possible states: idle, running, paused,
// stopped, completed.

let timerState = "idle";

let remainingSeconds = 0;
let deadline = 0;
let intervalId = null;

// Stores the duration configured when Start is clicked.
let configuredDuration = 0;


// ==========================================
// PART 4: FORMAT AND DISPLAY TIME
// ==========================================

function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
        String(hours).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0")
    ].join(":");
}

function renderCountdown() {
    countdownDisplay.textContent =
        formatTime(remainingSeconds);
}


// ==========================================
// PART 5: READ AND VALIDATE USER INPUT
// ==========================================

function readDuration() {
    const values = durationInputs.map(input => {
        const rawValue = input.value.trim();

        // Reject empty or non-integer input.
        if (!/^\d+$/.test(rawValue)) {
            return null;
        }

        const value = Number(rawValue);

        if (!Number.isSafeInteger(value)) {
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
            message: "Hours must be 0–999; minutes and seconds 0–59."
        };
    }

    const total = hours * 3600 + minutes * 60 + seconds;

    if (!Number.isSafeInteger(total) || total <= 0) {
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


// ==========================================
// PART 6: UPDATE BUTTONS AND INPUTS
// ==========================================

function updateControls() {
    const running = timerState === "running";
    const paused = timerState === "paused";

    startButton.disabled = running || paused;
    pauseButton.disabled = !running;
    resumeButton.disabled = !paused;

    stopButton.disabled = !running && !paused;

    // Allow editing only when the timer is not active.
    durationInputs.forEach(input => {
        input.disabled = running || paused;
    });
}


// ==========================================
// PART 7: START THE COUNTDOWN
// ==========================================

function startTimer() {
    const result = readDuration();

    if (!result.valid) {
        statusDisplay.textContent = result.message;
        return;
    }

    configuredDuration = result.total;
    remainingSeconds = configuredDuration;

    beginCountdown();
}


// ==========================================
// PART 8: RUN THE COUNTDOWN
// ==========================================

function beginCountdown() {
    // Record the target time in milliseconds.
    deadline = Date.now() + remainingSeconds * 1000;

    timerState = "running";
    statusDisplay.textContent = "Timer is running...";

    updateControls();
    renderCountdown();

    // Clear any previous interval before creating another.
    clearInterval(intervalId);

    // Refresh the display regularly.
    intervalId = setInterval(tick, 200);

    // Update immediately, too.
    tick();
}

function tick() {
    if (timerState !== "running") {
        return;
    }

    const millisecondsLeft = deadline - Date.now();

    remainingSeconds = Math.max(
        0,
        Math.ceil(millisecondsLeft / 1000)
    );

    renderCountdown();

    if (millisecondsLeft <= 0) {
        completeTimer();
    }
}


// ==========================================
// PART 9: PAUSE AND RESUME
// ==========================================

function pauseTimer() {
    if (timerState !== "running") {
        return;
    }

    // Calculate the actual remaining time.
    remainingSeconds = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / 1000)
    );

    clearInterval(intervalId);
    intervalId = null;

    renderCountdown();

    // Handle the edge case where the deadline
    // passed just as Pause was clicked.
    if (remainingSeconds === 0) {
        completeTimer();
        return;
    }

    timerState = "paused";
    statusDisplay.textContent = "Timer paused.";

    updateControls();
}

function resumeTimer() {
    if (timerState !== "paused") {
        return;
    }

    beginCountdown();
}


// ==========================================
// PART 10: STOP AND RESET
// ==========================================

function stopTimer() {
    if (timerState !== "running" &&
        timerState !== "paused") {
        return;
    }

    clearInterval(intervalId);
    intervalId = null;

    remainingSeconds = 0;
    timerState = "stopped";

    renderCountdown();

    statusDisplay.textContent = "Timer stopped.";

    // The next Start uses the duration fields again.
    updateControls();
}

function resetTimer() {
    clearInterval(intervalId);
    intervalId = null;

    // If a duration was previously configured,
    // restore it. Otherwise, read the current inputs.
    const result = readDuration();

    const total = configuredDuration > 0
        ? configuredDuration
        : (result.valid ? result.total : 0);

    remainingSeconds = total;
    timerState = "idle";

    // Re-enable inputs and allow another start.
    updateControls();

    renderCountdown();

    statusDisplay.textContent = total > 0
        ? "Timer reset. Ready to start."
        : "Set a valid duration to begin.";
}


// ==========================================
// PART 11: COMPLETION NOTIFICATION
// ==========================================

async function completeTimer() {
    if (timerState !== "running") {
        return;
    }

    clearInterval(intervalId);
    intervalId = null;

    remainingSeconds = 0;
    timerState = "completed";

    renderCountdown();

    statusDisplay.textContent =
        "Time is up! Your countdown is complete.";

    updateControls();

    startAlarm();

    // Ask permission only after a user action
    // has initiated the countdown.
    if (!("Notification" in window)) {
        return;
    }

    try {
        if (Notification.permission === "default") {
            await Notification.requestPermission();
        }

        if (Notification.permission === "granted") {
            new Notification("Timer App", {
                body: "Your countdown has finished!"
            });
        }
    } catch (error) {
        // The on-page completion message still works.
        console.warn("Notification unavailable:", error);
    }
}


// ==========================================
// PART 12: CONNECT BUTTONS TO FUNCTIONS
// ==========================================

startButton.addEventListener("click", startTimer);
pauseButton.addEventListener("click", pauseTimer);
resumeButton.addEventListener("click", resumeTimer);
stopButton.addEventListener("click", stopTimer);
resetButton.addEventListener("click", resetTimer);


// ==========================================
// PART 13: INITIALIZE THE TIMER
// ==========================================

renderCountdown();
updateControls();
