interface Attributes {
    [key: string]: string;
}

interface RandomNumberGenerator {
    (): number;
}

function promiseFileAsText(file: File): Promise<string | null> {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onload = () => {
            resolve(reader.result as string | null)
        }
        reader.onerror = () => {
            reader.abort();
            reject();
        }
        reader.readAsText(file);
    });
}

function promiseFileAsArrayBuffer(file: File): Promise<ArrayBuffer | null> {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onload = () => {
            resolve(reader.result as ArrayBuffer | null)
        }
        reader.onerror = () => {
            reader.abort();
            reject();
        }
        reader.readAsArrayBuffer(file);
    });
}

/*
async function decompressBuffer(bytes: BufferSource, type: CompressionFormat) {
  const decompressedStream = new Response(bytes).body!.pipeThrough(new DecompressionStream(type));
  const buffer = await new Response(decompressedStream).arrayBuffer();
  return buffer;
}
*/

function download(file: Blob | File, filename?: string, type?: string) {
    const a = document.createElement("a");
    const url = URL.createObjectURL(file);
    a.href = url;
    if (filename) a.download = filename;
    if (type) a.type = type;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

}

function createElementEX(tagName: string, attributes: Attributes = {}, children: (HTMLElement | any)[] = []) {
    const element = document.createElement(tagName);
    for (const attribute in attributes) {
        element.setAttribute(attribute, attributes[attribute]);
    }
    for (const child of children) {
        if (typeof child !== "object") {
            const textNode = document.createTextNode(child);
            element.appendChild(textNode);
        } else {
            element.appendChild(child);
        }
    }
    return element;
}

const dotEl = createElementEX('div', { "class": "dot" }, [
    createElementEX('iframe', {
        "title": "the dot",
        "src": "https://global-mind.org/gcpdot/gcp.html",
        "height": "48",
        "width": "48",
        "scrolling": "no",
        "marginwidth": "0",
        "marginheight": "0",
        "frameborder": "0"
    })
]);

const loadingEl = createElementEX("img", {
    "id": "loading",
    "class": "loading",
    "src": "/media/images/loading.gif",
    "alt": "loading",
    "hidden": ""
})

window.onload = function () {
    //document.body.appendChild(dotEl);
    document.body.appendChild(loadingEl);
}

function loading(bool: boolean) {
    if (bool) {
        loadingEl.removeAttribute("hidden");
    } else {
        loadingEl.setAttribute("hidden", "");
    }
}

function delay(durationMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, durationMs));
}

// TSH taken from https://stackoverflow.com/a/52171480
const tsh = (s: string) => { for (var i = 0, h = 9; i < s.length;)h = Math.imul(h ^ s.charCodeAt(i++), 9 ** 9); return h ^ h >>> 9 }

function random(seed?: string | number): RandomNumberGenerator {
    if (typeof seed === "string") {
        seed = tsh(seed);
    } else if (typeof seed === "undefined") {
        seed = Math.random();
    }
    return () => {
        let t = ((seed as number) += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

Object.assign(window, { promiseFileAsText, promiseFileAsArrayBuffer, download, createElementEX, dotEl, loadingEl, loading, delay, tsh, random });