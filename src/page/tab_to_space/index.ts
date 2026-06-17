

function tabToSpace(text: string, width: number) {
    if (width < 1) {
        return text.replaceAll("\t", "");
    }
    const reg = new RegExp(`([^\\t\\n\\r]{0,${width - 1}})\\t|[^\\t\\n\\r]{0,${width - 1}}[\\n\\r]|[^\\t]{${width}}`, "g");
    return text.replaceAll(reg, (p0, p1) => p1 !== undefined ? p1 + " ".repeat(width - p1.length) : p0);
}

function doConvert() {
    output.value = tabToSpace(input.value, parseInt(tabWidth.value));
}

const input = document.getElementById("input") as HTMLTextAreaElement;
const output = document.getElementById("output") as HTMLTextAreaElement;
const convert = document.getElementById("convert") as HTMLButtonElement;
const tabWidth = document.getElementById("tabWidth") as HTMLInputElement;
const copy = document.getElementById("copy") as HTMLButtonElement;

convert.addEventListener("click", doConvert);

tabWidth.addEventListener("change", doConvert);

copy.addEventListener("click", () => {
    navigator.clipboard.writeText(output.value);
});

(window as any).tabToSpace = tabToSpace;