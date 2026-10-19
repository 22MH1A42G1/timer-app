"use strict";

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