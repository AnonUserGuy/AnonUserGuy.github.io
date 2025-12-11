import * as global from "@js/global.js";
import { BinaryReader, MapHelper, WorldMap } from "@js/lib/MapHelper.js";

const uploadInput = document.getElementById("uploadInput") as HTMLInputElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const worldInfo = document.getElementById("worldInfo") as HTMLDivElement;

const layerOptions = document.getElementById("layerOptions") as HTMLDivElement;

const worldMap = new WorldMap(canvas);


WorldMap.layerNames.forEach((name, i) => {
    const checkbox = global.createElementEX("input", {
        "type": "checkbox",
        "id": `layer${i}`,
    }) as HTMLInputElement;
    if (i !== WorldMap.layerNames.length - 1) checkbox.checked = true;
    checkbox.addEventListener("click", doRender);
    const label = global.createElementEX("label", {
        "for": `layer${i}`
    }, [name]) as HTMLLabelElement;

    layerOptions.appendChild(global.createElementEX("div", {}, [
        checkbox,
        label
    ]))
})

uploadInput.addEventListener("change", async (event) => {
    if (uploadInput.files && uploadInput.files[0]) {
        global.loading(true);
        try {
            const buffer = await global.promiseFileAsArrayBuffer(uploadInput.files[0]) as ArrayBuffer;
            const fileReader = new BinaryReader(new Uint8Array(buffer));
            await MapHelper.Load(fileReader, worldMap);
            worldMap.renderLayers();
            doRender();
            getWorldInfo();
        } catch (e) {
            console.error(e);
        }
        global.loading(false);
    }
});

function doRender() {
    const layers = ([...layerOptions.childNodes] as HTMLDivElement[]).map(div => (div.firstChild as HTMLInputElement).checked);
    worldMap.render(layers);

    if (layers[layers.length - 1] || layers[0] && !layers.slice(1, layers.length - 1).some(val => val)) {
        canvas.classList.add("terraria-map-lighting");
    } else {
        canvas.classList.remove("terraria-map-lighting");
    }

    /* const toName = [String(worldMap.worldName)];
    if (!baseColor.checked) toName.push("baseless"); 
    if (!lightingColor.checked) toName.push("unlit"); 
    canvas.id = toName.join("-"); */
}

function getWorldInfo() {
    const contents = [
        global.createElementEX("span", {}, [
            global.createElementEX("b", {}, ["World Name: "]),
            String(worldMap.worldName),
        ]),
        global.createElementEX("span", {}, [
            global.createElementEX("b", {}, ["World ID: "]),
            String(worldMap.worldId),
        ]),
        global.createElementEX("span", {}, [
            global.createElementEX("b", {}, ["Version: "]),
            `${worldMap.release}, r${worldMap.revision}`,
        ]),
        global.createElementEX("span", {}, [
            global.createElementEX("b", {}, ["Dimensions: "]),
            `${worldMap.width}x${worldMap.height}`,
        ]),
        global.createElementEX("span", {}, [
            global.createElementEX("b", {}, ["Underground depth: "]),
            `${worldMap.worldSurfaceEstimated ? "~" : ""}${worldMap.worldSurface}`,
        ]),
        global.createElementEX("span", {}, [
            global.createElementEX("b", {}, ["Caverns depth: "]),
            `~${worldMap.cavernLayer}`,
        ]),
    ]
    worldInfo.replaceChildren(...contents);
    worldInfo.classList.add("text-entries");
    worldInfo.hidden = false;
}