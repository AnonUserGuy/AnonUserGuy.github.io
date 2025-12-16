export interface Attributes {
    [key: string]: string;
}

export function promiseFileAsText(file: File): Promise<string | null> {
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

export function promiseFileAsArrayBuffer(file: File): Promise<ArrayBuffer | null> {
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

export async function decompressBuffer(bytes: BufferSource, type: CompressionFormat) {
  const decompressedStream = new Response(bytes).body!.pipeThrough(new DecompressionStream(type));
  const buffer = await new Response(decompressedStream).arrayBuffer();
  return buffer;
}

export function download(file: Blob | File, filename?: string, type?: string) {
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

export function createElementEX(tagName: string, attributes: Attributes = {}, children: (HTMLElement | any)[] = []) {
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

export const dotEl = createElementEX('div', { "class": "dot" }, [
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

export const loadingEl = createElementEX("img", {
    "id": "loading",
    "class": "loading",
    "src": "/media/images/loading.gif",
    "alt": "loading",
    "hidden": ""
})

window.onload = function () {
    document.body.appendChild(dotEl);
    document.body.appendChild(loadingEl);
}

export function loading(bool: boolean) {
    if (bool) {
        loadingEl.removeAttribute("hidden");
    } else {
        loadingEl.setAttribute("hidden", "");
    }
}