import { WordGameManager } from "./word_game_manager";
import { WordGameGenerator } from "./word_game_generator";
import _dictionary from "./dictionary.json";

function formDeserialize(form: HTMLFormElement, params: URLSearchParams) {
    for (const [key, val] of params) {
        if (form.elements[key as any]) {
            const input = form.elements[key as any] as HTMLInputElement;
            switch (input.type) {
                case 'checkbox': input.checked = !!val; break;
                default: input.value = val; break;
            }
        }
    }
}

function startGame() {
    formSection.hidden = true;
    wordSection.hidden = false;
    manager.active = true;

    const formData = new FormData(form);
    const params = new URLSearchParams(formData as any);

    if (generator.setParams(params) || !manager.game) {
        manager.game = generator.newGame();
    }

    const url = new URL(window.location.href);
    url.search = params.toString();
    window.history.replaceState({}, '', url.toString());

    formSeedFixed.checked = true;
    formSeedFixedValue.value = generator.seed();

    goBack.href = window.location.href + "&m=edit";
}

function stopGame() {
    formSection.hidden = false;
    wordSection.hidden = true;
    manager.active = false;

    const url = new URL(window.location.href);
    url.searchParams.set("m", "edit");
    window.history.replaceState({}, '', url.toString());

    goBack.href = "/";
}

const initialParams = new URL(window.location.href).searchParams;

const goBack = document.getElementById("goBack") as HTMLAnchorElement;

goBack.addEventListener("click", (event) => {
    if (manager.active) {
        event.preventDefault();
        stopGame();
    }
});

const dictionary = _dictionary as string[][][];
const formSection = document.getElementById("formSection") as HTMLDivElement;
const form = document.getElementById("form") as HTMLFormElement;

const formWidth = document.getElementById("formWidth") as HTMLInputElement;
const formWidthMax = document.getElementById("formWidthMax") as HTMLInputElement;
const formWidthMaxEnabled = document.getElementById("formWidthMaxEnabled") as HTMLInputElement;

const formSeedDaily = document.getElementById("formSeedDaily") as HTMLInputElement;
const FormSeedRandom = document.getElementById("formSeedRandom") as HTMLInputElement;
const formSeedFixed = document.getElementById("formSeedFixed") as HTMLInputElement;
const formSeedFixedValue = document.getElementById("formSeedFixedValue") as HTMLInputElement;

const generator = new WordGameGenerator(dictionary, initialParams);
formDeserialize(form, initialParams);

form.addEventListener("submit", (event) => {
    event.preventDefault();
    startGame();
});

formWidth.addEventListener("change", () => {
    if (!formWidthMaxEnabled.checked || parseInt(formWidth.value) > parseInt(formWidthMax.value)) {
        formWidthMax.value = formWidth.value;
    }
});

formWidthMax.addEventListener("change", () => {
    if (formWidthMaxEnabled.checked && parseInt(formWidth.value) > parseInt(formWidthMax.value)) {
        formWidth.value = formWidthMax.value;
    }
});

formWidthMaxEnabled.addEventListener("change", () => {
    if (!formWidthMaxEnabled.checked) {
        formWidthMax.disabled = true;
        formWidthMax.value = formWidth.value;
    } else {
        formWidthMax.disabled = false;
    }
});
if (formWidthMax.value !== formWidth.value) {
    formWidthMax.disabled = false;
    formWidthMaxEnabled.checked = true;
}

function formSeedOnChange() {
    if (formSeedFixed.checked) {
        formSeedFixedValue.tabIndex = 0;
    } else {
        formSeedFixedValue.tabIndex = -1;
    }
}
formSeedDaily.addEventListener("change", formSeedOnChange);
FormSeedRandom.addEventListener("change", formSeedOnChange);
formSeedFixed.addEventListener("change", formSeedOnChange);
formSeedOnChange();

formSeedFixedValue.addEventListener("click", (event) => {
    formSeedFixedValue.tabIndex = 0;
    formSeedFixed.checked = true;
});

const wordSection = document.getElementById("wordSection") as HTMLDivElement;
const wordBoard = document.getElementById("wordBoard") as HTMLDivElement;
const wordKeyboard = document.getElementById("wordKeyboard") as HTMLDivElement;
const wordButtons = document.getElementById("wordButtons") as HTMLDivElement;
const wordNotifications = document.getElementById("wordNotifications") as HTMLDivElement;
const manager: WordGameManager = new WordGameManager(() => {

    generator.incrementSeed();
    const url = new URL(window.location.href);
    url.searchParams.set("s", generator.seed());
    window.history.replaceState({}, '', url.toString());

    formSeedFixed.checked = true;
    formSeedFixedValue.value = generator.seed();

    return generator.newGame();

}, wordBoard, wordKeyboard, wordButtons, wordNotifications);

if (initialParams.size > 0 && initialParams.get("m") !== "edit") {
    startGame();
}

(window as any).dictionary = dictionary;
(window as any).generator = generator;
(window as any).manager = manager;

export { }