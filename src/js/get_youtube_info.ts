interface IDs {
    [key: string]: string;
}

export async function getVideoTitlesFromIds(ids: string[]) {

    const storage = localStorage.getItem("videoTitles");
    const videoTitles: IDs = storage ? JSON.parse(storage) : {};
    const result: string[] = [];

    const responsePromises: Promise<any>[] = [];
    for (let i = 0; i < ids.length; i++) {
        const unfixedId = ids[i];
        const reg = /([\w\-]{11})/i;
        const match = unfixedId.match(reg);
        if (!match) {
            result[i] = "";
            continue;
        }

        const id = match[1];

        if (!(id in videoTitles)) {
            responsePromises.push(fetch(`https://www.youtube.com/oembed?url=youtube.com/watch?v=${id}&format=json`).then(async (response) => {
                if (response.ok) {
                    const data = await response.json();
                    videoTitles[id] = data.title;
                } else if (response.status === 404) {
                    videoTitles[id] = "";
                }
            }).finally(() => {
                result[i] = videoTitles[id] || "";
            }));
        } else {
            result[i] = videoTitles[id] || "";
        }
    }

    await Promise.allSettled(responsePromises);

    localStorage.setItem("videoTitles", JSON.stringify(videoTitles));
    return result;
}

export async function getVideoTitleFromId(uuid: string) {
    return (await getVideoTitlesFromIds([uuid]))[0];
}
