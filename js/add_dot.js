window.onload = function () {
    var elemDiv = document.createElement('div');
    elemDiv.setAttribute("class", "dot")

    var elemIframe = document.createElement('iframe');
    elemIframe.setAttribute("src", "https://global-mind.org/gcpdot/gcp.html")
    elemIframe.setAttribute("height", "48")
    elemIframe.setAttribute("width", "48")
    elemIframe.setAttribute("scrolling", "no")
    elemIframe.setAttribute("marginwidth", "0")
    elemIframe.setAttribute("marginheight", "0")
    elemIframe.setAttribute("frameborder", "0")
    elemDiv.appendChild(elemIframe);

    document.body.appendChild(elemDiv);
}

