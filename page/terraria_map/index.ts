import * as global from "@js/global.js";
import WorldMapCanvas from "@js/lib/terraria/terraria-world-map-canvas.js";
import MapHelper from "@js/lib/terraria/terraria-map-helper.js";

const mapArea = document.getElementById("mapArea") as HTMLDivElement;
const mapContainer = document.getElementById("mapContainer") as HTMLDivElement;
const uploadInput = document.getElementById("uploadInput") as HTMLInputElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const worldName = document.getElementById("worldName") as HTMLHeadingElement;
const worldInfo = document.getElementById("worldInfo") as HTMLDivElement;
const tileInfo = document.getElementById("tileInfo") as HTMLDivElement;

const error = document.getElementById("error") as HTMLParagraphElement;
const info = document.getElementById("info") as HTMLParagraphElement;

const downloadImg = document.getElementById("downloadImg") as HTMLButtonElement;
const downloadSchem = document.getElementById("downloadSchem") as HTMLButtonElement;

const layerOptions = document.getElementById("layerOptions") as HTMLDivElement;
const layerCheckboxes: HTMLInputElement[] = [];

const zoomAmount = document.getElementById("zoomAmount") as HTMLInputElement;
const zoomIn = document.getElementById("zoomIn") as HTMLButtonElement;
const zoomOut = document.getElementById("zoomOut") as HTMLButtonElement;

const map = new WorldMapCanvas(canvas);
//@ts-ignore
window.map = map;
//@ts-ignore
window.mapHelper = MapHelper;

((layerNames: string[]) => {
    for (let i = layerNames.length - 1; i >= 0; i--) {
        let name = layerNames[i];

        const checkbox = global.createElementEX("input", {
            "type": "checkbox",
            "id": `layer${i}`,
        }) as HTMLInputElement;
        if (i !== WorldMapCanvas.layerNames.length - 1) checkbox.checked = true;
        checkbox.addEventListener("click", doDrawFast);
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


uploadInput.addEventListener("change", async (event) => {
    if (uploadInput.files && uploadInput.files[0]) {
        global.loading(true);
        mapArea.hidden = false;
        error.hidden = true;
        info.hidden = true;
        map.release = -1;
        try {
            const buffer = await global.promiseFileAsArrayBuffer(uploadInput.files[0]) as ArrayBuffer;
            await map.read(buffer);
            doDrawFast();
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
    if (layers[layers.length - 1] || layers[0] && !layers.slice(1, layers.length - 1).some(val => val)) {
        canvas.classList.add("terraria-map-lighting");
    } else {
        canvas.classList.remove("terraria-map-lighting");
    }
    return layers;
}
function doDrawFast() { 
    map.drawFast(doDraw()); 
}
function doDrawAccurate() { 
    map.drawAccurate(doDraw()); 
}


function getWorldInfo() {
    const contents = [
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
    worldInfo.parentElement!.hidden = false;
    tileInfo.textContent = "Click any tile for more info on it!";
    tileInfo.hidden = false;
}


let zoom: number;
pushZoomAmount();

function updateZoom(val: number) {
    const factor = val / zoom;
    mapContainer.scrollTop *= factor;
    mapContainer.scrollLeft *= factor;
    zoom = val;
    canvas.style.zoom = String(zoom);
}

function updateZoomAmount() {
    zoomAmount.value = String(zoom * 100) + "%";
}
function pushZoomAmount() {
    updateZoom(parseFloat(zoomAmount.value) / 100);
}

zoomAmount.addEventListener('click', (event) => {
    zoomAmount.value = String(zoom * 100);
});

zoomAmount.addEventListener('blur', updateZoomAmount);
zoomAmount.addEventListener('change', pushZoomAmount);

zoomIn.addEventListener('click', (event) => {
    updateZoom(zoom * 2);
    updateZoomAmount();
});
zoomOut.addEventListener('click', (event) => {
    updateZoom(zoom / 2);
    updateZoomAmount();
});

canvas.addEventListener('click', (event) => {
    const [x, y] = getCursorPosition(canvas, event);
    const tile = map.tile(x, y);
    tileInfo.textContent = `(${x},${y}): ${tile ? tile.toString() : "Empty"}`;
});

function getCursorPosition(canvas: HTMLElement, event: MouseEvent) {
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((event.clientX - rect.left) / parseFloat(canvas.style.zoom));
    const y = Math.floor((event.clientY - rect.top) / parseFloat(canvas.style.zoom));
    return [x, y];
}

canvas.addEventListener('contextmenu', doDrawAccurate);




downloadImg.addEventListener("click", (event) => {
    doDrawAccurate();
    canvas.toBlob((blob) => {
        if (blob) {
            global.download(blob, getFileName());
        }
    })
})

downloadSchem.addEventListener("click", (event) => {
    const blob = new Blob([map.writeSchematic() as ArrayBuffer]);
    global.download(blob, map.worldName + ".TEditSch"); 
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
