import { WordGame } from "./word_game";
import { WordGameParams } from "./word_game_params";
import { WordGameManager } from "./word_game_manager";
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

function updateForm() {
    formDeserialize(form, initialSearch);

    if (initialSearch.has("s")) {
        const s = initialSearch.get("s")!;
        const date = WordGameParams.getDateFromSeed(s);
        if (date) {
            formSeedDateValue.value = date.toISOString().slice(0, 10);
        }
        formSeedFixed.checked = true;
    }
    formSeedDateValue.value ||= new Date().toISOString().slice(0, 10);

    if (initialSearch.has("nodictionary")) {
        formEnforceDictionary.checked = false;
    } else {
        formEnforceDictionary.checked = true;
    }


}

function startGame() {
    formSection.hidden = true;
    wordSection.hidden = false;
    manager.active = true;

    const formData = new FormData(form);
    const search = new URLSearchParams(formData as any);

    if (!formEnforceDictionary.checked) {
        search.set("nodictionary", "on");
    } else {
        search.delete("nodictionary");
    }

    let newParams = WordGameParams.fromURLSearchParams(search, params);

    if (newParams.needsNewGame(params) || !manager.game) {
        manager.game = new WordGame(dictionary, newParams.clone());
    } else {
        manager.game.params = newParams.clone();
        if (newParams.needsReset(params)) {
            manager.reset();
        }
    }
    params = newParams;

    const url = new URL(window.location.href);
    url.search = search.toString();
    window.history.replaceState({}, '', url.toString());

    formSeedFixed.checked = true;
    formSeedFixedValue.value = params.stringSeed();
    const date = params.date();
    if (date) {
        formSeedDateValue.value = date.toISOString().slice(0, 10);
    }

    goBack.href = window.location.href + "&m=edit";
    goBack.innerText = "<-- view/modify rules";
}

function stopGame() {
    formSection.hidden = false;
    wordSection.hidden = true;
    manager.active = false;

    const url = new URL(window.location.href);
    url.searchParams.set("m", "edit");
    window.history.replaceState({}, '', url.toString());

    goBack.href = "/";
    goBack.innerText = "<-- go back";
}

const initialSearch = new URL(window.location.href).searchParams;

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

const formEnforceDictionary = document.getElementById("formEnforceDictionary") as HTMLInputElement;

const formSeedDaily = document.getElementById("formSeedDaily") as HTMLInputElement;
const FormSeedRandom = document.getElementById("formSeedRandom") as HTMLInputElement;
const formSeedDate = document.getElementById("formSeedDate") as HTMLInputElement;
const formSeedDateValue = document.getElementById("formSeedDateValue") as HTMLInputElement;
const formSeedFixed = document.getElementById("formSeedFixed") as HTMLInputElement;
const formSeedFixedValue = document.getElementById("formSeedFixedValue") as HTMLInputElement;
let params = WordGameParams.fromURLSearchParams(initialSearch);
updateForm();

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
if (!initialSearch.has("wmax")) {
    formWidthMax.value = formWidth.value;
} else {
    formWidthMax.disabled = false;
    formWidthMaxEnabled.checked = true;
}

function formSeedOnChange() {
    formSeedDateValue.tabIndex = formSeedDate.checked ? 0 : -1;
    formSeedFixedValue.tabIndex = formSeedFixed.checked ? 0 : -1;
}
formSeedDaily.addEventListener("change", formSeedOnChange);
FormSeedRandom.addEventListener("change", formSeedOnChange);
formSeedDate.addEventListener("change", formSeedOnChange);
formSeedFixed.addEventListener("change", formSeedOnChange);
formSeedOnChange();

formSeedDateValue.addEventListener("click", () => {
    formSeedDateValue.tabIndex = 0;
    formSeedDate.checked = true;
});
formSeedFixedValue.addEventListener("click", () => {
    formSeedFixedValue.tabIndex = 0;
    formSeedFixed.checked = true;
});

const wordSection = document.getElementById("wordSection") as HTMLDivElement;
const wordBoard = document.getElementById("wordBoard") as HTMLDivElement;
const wordKeyboard = document.getElementById("wordKeyboard") as HTMLDivElement;
const wordButtons = document.getElementById("wordButtons") as HTMLDivElement;
const wordNotifications = document.getElementById("wordNotifications") as HTMLDivElement;
const manager: WordGameManager = new WordGameManager(() => {

    params.incrementSeed();
    const url = new URL(window.location.href);
    url.searchParams.set("s", params.stringSeed());
    window.history.replaceState({}, '', url.toString());

    formSeedFixed.checked = true;
    formSeedFixedValue.value = params.stringSeed();

    return new WordGame(dictionary, params.clone());

}, wordBoard, wordKeyboard, wordButtons, wordNotifications);

const continueSection = document.getElementById("continueSection") as HTMLDivElement;
const continueNew = document.getElementById("continueNew") as HTMLButtonElement;
const continueResume = document.getElementById("continueResume") as HTMLButtonElement;

continueNew.addEventListener("click", () => {
    formSection.hidden = false;
    continueSection.hidden = true;
});

continueResume.addEventListener("click", () => {
    continueSection.hidden = true;
    loadInitialGame();
    startGame();
});

function loadInitialGame() {
    if (!initialGame) {
        formSection.hidden = false;
        wordSection.hidden = true;
        return;
    }
    params = initialGame.params;
    params.toURLSearchParams(initialSearch);
    updateForm();

    manager.active = true; // TODO: fix this
    manager.game = initialGame;
    manager.active = false;
    initialGame = null;
}

const initialGameStr = localStorage.getItem("wordGame");
let initialGame: WordGame | null = null;
if (initialGameStr) {
    initialGame = WordGame.fromJSON(dictionary, initialGameStr);
    if (initialSearch.size <= 0 && initialGame.shouldLoad()) {
        formSection.hidden = true;
        continueSection.hidden = false;
    } else if (!initialGame.params.needsNewGame(params)) {
        loadInitialGame();
    }
}
if (initialSearch.size > 0 && initialSearch.get("m") !== "edit") {
    startGame();
}

(window as any).dictionary = dictionary;
(window as any).manager = manager;
(window as any).WordGame = WordGame;

export { }