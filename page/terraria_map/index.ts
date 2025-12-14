import * as global from "@js/global.js";
import { BinaryReader, MapHelper, WorldMap } from "@js/lib/MapHelper.js";

const uploadInput = document.getElementById("uploadInput") as HTMLInputElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const download = document.getElementById("download") as HTMLButtonElement;
const worldInfo = document.getElementById("worldInfo") as HTMLDivElement;
const error = document.getElementById("error") as HTMLParagraphElement;

const layerOptions = document.getElementById("layerOptions") as HTMLDivElement;
const layerCheckboxes: HTMLInputElement[] = [];

const worldMap = new WorldMap(canvas);

((layerNames: string[]) => {
    for (let i = layerNames.length - 1; i >= 0; i--) {
        let name = layerNames[i];

        const checkbox = global.createElementEX("input", {
            "type": "checkbox",
            "id": `layer${i}`,
        }) as HTMLInputElement;
        if (i !== WorldMap.layerNames.length - 1) checkbox.checked = true;
        checkbox.addEventListener("click", doRender);
        const label = global.createElementEX("label", {
            "for": `layer${i}`
        }, [name]) as HTMLLabelElement;

        layerCheckboxes[i] = checkbox;
        layerOptions.prepend(global.createElementEX("div", {}, [
            checkbox,
            label
        ]))
    }
})(WorldMap.layerNames);

download.addEventListener("click", (event) => {
    const layers = layerCheckboxes.map(box => box.checked);
    const toName = [String(worldMap.worldName)];
    for (let i = 0; i < WorldMap.layerNames.length; i++) {
        if (layers[i]) {
            toName.push(WorldMap.layerNames[i])
        }
    }
    const name = toName.join("-");
    
    canvas.toBlob((blob) => {
        if (blob) {
            global.download(blob, name);
        }
    })
})

uploadInput.addEventListener("change", async (event) => {
    if (uploadInput.files && uploadInput.files[0]) {
        global.loading(true);
        error.hidden = true;
        try {
            const buffer = await global.promiseFileAsArrayBuffer(uploadInput.files[0]) as ArrayBuffer;
            const fileReader = new BinaryReader(new Uint8Array(buffer));
            await MapHelper.Load(fileReader, worldMap);
            doRender();
            getWorldInfo();
        } catch (e) {
            console.error(e);
            error.textContent = e!.toString();
            error.hidden = false;
        }
        global.loading(false);
    }
});

function doRender() {
    const layers = layerCheckboxes.map(box => box.checked);
    worldMap.render(layers);

    if (layers[layers.length - 1] || layers[0] && !layers.slice(1, layers.length - 1).some(val => val)) {
        canvas.classList.add("terraria-map-lighting");
    } else {
        canvas.classList.remove("terraria-map-lighting");
    }
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