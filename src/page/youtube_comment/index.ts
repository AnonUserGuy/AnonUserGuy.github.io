
interface Comment {
    id: string,
    channelId: string,
    timestamp: number,
    videoId: string,
    videoTitle?: string,
    isPost?: boolean,
    price?: number,
    parentId?: string,
    topLevelCommentId?: string,
    text: any[]
}

interface CSV {
    count: number,
    fields: { [key: string]: string[] }
}

const uploadInput = document.getElementById("uploadInput") as HTMLInputElement;
const resetInput = document.getElementById("resetInput") as HTMLButtonElement;
const commentsDiv = document.getElementById("commentsDiv") as HTMLDivElement;

let comments: Comment[] = [];

uploadInput.addEventListener("change", async () => {
    loading(true);
    await updateComments(uploadInput.files, comments);
    commentsPrint();
    loading(false);
});

resetInput.addEventListener("click", () => {
    comments = [];
    commentsPrint();
});

function commentsPrint() {
    console.log(comments);

    if (!comments.length) {
        commentsDiv.setAttribute("hidden", "");
        return;
    }

    commentsDiv.removeAttribute("hidden");
    commentsDiv.replaceChildren();

    for (const comment of comments) {
        const newEl = createElementEX("div", { "class": "comment" }, [
            createElementEX("div", { "class": "comment-header" }, [
                createElementEX("h3", {}, [
                    createElementEX("a", {
                        "href": `https://www.youtube.com/channel/${comment.channelId}`,
                        "target": "_blank"
                    }, [`@${comment.channelId}`]),
                    " > ",
                    createElementEX("a", {
                        "href": `https://${comment.isPost ? "www.youtube.com/post" : "youtu.be"}/${comment.videoId}`,
                        "target": "_blank"
                    }, [comment.videoId])
                ]),
                createElementEX("span", {}, [
                    createElementEX("a", {
                        "href": `https://${comment.isPost ? `www.youtube.com/post/${comment.videoId}?` : `youtu.be/${comment.videoId}&`}lc=${comment.id}`,
                        "target": "_blank"
                    }, [
                        createElementEX("time", { "datetime": `${comment.timestamp}` }, [
                            new Date(comment.timestamp).toLocaleString()
                        ])
                    ])
                ]),
            ]),
            createElementEX("div", { "class": "comment-body" }, comment.text.map((item) => {
                if (item.videoLink) {
                    const videoLink = item.videoLink;
                    return createElementEX("a", {
                        "href": `https://youtu.be/${videoLink.externalVideoId}${videoLink.startTimeSeconds ? `&t=${videoLink.startTimeSeconds}` : ""}`,
                        "target": "_blank"
                    }, [item.text]);

                } else if (item.hashtag) {
                    const hashtag = item.hashtag;
                    return createElementEX("a", {
                        "href": `https://www.youtube.com/hashtag/${hashtag.hashtagId}`,
                        "target": "_blank"
                    }, [item.text]);

                } else if (item.mention) {
                    const mention = item.mention;
                    return createElementEX("span", {}, [
                        createElementEX("a", {
                            "href": `https://www.youtube.com/channel/${mention.externalChannelId}`,
                            "target": "_blank"
                        }, [item.text]),
                        " "
                    ]);
                } else if (item.text === "\n") {
                    return createElementEX("br");
                } else {
                    /* const keys = Object.keys(item);
                    if (keys.length > 1) {
                        console.log(keys);
                    } */
                    
                    return item.text;
                }
            }))
        ]);
        commentsDiv.appendChild(newEl);
    }
}

async function updateComments(uploadedFiles: FileList | null, comments: Comment[]) {
    if (!uploadedFiles) return;
    const files = Array.from(uploadedFiles);
    await Promise.allSettled(files.map((file, i) => promiseFileAsText(file).then((text) => {
        if (!text) return;
        insertComments(comments, parseCommentCSV(text));
    })));
}

