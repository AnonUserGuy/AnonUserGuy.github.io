import * as global from "@js/global.js";
import { BinaryReader, MapHelper, WorldMap } from "@js/lib/MapHelper.js";

const uploadInput = document.getElementById("uploadInput") as HTMLInputElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const worldInfo = document.getElementById("worldInfo") as HTMLDivElement;

const baseColor = document.getElementById("baseColor") as HTMLInputElement;
const paintedColor = document.getElementById("paintedColor") as HTMLInputElement;
const lightingColor = document.getElementById("lightingColor") as HTMLInputElement;

baseColor.addEventListener("change", doRender);
paintedColor.addEventListener("change", doRender);
lightingColor.addEventListener("change", doRender);

const worldMap = new WorldMap(canvas);

uploadInput.addEventListener("change", async (event) => {
    if (uploadInput.files && uploadInput.files[0]) {
        global.loading(true);
        try {
            const buffer = await global.promiseFileAsArrayBuffer(uploadInput.files[0]) as ArrayBuffer;
            const fileReader = new BinaryReader(new Uint8Array(buffer));
            await MapHelper.Load(fileReader, worldMap);
            doRender();
            getWorldInfo();
        } catch (e) {
            console.error(e);
        }
        global.loading(false);
    }
});

function doRender() {
    worldMap.render(baseColor.checked, false && paintedColor.checked, lightingColor.checked);
    if (lightingColor.checked && !baseColor.checked) {
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
    ]
    worldInfo.replaceChildren(...contents);
    worldInfo.classList.add("text-entries");
    worldInfo.hidden = false;
}