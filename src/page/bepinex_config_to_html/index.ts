
const uploadInput = document.getElementById("uploadInput") as HTMLInputElement;
const realTableSection = document.getElementById("realTableSection") as HTMLDivElement;
const copyOutput = document.getElementById("copyOutput") as HTMLButtonElement;

uploadInput.addEventListener("change", () => {
    if (!uploadInput.files) {
        return;
    }
    var fileReader = new FileReader();

    fileReader.onload = function () {
        const table = doThing(fileReader.result as string);
        realTableSection.replaceChildren(table);
        copyOutput.removeAttribute("disabled");
    }

    fileReader.readAsText(uploadInput.files[0]);
});

copyOutput.addEventListener("click", () => {
    let text = realTableSection.innerHTML;
    text = text.replaceAll(/(\r\n|\n|\r)/gm, "").replaceAll(/(<tr>.*?<\/tr>)/gs, "$1\n");
    console.log(text);
    navigator.clipboard.writeText(text);
});

function doThing(text: string): HTMLTableElement {
    const table = createElementEX("table", {}, [
        createElementEX("tr", {}, [
            createElementEX("th", {}, [
                "Name"
            ]),
            createElementEX("th", {}, [
                "Type"
            ]),
            createElementEX("th", {}, [
                "Default"
            ]),
            createElementEX("th", {}, [
                "Description"
            ])
        ])
    ]) as HTMLTableElement;

    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let match = line.match(/^\[(.*)\]$/m);
        if (match) {
            table.appendChild(
                createElementEX("tr", {}, [
                    createElementEX("th", {"colspan": "4"}, [
                        match[1]
                    ])
                ])
            );
            continue;
        }
        match = line.match(/^([^#\[].*?)\s*=/m);
        if (match) {
            const name = match[1];
            let type: string | null = null;
            let defaultVal: string | null = null;
            let description: string[] = [];
            for (let j = i - 1; j > 0; j--) {
                const line2 = lines[j];
                if (!defaultVal) {
                    const match2 = line2.match(/^# Default value: (.*)$/m);
                    if (match2) {
                        defaultVal = match2[1];
                        continue;
                    }
                } else if (!type) {
                    const match2 = line2.match(/^# Setting type: (\w*)$/m);
                    if (match2) {
                        type = match2[1];
                        
                        for (let line3 = lines[--j]; j > 0 && line3.startsWith("## "); line3 = lines[--j]) {
                            description.unshift(line3.substring(3, line3.endsWith("\n") ? line3.length - 1 : line3.length)); 
                        }
                        continue;
                    }
                } else {
                    break;
                }
            }
            table.appendChild(
                createElementEX("tr", {}, [
                    createElementEX("td", {}, [
                        createElementEX("code", {}, [
                            name
                        ])
                    ]),
                    createElementEX("td", {}, [
                        type
                    ]),
                    createElementEX("td", {}, [
                        createElementEX("code", {}, [
                            defaultVal
                        ])
                    ]),
                    createElementEX("td", {}, description.length !== 1 ?
                        description.map(desc => createElementEX("p", {}, [
                            desc
                        ])) : [description[0]]
                    )
                ])
            );
        }
    }
    return table;
}

export {}