function parseCommentCSV(text: string) {
    const csv = parseCSV(text, ["Comment ID", "Channel ID", "Comment Create Timestamp", "Comment Text"]);

    if (!csv.fields["Post ID"] && !csv.fields["Video ID"]) {
        throw new TypeError("CSV has neither a \"Post ID\" field nor a \"Video ID\" field.");
    }

    const newComments: Comment[] = [];

    for (let i = 0; i < csv.count; i++) {
        const textJson = csv.fields["Comment Text"][i];
        let text: any[];
        try {
            text = JSON.parse(`[${textJson}]`);
        } catch (e) {
            console.error(`Invalid Comment Text field: \"${textJson}\"`);
            text = [];
        }

        const timestamp = Date.parse(csv.fields["Comment Create Timestamp"][i]);

        let videoId: string;
        let isPost: boolean;
        if (csv.fields["Post ID"] && csv.fields["Post ID"][i]) {
            videoId = csv.fields["Post ID"][i];
            isPost = true;
        } else {
            videoId = csv.fields["Video ID"][i];
            isPost = false;
        }

        newComments[i] = {
            id: csv.fields["Comment ID"][i],
            videoId: videoId.trim(),
            channelId: csv.fields["Channel ID"][i],
            timestamp: timestamp,
            text: text
        }

        if (isPost) {
            newComments[i].isPost = true;
        }
    }

    if (csv.fields["Price"]) {
        for (let i = 0; i < csv.count; i++) {
            const x = parseFloat(csv.fields["Price"][i]);
            if (x) {
                newComments[i].price = x;
            }
        }
    }

    if (csv.fields["Parent Comment ID"]) {
        for (let i = 0; i < csv.count; i++) {
            const x = csv.fields["Parent Comment ID"][i];
            if (x) {
                newComments[i].parentId = x;
            }
        }
    }

    if (csv.fields["Top-Level Comment ID"]) {
        for (let i = 0; i < csv.count; i++) {
            const x = csv.fields["Top-Level Comment ID"][i];
            if (x) {
                newComments[i].topLevelCommentId = x;
            }
        }
    }
    return newComments;
}

function insertComments(a: Comment[], b: Comment[]) {
    let i = 0, j = 0;

    while (i < a.length && j < b.length) {
        const compare = b[j].timestamp - a[i].timestamp;
        if (compare > 0) {
            a.splice(i, 0, b[j]);
            i++;
            j++;
        } else if (compare < 0) {
            i++;
        } else {
            if (b[j].id !== a[i].id) {
                i++;
                a.splice(i, 0, b[j]);
            }
            j++;
        }
    }

    // If any elements remain in b, add to end
    while (j < b.length) {
        a.push(b[j]);
        j++;
    }

    return a;
}

function* parseCSVRow(row: string) {
    const reg = /(?:^|,)(?:"((?:[^"]|"")*)"|([^",]*))/g;
    if (row.startsWith(",")) {
        yield "";
        row = row.substring(1);
    }
    for (const match of row.matchAll(reg)) {
        if (match[1]) {
            yield match[1].replaceAll("\"\"", "\"");
        } else {
            yield match[2];
        }
    }
}

function parseCSV(text: string, requiredFields?: string[]): CSV {
    let rows = text.split("\n");

    let count = rows.length - 1;
    for (; count > 1 && !rows[count]; count--);

    const header = [...parseCSVRow(rows[0])];
    if (requiredFields) {
        const missingFields: string[] = []
        for (const field of requiredFields) {
            if (!header.includes(field)) {
                missingFields.push(field);
            }
        }
        if (missingFields.length > 0) {
            throw new TypeError(`CSV missing required fields: \"${missingFields.join("\", \"")}\"`);
        }
    }

    let fields: { [key: string]: string[] } = {};
    for (const field of header) {
        fields[field] = [];
    }

    for (let i = 1; i <= count; i++) {
        const row = rows[i];
        const cells = [...parseCSVRow(row)];
        for (let j = 0; j < header.length; j++) {
            fields[header[j]].push(cells[j]);
        }
    }

    return { count, fields };
}

export { }