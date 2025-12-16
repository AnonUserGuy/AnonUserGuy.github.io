import * as global from "@js/global.js";
import WorldMapCanvas from "@js/lib/terraria/terraria-world-map-canvas.js";
import MapHelper from "@js/lib/terraria/terraria-map-helper.js";

const uploadInput = document.getElementById("uploadInput") as HTMLInputElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const downloadImg = document.getElementById("downloadImg") as HTMLButtonElement;
const downloadSchem = document.getElementById("downloadSchem") as HTMLButtonElement;
const worldInfo = document.getElementById("worldInfo") as HTMLDivElement;

const error = document.getElementById("error") as HTMLParagraphElement;
const info = document.getElementById("info") as HTMLParagraphElement;

const layerOptions = document.getElementById("layerOptions") as HTMLDivElement;
const layerCheckboxes: HTMLInputElement[] = [];

const map = new WorldMapCanvas(canvas);
//@ts-ignore
window.map = map;


canvas.addEventListener('click', (event) => {
    const [x, y] = getCursorPosition(canvas, event);
    console.log(map.tile(x, y).Light);
});

function getCursorPosition(canvas: HTMLElement, event: MouseEvent) {
    const rect = canvas.getBoundingClientRect()
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);
    return [x, y];
}


((layerNames: string[]) => {
    for (let i = layerNames.length - 1; i >= 0; i--) {
        let name = layerNames[i];

        const checkbox = global.createElementEX("input", {
            "type": "checkbox",
            "id": `layer${i}`,
        }) as HTMLInputElement;
        if (i !== WorldMapCanvas.layerNames.length - 1) checkbox.checked = true;
        checkbox.addEventListener("click", doDraw);
        const label = global.createElementEX("label", {
            "for": `layer${i}`
        }, [name]) as HTMLLabelElement;

        layerCheckboxes[i] = checkbox;
        layerOptions.prepend(global.createElementEX("div", {}, [
            checkbox,
            label
        ]))
    }
})(WorldMapCanvas.layerNames);

downloadImg.addEventListener("click", (event) => {
    canvas.toBlob((blob) => {
        if (blob) {
            global.download(blob, getFileName());
        }
    })
})

downloadSchem.addEventListener("click", (event) => {
    /* const writer = new BinaryWriter();
    MapHelper.SaveAsSchematic(writer, worldMap);
    const blob = new Blob([writer.data.buffer as ArrayBuffer]);
    global.download(blob, getFileName() + ".TEditSch"); */
})

function getFileName() {
    const layers = layerCheckboxes.map(box => box.checked);
    const toName = [String(map.worldName)];
    for (let i = 0; i < WorldMapCanvas.layerNames.length; i++) {
        if (layers[i]) {
            toName.push(WorldMapCanvas.layerNames[i])
        }
    }
    return toName.join("-");
}

uploadInput.addEventListener("change", async (event) => {
    if (uploadInput.files && uploadInput.files[0]) {
        global.loading(true);
        error.hidden = true;
        info.hidden = true;
        map.release = -1;
        try {
            const buffer = await global.promiseFileAsArrayBuffer(uploadInput.files[0]) as ArrayBuffer;
            await map.read(buffer);
            doDraw();
            getWorldInfo();
        } catch (e) {
            console.error(e);
            error.textContent = e!.toString();
            error.hidden = false;
        }
        if (map.release! > MapHelper.lastestRelease) {
            info.textContent = `Warning: release ${map.release} newer than latest supported release (${MapHelper.lastestRelease}), might cause issues`
            info.hidden = false;
        }
        global.loading(false);
    }
});

function doDraw() {
    const layers = layerCheckboxes.map(box => box.checked);
    map.draw(layers);

    if (layers[layers.length - 1] || layers[0] && !layers.slice(1, layers.length - 1).some(val => val)) {
        canvas.classList.add("terraria-map-lighting");
    } else {
        canvas.classList.remove("terraria-map-lighting");
    }
}

function getWorldInfo() {
    const contents = [
        global.createElementEX("span", {}, [
            global.createElementEX("b", {}, [!map.isChinese ? "World Name: " : "世界名稱: "]),
            map.worldName,
        ]),
        global.createElementEX("span", {}, [
            global.createElementEX("b", {}, [!map.isChinese ? "World ID: " : "識別號碼: "]),
            map.worldId,
        ]),
        global.createElementEX("span", {}, [
            global.createElementEX("b", {}, [!map.isChinese ? "Version: " : "版本: "]),
            map.release,
        ]),
        global.createElementEX("span", {}, [
            global.createElementEX("b", {}, [!map.isChinese ? "Save count: " : "保存次數: "]),
            map.revision! > -1 ? map.revision : !map.isChinese ? "unknown" : "未知",
        ]),
        global.createElementEX("span", {}, [
            global.createElementEX("b", {}, [!map.isChinese ? "Dimensions: " : "尺寸: "]),
            `${map.width}x${map.height}`,
        ]),
        global.createElementEX("span", {}, [
            global.createElementEX("b", {}, [!map.isChinese ? "Underground depth: " : "地下深度: "]),
            `${map.worldSurfaceEstimated ? "~" : ""}${map.worldSurface}`,
        ]),
        global.createElementEX("span", {}, [
            global.createElementEX("b", {}, [!map.isChinese ? "Caverns depth: " : "洞穴深度: "]),
            `~${map.rockLayer}`,
        ]),
    ]
    worldInfo.replaceChildren(...contents);
    worldInfo.classList.add("text-entries");
    worldInfo.hidden = false;
}