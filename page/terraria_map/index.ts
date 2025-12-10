import * as global from "@js/global.js";
import {BinaryReader, MapHelper, worldMap} from "@js/lib/MapHelper.js";

const uploadInput = document.getElementById("uploadInput") as HTMLInputElement;

uploadInput.addEventListener("change", async (event) => {
    if (uploadInput.files && uploadInput.files[0]) {
        global.loading(true);
        worldMap.canvasElement = document.getElementById("canvas") as HTMLCanvasElement;

        const buffer = await global.promiseFileAsArrayBuffer(uploadInput.files[0]) as ArrayBuffer;
        const fileReader = new BinaryReader(new Uint8Array(buffer));
        await MapHelper.Load(fileReader);
        global.loading(false);
    }
});