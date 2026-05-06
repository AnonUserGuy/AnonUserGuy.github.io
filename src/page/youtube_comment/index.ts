import * as info from "@js/get_youtube_info.js";

enum CommentType {
    Comment,
    Post,
    LiveChat,
}

interface Comment {
    id: string,
    userId: string,
    username?: string,
    timestamp: number,
    videoId: string,
    videoTitle?: string,
    type: CommentType,
    price?: number,
    parentId?: string,
    topLevelId?: string,
    text: any[]
}

interface CSV {
    count: number,
    fields: { [key: string]: string[] }
}

const uploadInput = document.getElementById("uploadInput") as HTMLInputElement;
const resetInput = document.getElementById("resetInput") as HTMLButtonElement;
const getInput = document.getElementById("getInput") as HTMLInputElement;
const commentsDiv = document.getElementById("commentsDiv") as HTMLDivElement;

const errorsDiv = document.getElementById("error") as HTMLDivElement;
let errors: string[] = [];

let comments: Comment[] = [];
let uniquePosts: string[] = [];
let uniqueUnknownVideos: string[] = [];
let uniqueUnknownUsers: string[] = [];

uploadInput.addEventListener("change", async () => {
    loading(true);
    errors = [];
    await updateComments(uploadInput.files, comments, getInput.checked, errors);
    errorsPrint();
    commentsPrint();
    loading(false);
});

resetInput.addEventListener("click", () => {
    errors = [];
    comments = [];
    uniquePosts = [];
    uniqueUnknownVideos = [];
    uniqueUnknownUsers = [];
    errorsPrint();
    commentsPrint();
});

function getUniqueIndex<T>(id: T, source: T[]) {
    let index = source.indexOf(id);
    if (index === -1) {
        index = source.length;
        source.push(id);
    }
    return index;
}

function errorsPrint() {
    if (!errors.length) {
        errorsDiv.setAttribute("hidden", "");
        return;
    }
    errorsDiv.removeAttribute("hidden");
    errorsDiv.replaceChildren(...errors.map(error => createElementEX("p", {}, [error])));
}

function commentsPrint() {
    console.log(comments);

    if (!comments.length) {
        commentsDiv.setAttribute("hidden", "");
        return;
    }

    commentsDiv.removeAttribute("hidden");
    commentsDiv.replaceChildren();

    for (const comment of comments) {

        const commentBody = comment.text.map((item) => {
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
            } else if (item.emoji) {
                const emoji = item.emoji;
                return createElementEX("img", {
                    "src": emoji.customEmojiUrl,
                    "alt": "custom emoji "
                });

            } else if (item.text === "\n") {
                return createElementEX("br");

            } else {

                /* const keys = Object.keys(item);
                if (keys.length > 1) {
                    console.log(keys);
                } */

                return item.text;
            }
        });

        if (comment.type === CommentType.LiveChat) {
            commentBody.unshift(createElementEX("div", { "class": "comment-livechat" }, ["🗨 Live Chatted"]));
        } else if (comment.parentId) {
            const reply: any[] = [
                createElementEX("a", {
                    "href": `https://${comment.type === CommentType.Post ? `www.youtube.com/post/${comment.videoId}?` : `youtu.be/${comment.videoId}&`}lc=${comment.parentId}`,
                    "target": "_blank"
                }, ["⤷ Replied"])
            ];
            if (comment.parentId !== comment.topLevelId) {
                reply.push(
                    " ",
                    createElementEX("a", {
                        "href": `https://${comment.type === CommentType.Post ? `www.youtube.com/post/${comment.videoId}?` : `youtu.be/${comment.videoId}&`}lc=${comment.topLevelId}`,
                        "target": "_blank"
                    }, ["(Top)"])
                );
            }
            commentBody.unshift(createElementEX("div", { "class": "comment-reply" }, reply));
        }

        const newEl = createElementEX("div", { "class": "comment" }, [
            createElementEX("div", { "class": "comment-header" }, [
                createElementEX("h3", {}, [
                    createElementEX("a", {
                        "href": `https://www.youtube.com/channel/${comment.userId}`,
                        "target": "_blank"
                    }, [comment.username || createElementEX("i", {}, [`Unavailable user #${getUniqueIndex(comment.userId, uniqueUnknownUsers) + 1}`])]),
                    " > ",
                    createElementEX("a", {
                        "href": `https://${comment.type === CommentType.Post ? "www.youtube.com/post" : "youtu.be"}/${comment.videoId}`,
                        "target": "_blank"
                    }, [comment.type === CommentType.Post ? createElementEX("i", {}, [`Some community post #${getUniqueIndex(comment.videoId, uniquePosts) + 1}`]) :
                        comment.videoTitle || createElementEX("i", {}, [`Unavailable video #${getUniqueIndex(comment.videoId, uniqueUnknownVideos) + 1}`])
                    ])
                ]),
                createElementEX("span", {}, [
                    createElementEX("a", {
                        "href": `https://${comment.type === CommentType.Post ? `www.youtube.com/post/${comment.videoId}?` : `youtu.be/${comment.videoId}&`}lc=${comment.id}`,
                        "target": "_blank"
                    }, [
                        createElementEX("time", { "datetime": `${comment.timestamp}` }, [
                            new Date(comment.timestamp).toLocaleString()
                        ])
                    ])
                ]),
            ]),
            createElementEX("div", { "class": "comment-body" }, commentBody)
        ]);
        commentsDiv.appendChild(newEl);
    }
}

