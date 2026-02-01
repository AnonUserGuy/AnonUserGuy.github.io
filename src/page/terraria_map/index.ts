import { WorldMapCanvas } from "terraria-minimap-visualizer";
import mapData from "./terraria-map-data.json";

const grid = document.getElementById("grid") as HTMLDivElement;
const mapArea = document.getElementById("mapArea") as HTMLDivElement;
const mapContainer = document.getElementById("mapContainer") as HTMLDivElement;
const uploadInput = document.getElementById("uploadInput") as HTMLInputElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const worldName = document.getElementById("worldName") as HTMLHeadingElement;
const worldBId = document.getElementById("worldBId") as HTMLElement;
const worldId = document.getElementById("worldId") as HTMLSpanElement;
const worldBVersion = document.getElementById("worldBVersion") as HTMLElement;
const worldVersion = document.getElementById("worldVersion") as HTMLSpanElement;
const worldBRevision = document.getElementById("worldBRevision") as HTMLElement;
const worldRevision = document.getElementById("worldRevision") as HTMLSpanElement;
const worldBDimensions = document.getElementById("worldBDimensions") as HTMLElement;
const worldDimensions = document.getElementById("worldDimensions") as HTMLSpanElement;
const worldBSurface = document.getElementById("worldBSurface") as HTMLElement;
const worldSurfaceEstimated = document.getElementById("worldSurfaceEstimated") as HTMLSpanElement;
const worldSurface = document.getElementById("worldSurface") as HTMLInputElement;
const worldBRockLayer = document.getElementById("worldBRockLayer") as HTMLElement;
const worldRockLayerEstimated = document.getElementById("worldRockLayerEstimated") as HTMLSpanElement;
const worldRockLayer = document.getElementById("worldRockLayer") as HTMLInputElement;
const worldBUnderworldLayer = document.getElementById("worldBUnderworldLayer") as HTMLSpanElement;
const worldUnderworldLayer = document.getElementById("worldUnderworldLayer") as HTMLElement;
const updateDepth = document.getElementById("updateDepth") as HTMLButtonElement;
const worldInfo = document.getElementById("worldInfo") as HTMLDivElement;
const tileInfo = document.getElementById("tileInfo") as HTMLDivElement;

const error = document.getElementById("error") as HTMLParagraphElement;
const info = document.getElementById("info") as HTMLParagraphElement;
const updatedNote = document.getElementById("updatedNote") as HTMLParagraphElement;

const downloadImg = document.getElementById("downloadImg") as HTMLButtonElement;
const downloadSchem = document.getElementById("downloadSchem") as HTMLButtonElement;

const layerOptions = document.getElementById("layerOptions") as HTMLDivElement;
const layerCheckboxes: HTMLInputElement[] = [];

const zoomAmount = document.getElementById("zoomAmount") as HTMLInputElement;
const zoomIn = document.getElementById("zoomIn") as HTMLButtonElement;
const zoomOut = document.getElementById("zoomOut") as HTMLButtonElement;

const map = new WorldMapCanvas(mapData, canvas);

((layerNames: string[]) => {
    for (let i = layerNames.length - 1; i >= 0; i--) {
        let name = layerNames[i];

        const checkbox = createElementEX("input", {
            "type": "checkbox",
            "id": `layer${i}`,
        }) as HTMLInputElement;
        if (i !== WorldMapCanvas.layerNames.length - 1) checkbox.checked = true;
        checkbox.addEventListener("click", doDrawFast);
        const label = createElementEX("label", {
            "for": `layer${i}`
        }, [name]) as HTMLLabelElement;

        layerCheckboxes[i] = checkbox;
        layerOptions.prepend(createElementEX("div", {}, [
            checkbox,
            label
        ]))
    }
})(WorldMapCanvas.layerNames);
updatedNote.innerText = `Updated as of v${map.mapData.latestVersion()}`;

