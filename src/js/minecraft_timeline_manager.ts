import * as uuid from "./get_minecraft_usernames_from_uuids.js";
import * as global from "./global.js";

export interface Profile {
    uuid: string;
    username?: string;
    nameless?: boolean;
    generated: boolean;
}

export interface TimelineEvent {
    0: Date;
    1: number;
    2: string;
}

function removeDuplicateEvents(arr: TimelineEvent[]) {
    for (let i = 0; i < arr.length - 1; i++) {
        let j = i + 1;
        while (j < arr.length && eventsAreDuplicates(arr[i], arr[j])) {
            j++;
        }
        if (j !== i + 1) {
            arr.splice(i + 1, j - i - 1);
        }
    }
}
function eventsAreDuplicates(event1: TimelineEvent, event2: TimelineEvent) {
    return event1[0].getTime() === event2[0].getTime() && event1[1] === event2[1] && event1[2] === event2[2];
}

export async function updateTimeline(uploadedFiles: FileList | null, profiles: Profile[], timeline: TimelineEvent[]) {
    if (!uploadedFiles) return;

    const files = Array.from(uploadedFiles);

    const uuids = files.map(file => file.name.replace(/(.*)\..*/, "$1"));
    const usernamesPromise = uuid.getMinecraftUsernamesFromUuids(uuids).then((usernames) => {
        for (let i = 0; i < usernames.length; i++) {
            const profile = profiles[profileIndices[i]];
            profile.username = usernames[i] || `<user #${profileIndices[i]}>`;
            profile.nameless = !usernames[i];
        }
    });
    const profileIndices: number[] = [];
    for (let i = 0; i < uuids.length; i++) {
        let profileIndex = profiles.findIndex(profile => profile.uuid === uuids[i]);
        if (profileIndex === -1) {
            profileIndex = profiles.length;
            profiles.push({
                uuid: uuids[i],
                generated: false
            });
        }
        profileIndices[i] = profileIndex;
    }

    await Promise.allSettled(files.map((file, i) => global.promiseFileAsText(file).then((text) => {
        if (!text) return;

        const data = JSON.parse(text);
        const profileIndex = profileIndices[i];

        for (const entry in data) {
            if (!(data[entry] instanceof Object && "criteria" in data[entry])) continue;
            for (const criterion in data[entry].criteria) {
                const dateString: string = data[entry].criteria[criterion];
                const date = new Date(dateString);

                let event = "";
                if (criterion == "has_the_recipe") {
                    event = entry.replace(/\w+:recipes\/\w+\/(\w+)/, "Has recipe: $1")
                } else if (!entry.startsWith('minecraft')) {
                    if (criterion.startsWith('has') && criterion !== "has_ingredient" && !criterion.startsWith("has_item")) {
                        event = criterion;
                    } else {
                        const match = entry.match(/^(\w+):.*?\/(\w+)$/);
                        if (match) {
                            if (match[2] == criterion) {
                                event = `${match[1]}:${match[2]}`
                            } else {
                                event = `${match[1]}:${match[2]}, ${criterion}`
                            }
                        } else {
                            event = `${entry},${criterion}`;
                        }
                    }
                } else if (criterion == "has_double_plant") {
                    event = entry.replace(/\w+:recipes\/\w+\/(\w+)/, "Learned: $1");
                } else if (entry == "minecraft:adventure/adventuring_time" || entry == "minecraft:nether/explore_nether") {
                    event = criterion.replace(/^minecraft:(\w+)$/, "Biome: $1");
                } else if (entry == "minecraft:husbandry/balanced_diet") {
                    event = `Ate: ${criterion}`;
                } else if (entry == "minecraft:husbandry/whole_pack") {
                    event = criterion.replace(/^minecraft:(\w+)$/, "tamed wolf: $1");
                } else if (entry == "minecraft:husbandry/leash_all_frog_variants") {
                    event = criterion.replace(/^minecraft:(\w+)$/, "led frog: $1");
                } else if (entry == "minecraft:husbandry/breed_an_animal") {
                    event = "bred animal";
                } else if (entry == "minecraft:nether/brew_potion") {
                    event = "brew potion";
                } else if (entry == "minecraft:husbandry/bred_all_animals") {
                    event = criterion.replace(/^minecraft:(\w+)$/, "bred: $1");
                } else if (entry == "minecraft:adventure/kill_all_mobs" || entry == "minecraft:adventure/kill_a_mob") {
                    event = criterion.replace(/^minecraft:(\w+)$/, "Killed: $1");
                } else if (entry == "minecraft:husbandry/plant_seed") {
                    event = `Planted first crop: ${criterion}`;
                } else {
                    event = criterion;
                }

                event = event.replace("_", "\u200B_\u200B");
                timeline.push([date, profileIndex, event]);
            }
        }
    })));
    timeline.sort((a, b) => a[2].localeCompare(b[2])).sort((a, b) => a[0].getTime() - b[0].getTime());
    removeDuplicateEvents(timeline);

    await usernamesPromise;
}