async function updateComments(uploadedFiles: FileList | null, comments: Comment[], getData: boolean, errors: string[]) {
    if (!uploadedFiles) return;
    const files = Array.from(uploadedFiles);
    const newComments: Comment[] = [];

    const results = await Promise.allSettled(files.map(file => promiseFileAsText(file).then((text) => {
        if (!text) return;
        insertComments(newComments, parseCommentCSV(text));
    })));
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === "rejected") {
            const error = `File \"${uploadedFiles[i].name}\" failed: ${result.reason}`;
            console.error(error);
            errors.push(error);
        }
    }

    if (getData) {
        await Promise.allSettled([
            info.getVideoTitlesFromIds(newComments.map(comment => comment.videoId)).then(videoTitles => {
                for (let i = 0; i < videoTitles.length; i++) {
                    if (videoTitles[i]) {
                        newComments[i].videoTitle = videoTitles[i];
                    }
                }
            }),
            info.getUsernamesFromIds(newComments.map(comment => comment.userId)).then(usernames => {
                for (let i = 0; i < usernames.length; i++) {
                    if (usernames[i]) {
                        newComments[i].username = usernames[i];
                    } 
                }
            })
        ])
    }
    insertComments(comments, newComments);
}

function parseCommentCSV(text: string) {
    const csv = parseCSV(text);

    if (!csv.fields["Channel ID"]) {
        throw new TypeError("CSV is missing \"Channel ID\" field.");
    }

    let comment: string;
    let isLiveChat: boolean;
    if (csv.fields["Comment ID"] && csv.fields["Comment Create Timestamp"] && csv.fields["Comment Text"]) {
        comment = "Comment";
        isLiveChat = false;
    } else if (csv.fields["Live Chat ID"] && csv.fields["Live Chat Create Timestamp"] && csv.fields["Live Chat Text"]) {
        comment = "Live Chat";
        isLiveChat = true;
    } else {
        throw new TypeError("CSV is missing required comment fields or live chat fields.");
    }
    const commentText = `${comment} Text`;
    const commentCreateTimestamp = `${comment} Create Timestamp`;
    const commentId = `${comment} ID`;

    if (!csv.fields["Post ID"] && !csv.fields["Video ID"]) {
        throw new TypeError("CSV is missing a \"Post ID\" field or a \"Video ID\" field.");
    }

    const newComments: Comment[] = [];

    for (let i = 0; i < csv.count; i++) {
        const textJson = csv.fields[commentText][i];
        let text: any[];
        try {
            text = JSON.parse(`[${textJson}]`);
        } catch (e) {
            console.error(`Invalid Comment Text field: \"${textJson}\"`);
            text = [];
        }

        const timestamp = Date.parse(csv.fields[commentCreateTimestamp][i]);

        let videoId: string;
        let isPost: boolean;
        if (!isLiveChat && csv.fields["Post ID"] && csv.fields["Post ID"][i]) {
            videoId = csv.fields["Post ID"][i];
            isPost = true;
        } else {
            videoId = csv.fields["Video ID"][i];
            isPost = false;
        }

        newComments[i] = {
            id: csv.fields[commentId][i],
            videoId: videoId.trim(),
            userId: csv.fields["Channel ID"][i],
            timestamp: timestamp,
            type: isLiveChat ? CommentType.LiveChat : isPost ? CommentType.Post : CommentType.Comment,
            text: text
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
                newComments[i].topLevelId = x;
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

function parseCSV(text: string, /*requiredFields?: string[]*/): CSV {
    let rows = text.split("\n");

    let count = rows.length - 1;
    for (; count > 1 && !rows[count]; count--);

    const header = [...parseCSVRow(rows[0])];
    /* if (requiredFields) {
        const missingFields: string[] = []
        for (const field of requiredFields) {
            if (!header.includes(field)) {
                missingFields.push(field);
            }
        }
        if (missingFields.length > 0) {
            throw new TypeError(`CSV missing required fields: \"${missingFields.join("\", \"")}\"`);
        }
    } */

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