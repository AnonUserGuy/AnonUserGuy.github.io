import * as manager from "../js/minecraft_timeline_manager.js";
import * as global from "../js/global.js";

const DateTimeFormat = new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "long"
});
const DateFormat = new Intl.DateTimeFormat(undefined, {
    dateStyle: "full"
});
const uploadInput = document.getElementById("uploadInput") as HTMLInputElement;
const resetInput = document.getElementById("resetInput") as HTMLInputElement;
const exampleInput = document.getElementById("exampleInput") as HTMLInputElement;
const exampleCountInput = document.getElementById("exampleCountInput") as HTMLInputElement;
const openCloseInput = document.getElementById("openCloseInput") as HTMLInputElement;
const timelineDivOuter = document.getElementById("timelineDivOuter") as HTMLDivElement;
const timelineDiv = document.getElementById("timelineDiv") as HTMLDivElement;
const styleEl = document.getElementById("generatedStyles") as HTMLStyleElement;

let timeline: manager.TimelineEvent[] = [];
const profiles: manager.Profile[] = [];

let detailses: HTMLDetailsElement[] = [];
let detailsesAllOpen = true;
let lastDetails: HTMLDetailsElement | null = null;

function sameDay(d1: Date, d2: Date) {
    return d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear();
}

uploadInput.addEventListener("change", async () => {
    global.loading(true);
    await manager.updateTimeline(uploadInput.files, profiles, timeline);
    timelinePrint();
    global.loading(false);
});

resetInput.addEventListener("click", () => {
    timelineDivOuter.setAttribute("hidden", "");
    timeline = [];
});

exampleInput.addEventListener("click", () => {
    addRandomPlayers(parseInt(exampleCountInput.value));
    timelinePrint();
});

openCloseInput.addEventListener("click", () => {
    detailsesAllOpen = !detailsesAllOpen;
    for (const detailsEl of detailses) {
        detailsEl.open = detailsesAllOpen;
    }
    openCloseInput.value = detailsesAllOpen ? "close all" : "open all";

    if (detailsesAllOpen && lastDetails) {
        lastDetails.scrollIntoView();
    }
});

function addRandomPlayers(amount: number) {
    const MAX_UNIX_TIME = 8640000000000000;
    const maxDate = timeline.length ? timeline[timeline.length - 1][0] : new Date(Math.random() * MAX_UNIX_TIME);
    const minDate = timeline.length ? timeline[0][0] : new Date(maxDate.getTime() - 1000 * 60 * 60 * 24 * 4);

    for (let h = 0; h < amount; h++) {
        const profileIndex = profiles.length;
        profiles.push({
            uuid: "none!",
            username: `demo${profileIndex}`,
            nameless: false,
            generated: true
        })

        const eventCount = Math.random() * 100 + 1;
        for (let i = 0; i < eventCount;) {

            const concurrentEventCount = Math.max(Math.random() * 20 - 15, 1);
            const date = randomDateInRange(minDate, maxDate);
            for (let j = 0; j < concurrentEventCount && i < eventCount; j++) {
                timeline.push([date, profileIndex, `event${i}`]);
                i++;
            }
        }
    }
    timeline.sort((a, b) => a[0].getTime() - b[0].getTime());
}

function randomDateInRange(from: Date, to: Date) {
    return new Date(from.getTime() + Math.random() * (to.getTime() - from.getTime()));
}




function focusDetailsIfWentOffscreen(event: Event) {
    if (!event.currentTarget) return;

    const summaryEl = event.currentTarget as HTMLElement;
    const detailsEl = summaryEl.parentNode as HTMLDetailsElement;
    lastDetails = detailsEl;

    if (detailsEl.open) {
        event.preventDefault();
        detailsEl.open = false;

        const margin = parseFloat(getComputedStyle(summaryEl).top) + parseFloat(getComputedStyle(summaryEl.firstElementChild!).marginTop);
        if (summaryEl.getBoundingClientRect().y < margin) {
            summaryEl.scrollIntoView();
            window.scrollBy(0, -margin);
        }
    }
}


