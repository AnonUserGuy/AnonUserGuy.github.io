interface UUIDs {
    [key: string]: string;
}

export async function getMinecraftUsernamesFromUuids(uuids: string[]) {

    const storage = localStorage.getItem("usernames");
    const usernames: UUIDs = storage ? JSON.parse(storage) : {};
    const result: string[] = [];

    const responsePromises: Promise<any>[] = [];
    for (let i = 0; i < uuids.length; i++) {
        const unfixedUuid = uuids[i];
        const reg = /([a-z0-9]{8})-?([a-z0-9]{4})-?([a-z0-9]{4})-?([a-z0-9]{4})-?([a-z0-9]{12})/i;
        const match = unfixedUuid.match(reg);
        if (!match) {
            result[i] = "";
            continue;
        }

        const uuid = `${match[1]}-${match[2]}-${match[3]}-${match[4]}-${match[5]}`.toLowerCase()

        if (!(uuid in usernames)) {
            responsePromises.push(fetch(`https://api.ashcon.app/mojang/v2/user/${uuid}`).then(async (response) => {
                if (response.ok) {
                    const data = await response.json();
                    usernames[uuid] = data.username;
                } else if (response.status === 404) {
                    usernames[uuid] = "";
                }
            }).finally(() => {
                result[i] = usernames[uuid] || "";
            }));
        } else {
            result[i] = usernames[uuid] || "";
        }
    }

    await Promise.allSettled(responsePromises);

    localStorage.setItem("usernames", JSON.stringify(usernames));
    return result;
}

export async function getMinecraftUsernameFromUuid(uuid: string) {
    return (await getMinecraftUsernamesFromUuids([uuid]))[0];
}

