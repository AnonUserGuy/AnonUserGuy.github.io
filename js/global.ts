export interface Attributes {
    [key: string]: string;
}

export function createElementEX(tagName: string, attributes: Attributes = {}, children: (HTMLElement | string)[] = []) {
    const element = document.createElement(tagName);
    for (const attribute in attributes) {
        element.setAttribute(attribute, attributes[attribute]);
    }
    for (const child of children) {
        if (typeof child === "string") {
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