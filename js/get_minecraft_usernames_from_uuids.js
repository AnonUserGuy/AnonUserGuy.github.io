async function get_minecraft_usernames_from_uuids(uuids) {
        
    const storage = localStorage.getItem("usernames")
    const usernames = storage ? JSON.parse(storage) : {};
    const result = []

    for (let i = 0; i < uuids.length; i++) {
        const unfixedUuid = uuids[i]
        const reg = /([a-z0-9]{8})-?([a-z0-9]{4})-?([a-z0-9]{4})-?([a-z0-9]{4})-?([a-z0-9]{12})/i;
        const match = unfixedUuid.match(reg);
        if (!match) {
            result[i] = "";
            continue;
        }

        const uuid = `${match[1]}-${match[2]}-${match[3]}-${match[4]}-${match[5]}`.toLowerCase()
        
        if (!(uuid in usernames)) {
            const response = await fetch(`https://api.ashcon.app/mojang/v2/user/${uuid}`);
            if (response.ok) {
                const data = await response.json();
                usernames[uuid] = data.username;
            } else if (response.status === 400) {
                usernames[uuid] = "";
            }
        }

        result[i] = usernames[uuid];
    }

    localStorage.setItem("usernames", JSON.stringify(usernames));
    return result
}

async function get_minecraft_username_from_uuid(uuid) {
    return (await get_minecraft_usernames_from_uuids([uuid]))[0];
}