interface IDs {
    [key: string]: string | number;
}
interface AwaitingID {
    [key: string]: number[];
}

export async function getVideoTitlesFromIds(ids: string[]) {

    const storage = localStorage.getItem("youtubeVideoTitles");
    const videoTitles: IDs = storage ? JSON.parse(storage) : {};
    const result: (string | number)[] = [];

    const responsePromises: Promise<any>[] = [];
    const responseIndices: AwaitingID = {};

    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        if (!id) {
            continue;
        }
        const reg = /^([\w\-]{11})$/;
        const match = id.match(reg);
        if (!match) {
            result[i] = 0;
            continue;
        }

        if (!(id in videoTitles)) {
            if (!responseIndices[id]) {
                responseIndices[id] = [i];
            } else {
                responseIndices[id].push(i);
                continue;
            }

            responsePromises.push(fetch(`https://www.youtube.com/oembed?url=youtube.com/watch?v=${id}&format=json`).then(async (response) => {
                if (response.ok) {
                    const data = await response.json();
                    videoTitles[id] = data.title;
                } else {
                    videoTitles[id] = response.status;
                }
            }).finally(() => {
                for (const index of responseIndices[id]) {
                    result[index] = videoTitles[id];
                }
            }));
        } else {
            result[i] = videoTitles[id];
        }
    }

    await Promise.allSettled(responsePromises);

    localStorage.setItem("youtubeVideoTitles", JSON.stringify(videoTitles));
    return result;
}

export async function getVideoTitleFromId(id: string) {
    return (await getVideoTitlesFromIds([id]))[0];
}

export async function getUsernamesFromIds(ids: string[]) {
    
    const storage = localStorage.getItem("youtubeUsernames");
    const usernames: IDs = storage ? JSON.parse(storage) : {};
    const result: (string | number)[] = [];

    const responsePromises: Promise<any>[] = [];
    const responseIndices: AwaitingID = {};

    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        if (!id) {
            continue;
        }
        const reg = /^[\w\-]{24}$/;
        const match = id.match(reg);
        if (!match) {
            result[i] = 0;
            continue;
        }

        if (!(id in usernames) || usernames[id] === -1) {
            if (!responseIndices[id]) {
                responseIndices[id] = [i];
            } else {
                responseIndices[id].push(i);
                continue;
            }

            responsePromises.push(fetch(`https://banner.yt/api/channel/${id}`).then(async (response) => {
                if (response.ok) {
                    const data = await response.json();
                    if (data.handle) {
                        usernames[id] = data.handle;
                    } else {
                        // not found requests don't return 404, they return 200 with all empty fields
                        usernames[id] = 404;
                    }
                } else {
                    usernames[id] = response.status;
                }
            }).finally(() => {
                usernames[id] ||= -1; // probably blocked by adblocker
                for (const index of responseIndices[id]) {
                    result[index] = usernames[id];
                }
            }));
        } else {
            result[i] = usernames[id];
        }
    }

    await Promise.allSettled(responsePromises);

    localStorage.setItem("youtubeUsernames", JSON.stringify(usernames));
    return result;
}