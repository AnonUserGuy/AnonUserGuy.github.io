tsh=s=>{for(var i=0,h=9;i<s.length;)h=Math.imul(h^s.charCodeAt(i++),9**9);return h^h>>>9}

Document.prototype.createElementEX = function (tagName, attributes = {}, children = []) {
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

const dotEl = document.createElementEX('div', { "class": "dot" }, [
    document.createElementEX('iframe', {
        "src": "https://global-mind.org/gcpdot/gcp.html",
        "height": "48",
        "width": "48",
        "scrolling": "no",
        "marginwidth": "0",
        "marginheight": "0",
        "frameborder": "0"
    })
]);

const loadingEl = document.createElementEX("img", {
    "id": "loading",
    "class": "loading",
    "src": "../media/images/loading.gif",
    "alt": "loading",
    "hidden": ""
})

window.onload = function () {
    document.body.appendChild(dotEl);
    document.body.appendChild(loadingEl);
}

function loading(bool) {
    if (bool) {
        loadingEl.removeAttribute("hidden");
    } else {
        loadingEl.setAttribute("hidden", "");
    }
}