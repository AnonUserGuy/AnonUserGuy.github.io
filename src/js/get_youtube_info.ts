interface IDs {
    [key: string]: string;
}
interface AwaitingID {
    [key: string]: number[];
}

export async function getVideoTitlesFromIds(ids: string[]) {

    const storage = localStorage.getItem("videoTitles");
    const videoTitles: IDs = storage ? JSON.parse(storage) : {};
    const result: string[] = [];

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
            result[i] = "";
            continue;
        }

        if (!(id in videoTitles)) {
            if (!responseIndices[id]) {
                responseIndices[id] = [i];
            } else {
                responseIndices[id].push(i);
            }

            responsePromises.push(fetch(`https://www.youtube.com/oembed?url=youtube.com/watch?v=${id}&format=json`).then(async (response) => {
                if (response.ok) {
                    const data = await response.json();
                    videoTitles[id] = data.title;
                } else {
                    videoTitles[id] = "";
                }
            }).finally(() => {
                for (const index of responseIndices[id]) {
                    result[index] = videoTitles[id] || "";
                }
            }));
        } else {
            result[i] = videoTitles[id] || "";
        }
    }

    await Promise.allSettled(responsePromises);

    localStorage.setItem("videoTitles", JSON.stringify(videoTitles));
    return result;
}

export async function getVideoTitleFromId(id: string) {
    return (await getVideoTitlesFromIds([id]))[0];
}

export async function getUsernamesFromIds(ids: string[]) {
    
    const storage = localStorage.getItem("usernames");
    const usernames: IDs = storage ? JSON.parse(storage) : {};
    const result: string[] = [];

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
            result[i] = "";
            continue;
        }

        if (!(id in usernames)) {
            if (!responseIndices[id]) {
                responseIndices[id] = [i];
            } else {
                responseIndices[id].push(i);
            }

            responsePromises.push(fetch(`https://banner.yt/api/channel/${id}`).then(async (response) => {
                if (response.ok) {
                    const data = await response.json();
                    usernames[id] = data.handle;
                } else {
                    usernames[id] = "";
                }
            }).finally(() => {
                for (const index of responseIndices[id]) {
                    result[index] = usernames[id] || "";
                }
            }));
        } else {
            result[i] = usernames[id] || "";
        }
    }

    await Promise.allSettled(responsePromises);

    localStorage.setItem("usernames", JSON.stringify(usernames));
    return result;
}