uploadInput.addEventListener("change", async (event) => {
    if (uploadInput.files && uploadInput.files[0]) {
        loading(true);
        grid.classList.add("terraria-map-grid");
        mapArea.hidden = false;
        error.hidden = true;
        info.hidden = true;
        map.release = -1;
        try {
            const buffer = await promiseFileAsArrayBuffer(uploadInput.files[0]) as ArrayBuffer;
            await map.read(buffer);
            doDrawFast();
            getWorldInfo();
        } catch (e) {
            console.error(e);
            error.textContent = e!.toString();
            error.hidden = false;
        }
        if (!map.isReleaseSafe()) {
            info.textContent = `Warning: release ${map.release} newer than latest supported release (${mapData.release}), might cause issues`
            info.hidden = false;
        }
        loading(false);
    }
});

function getActiveLayers() {
    const layers = layerCheckboxes.map(box => box.checked);
    if (layers[layers.length - 1] || layers[0] && !layers.slice(1, layers.length - 1).some(val => val)) {
        canvas.classList.add("terraria-map-lighting");
    } else {
        canvas.classList.remove("terraria-map-lighting");
    }
    return layers;
}
function doDrawFast() { 
    map.drawFast(getActiveLayers()); 
}
function doDrawAccurate() { 
    map.drawAccurate(getActiveLayers()); 
}


function getWorldInfo() {
    worldName.textContent = map.worldName;

    if (map.isChinese) {
        worldBId.textContent = "識別號碼: ";
        worldBVersion.textContent = "版本: ";
        worldBRevision.textContent = "保存次數: ";
        worldBDimensions.textContent = "尺寸: ";
        worldBSurface.textContent = "地下深度: ";
        worldBRockLayer.textContent = "洞穴深度: ";
        worldBUnderworldLayer.textContent = "冥界深度: ";
    } else {
        worldBId.textContent = "ID: ";
        worldBVersion.textContent = "Version: ";
        worldBRevision.textContent = "Save Count: ";
        worldBDimensions.textContent = "Dimensions: ";
        worldBSurface.textContent = "Underground Depth: ";
        worldBRockLayer.textContent = "Caverns Depth: ";
        worldBUnderworldLayer.textContent = "Underworld Depth: ";
    }

    worldId.textContent = String(map.worldId);
    worldVersion.textContent = `${map.version} (${map.release})`;
    worldRevision.textContent = map.revision > -1 ? String(map.revision) : !map.isChinese ? "Unknown" : "未知";
    worldDimensions.textContent = `${map.width}x${map.height}`;
    worldSurface.value = String(map.worldSurface);
    worldSurfaceEstimated.hidden = !map.worldSurfaceEstimated;
    worldRockLayer.value = String(map.rockLayer);
    worldRockLayerEstimated.hidden = !map.rockLayerEstimated;
    worldUnderworldLayer.textContent = String(map.underworldLayer);

    worldInfo.classList.add("text-entries");
    worldInfo.parentElement!.hidden = false;
    tileInfo.textContent = "Click any tile for more info on it!";
    tileInfo.hidden = false;
}

updateDepth.addEventListener("click", (event) => {
    const newWorldSurface = parseInt(worldSurface.value);
    const newRockLayer = parseInt(worldRockLayer.value);
    
    let dirty = false;
    if (newWorldSurface !== map.worldSurface) {
        map.worldSurface = newWorldSurface;
        map.worldSurfaceEstimated = false;
        dirty = true;
    }
    if (newRockLayer !== map.rockLayer) {
        map.rockLayer = newRockLayer;
        map.rockLayerEstimated = false;
        dirty = true;
    }

    if (dirty) {
        map.redrawAirLayer();
        doDrawFast();
        getWorldInfo();
    }
});


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
    tileInfo.textContent = map.getString(x, y);
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
            download(blob, getFileName());
        }
    })
})

downloadSchem.addEventListener("click", (event) => {
    const blob = new Blob([map.writeSchematic() as ArrayBuffer]);
    download(blob, map.worldName + ".TEditSch"); 
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