function timelinePrint() {
    if (timeline.length <= 0) return;

    styleEl.innerText = profiles.map((profile, i) =>
        `.p${i} {color: hsl(${i / profiles.length}turn 100% 50%);} a.p${i}:hover {color: hsl(${i / profiles.length}turn 75% 75%);}`).join(" ");

    timelineDivOuter.removeAttribute("hidden");
    timelineDiv.replaceChildren();
    detailses = [];
    lastDetails = null;

    let prevDate = new Date(0);
    let currentDateEl: HTMLDetailsElement | null = null;
    let currentHourEl: HTMLUListElement | null = null;
    let currentTimeEl: HTMLUListElement | null = null;
    for (let i = 0; i < timeline.length; i++) {
        const event = timeline[i];
        const date = event[0];
        if (!sameDay(date, prevDate)) {
            // different day

            const dateSummaryEl = global.createElementEX("summary", {}, [
                global.createElementEX("h2", {}, [
                    DateFormat.format(date)
                ])
            ]);
            const dateDetailsEl = global.createElementEX("details", { "id": `date${i}` }, [dateSummaryEl]) as HTMLDetailsElement;
            dateDetailsEl.open = detailsesAllOpen;
            dateSummaryEl.addEventListener("click", focusDetailsIfWentOffscreen);
            timelineDiv.appendChild(dateDetailsEl);
            detailses.push(dateDetailsEl);
            currentDateEl = dateDetailsEl;
        }
        const hour = date.getHours();
        if (!sameDay(date, prevDate) || hour !== prevDate.getHours()) {
            // different hour

            const hourSummaryEl = global.createElementEX("summary", {}, [
                global.createElementEX("h3", {}, [
                    `${(hour + 11) % 12 + 1} ${hour >= 12 ? "PM" : "AM"}`
                ])
            ]);
            const hourListEl = document.createElement("ul");
            const hourDetailsEl = global.createElementEX("details", { "id": `hour${i}` }, [
                hourSummaryEl,
                hourListEl
            ]) as HTMLDetailsElement;
            hourDetailsEl.open = detailsesAllOpen;
            hourSummaryEl.addEventListener("click", focusDetailsIfWentOffscreen);
            currentDateEl!.appendChild(hourDetailsEl);
            detailses.push(hourDetailsEl);
            currentHourEl = hourListEl;
        }

        const profileIndex = event[1];
        const profile = profiles[profileIndex];

        let eventItemEl = document.createElement("li");

        if (!currentTimeEl || date.getTime() !== prevDate.getTime()) {
            // different instance of time

            const timestampEl = global.createElementEX("b", {}, [DateTimeFormat.format(date) + " "]);
            eventItemEl.appendChild(timestampEl);

            if (i + 1 < timeline.length && date.getTime() === timeline[i + 1][0].getTime()) {
                // current time instant has multiple events

                const timeListEl = document.createElement("ul");
                eventItemEl.appendChild(timeListEl);
                currentTimeEl = timeListEl;

                currentHourEl!.appendChild(eventItemEl);
                eventItemEl = document.createElement("li");
            } else {
                // current time instant only has one event
                currentTimeEl = null;
            }
        }


        const spanEl = !profile.generated ?
            global.createElementEX("a", {
                "href": `https://namemc.com/profile/${profile.uuid}`,
                "target": "_blank"
            }, [profile.username!])
            : global.createElementEX("span", {}, [profile.username!]);
        spanEl.setAttribute("title", profile.uuid);
        spanEl.setAttribute("class", `p${profile.nameless ? " pn" : ""} p${profileIndex}`);

        const eventEl = document.createTextNode(" " + event[2]);

        eventItemEl.appendChild(spanEl);
        eventItemEl.appendChild(eventEl);

        (currentTimeEl || currentHourEl)!.appendChild(eventItemEl);

        prevDate = date;
    }
}