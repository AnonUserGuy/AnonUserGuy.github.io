import _dictionary from "./dictionary.json";

interface WordDictionary {
    [index: number]: [string[], string[]] | null | undefined;
}

enum WordGameState {
    InProgress,
    Lost,
    Won
}

enum WordGameGuessResult {
    BadLimit = -4,
    BadRepeat = -3,
    BadWidth = -2,
    BadWord = -1,
    Valid = 0
}

enum WordGameLetterQuality {
    Absent,
    Present,
    Correct
}

class LetterCounts {
    private _data: { [index: string]: number } = {};

    constructor(word?: string) {
        if (word) {
            for (let i = 0; i < word.length; i++) {
                const c = word.charAt(i);
                this.add(c);
            }
        }
    }

    add(c: string) {
        if (!this._data[c]) {
            this._data[c] = 1;
        } else {
            this._data[c]++;
        }
        return this._data[c];
    }

    get(c: string) {
        return this._data[c] || 0;
    }
}

class LetterQualities {
    private _data: { [index: string]: WordGameLetterQuality } = {};

    set(c: string, quality: WordGameLetterQuality) {
        if (!this._data[c] || quality > this._data[c]) {
            this._data[c] = quality;
        }
        return this._data[c];
    }

    get(c: string) {
        return this._data[c];
    }

    forEach(fn: (c: string, quality: WordGameLetterQuality) => any) {
        for (const c in this._data) {
            fn(c, this._data[c]);
        }
    }
}

class WordGame {
    readonly dictionary: WordDictionary;

    limit: number;
    width: number;
    minWidth: number;
    maxWidth: number;

    readonly solution: string;
    readonly letterCounts: LetterCounts;
    readonly guesses: string[];
    readonly qualities: WordGameLetterQuality[][];
    readonly letters: LetterQualities;

    state: WordGameState = WordGameState.InProgress;
    continuedState: WordGameState = WordGameState.InProgress;
    gaveUp = false;

    enforceWidth = true;
    enforceDictionary = true;
    enforceRepeat = false;

    constructor(dictionary: WordDictionary, width: number, limit: number, solution?: string) {
        this.dictionary = dictionary;
        this.limit = limit;
        this.width = width;
        this.minWidth = this.width;
        this.maxWidth = this.width;
        if (solution !== undefined) {
            this.solution = solution;
        } else if (this.dictionary[this.width]) {
            this.solution = WordGameGenerator.randomDictionaryWord(this.dictionary[this.width]!);
        } else {
            this.solution = "a".repeat(this.width);
        }
        this.letterCounts = new LetterCounts(this.solution);
        this.guesses = [];
        this.qualities = [];
        this.letters = new LetterQualities();
    }

    dictionaryHas(word: string): boolean {
        return word === this.solution ||
            !!this.dictionary[word.length] && this.dictionary[word.length]!.some(arr => WordGame.binarySearch(arr, word) !== -1);
    }

    static binarySearch<T>(arr: T[], x: T): number {
        let low = 0;
        let high = arr.length - 1;
        let mid: number;

        while (high >= low) {
            mid = low + Math.floor((high - low) / 2);

            if (arr[mid] === x) {
                return mid;
            } else if (arr[mid] > x) {
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }
        return -1;
    }

    isActive(): boolean {
        return this.state <= this.continuedState;
    }

    guess(word: string) {
        word = word.toLowerCase();

        if (this.enforceWidth && (word.length < this.minWidth || word.length > this.maxWidth)) {
            return WordGameGuessResult.BadWidth;
        } else if (this.enforceDictionary && !this.dictionaryHas(word)) {
            return WordGameGuessResult.BadWord;
        } else if (this.enforceRepeat && this.guesses.indexOf(word) !== -1) {
            return WordGameGuessResult.BadRepeat;
        } else if (!this.isActive()) {
            return WordGameGuessResult.BadLimit;
        }

        return this.forceGuess(word);
    }

    forceGuess(word: string) {
        word = word.toLowerCase();

        const letterCounts = new LetterCounts();
        const quality: WordGameLetterQuality[] = [];

        let won = word.length === this.solution.length;
        for (let i = 0; i < word.length; i++) {
            const c = word.charAt(i);

            if (this.solution.charAt(i) === c) {
                quality[i] = WordGameLetterQuality.Correct;
                this.letters.set(c, WordGameLetterQuality.Correct);
            } else {
                won = false;
                const guessCount = letterCounts.get(c);
                const solutionCount = this.letterCounts.get(c);

                if (guessCount < solutionCount) {

                    let futureCsInCorrectPosition = 0;
                    let futureHasCorrect = false;
                    for (let j = i + 1; j < word.length; j++) {
                        const c2 = word.charAt(j);
                        if (c === c2 && this.solution.charAt(j) === c2) {
                            futureCsInCorrectPosition++;

                            if (guessCount + futureCsInCorrectPosition >= solutionCount) {
                                futureHasCorrect = true;
                                break;
                            }
                        }
                    }
                    if (futureHasCorrect) {
                        quality[i] = WordGameLetterQuality.Absent;
                        this.letters.set(c, WordGameLetterQuality.Absent);
                    } else {
                        quality[i] = WordGameLetterQuality.Present;
                        this.letters.set(c, WordGameLetterQuality.Present);
                    }

                } else {
                    quality[i] = WordGameLetterQuality.Absent;
                    this.letters.set(c, WordGameLetterQuality.Absent);
                }
            }
            letterCounts.add(c);
        }
        this.guesses.push(word);
        this.qualities.push(quality);

        if (won) {
            this.state = WordGameState.Won;
        } else if (this.state !== WordGameState.Won && this.guesses.length >= this.limit) {
            this.state = WordGameState.Lost;
        }

        return WordGameGuessResult.Valid;
    }

    toString(): string {
        let out: string[] = [];
        for (let i = 0; i < this.guesses.length; i++) {
            const guess = this.guesses[i];
            const quality = this.qualities[i];

            let out2: string[] = [];
            for (let j = 0; j < guess.length; j++) {
                const c = guess.charAt(j);
                const q = quality[j];

                let out3 = (() => {
                    switch (q) {
                        case WordGameLetterQuality.Correct: return `[${c}]`;
                        case WordGameLetterQuality.Present: return `(${c})`;
                        case WordGameLetterQuality.Absent: return ` ${c} `;
                    }
                })();
                out2.push(out3);
            }
            out.push(out2.join(" "));
        }
        for (let i = this.guesses.length; i < this.limit; i++) {
            out.push(Array(this.width).fill(" _ ").join(" "));
        }

        return out.join("\n");
    }

    toEmoji(): string {
        let out: string[] = [`${window.location.href}\n===== ${this.state === WordGameState.Lost ? "X" : this.guesses.length}/${this.limit} =====`];
        for (let i = 0; i < this.guesses.length; i++) {
            const guess = this.guesses[i];
            const quality = this.qualities[i];

            let out2: string[] = [];
            for (let j = 0; j < guess.length; j++) {
                const q = quality[j];

                let out3 = (() => {
                    switch (q) {
                        case WordGameLetterQuality.Correct: return "🟩";
                        case WordGameLetterQuality.Present: return "🟨";
                        case WordGameLetterQuality.Absent: return "⬛";
                    }
                })();
                out2.push(out3);
            }
            out.push(out2.join(""));
        }

        return out.join("\n");
    }
}

class WordGameManager {
    private _game?: WordGame;
    gameGenerator: () => WordGame;

    isTabbed: boolean = false;
    active: boolean = false;
    input: string = "";

    board: HTMLDivElement;
    rows: HTMLDivElement[] = [];
    tiles: HTMLDivElement[][] = [];

    keyboard: HTMLDivElement;
    keys: { [index: string]: HTMLButtonElement } = {};
    keyenter!: HTMLButtonElement;
    keyback!: HTMLButtonElement;

    buttonContinue!: HTMLButtonElement;
    buttonShare!: HTMLButtonElement;
    buttonGiveUp!: HTMLButtonElement;
    buttonNewGame!: HTMLButtonElement;

    buttons: HTMLDivElement;

    notifications: HTMLDivElement;
    notificationGiveUp?: HTMLElement | null;

    constructor(gameGenerator: () => WordGame, board?: HTMLDivElement, keyboard?: HTMLDivElement, buttons?: HTMLDivElement, notifications?: HTMLDivElement) {
        this.gameGenerator = gameGenerator;
        //this._game = this.gameGenerator();

        this.board = board || createElementEX("div", { "class": "word-board" }) as HTMLDivElement;
        this.keyboard = keyboard || createElementEX("div", { "class": "word-keyboard" }) as HTMLDivElement;
        this.buttons = buttons || createElementEX("div", { "class": "word-buttons" }) as HTMLDivElement;
        this.notifications = notifications || createElementEX("div", { "class": "word-notifications" }) as HTMLDivElement;

        window.addEventListener("keydown", (event) => this.keyDown(event));
        window.addEventListener("keyup", (event) => this.keyUp(event));
        window.addEventListener("mousedown", (event) => this.mouseEvent(event));
        window.addEventListener("pointerdown", (event) => this.mouseEvent(event));
        window.addEventListener("touchstart", (event) => this.mouseEvent(event));

        this.initKeyboard();
        this.initButtons();
        this.draw();
    }

    get game() {
        return this._game;
    }
    set game(game: WordGame | undefined) {
        this._game = game;
        this.reset();
    }

    isGameActive(): boolean {
        return this.active && !!(this._game) && this._game.isActive();
    }

    keyDown(event: KeyboardEvent) {
        if (!this.isGameActive()) {
            return;
        }
        if (event.repeat) {
            return;
        }
        let key = event.key;
        let target: HTMLButtonElement;
        if (key.length === 1) {
            const code = key.charCodeAt(0);
            if (code >= 64 && code <= 90) {
                key = String.fromCharCode(code + 32);
            } else if (!(code >= 97 && code <= 122)) {
                return;
            }
            this.type(key);
            target = this.keys[key];
        } else if (key === "Backspace") {
            this.back();
            target = this.keyback;
        } else if (key === "Enter") {
            if (this.isTabbed) {
                return;
            }
            this.enter();
            target = this.keyenter;
            event.preventDefault();
        } else if (key === "Tab") {
            this.isTabbed = true;
            return;
        } else {
            return;
        }
        this.targetDown(target);
    }

    keyUp(event: KeyboardEvent) {
        let key = event.key;
        let target: HTMLButtonElement;
        if (key.length === 1) {
            const code = key.charCodeAt(0);
            if (code >= 64 && code <= 90) {
                key = String.fromCharCode(code + 32);
            } else if (!(code >= 97 && code <= 122)) {
                return;
            }
            target = this.keys[key];
        } else if (key === "Backspace") {
            target = this.keyback;
        } else if (key === "Enter") {
            if (this.isTabbed) {
                return;
            }
            target = this.keyenter;
        } else {
            return;
        }
        this.targetUp(target);
    }

    mouseEvent(event?: MouseEvent | TouchEvent) {
        this.isTabbed = false;
    }

    targetDown(target: HTMLButtonElement) {
        target.classList.add("word-key-active");
    }

    targetUp(target: HTMLButtonElement) {
        target.classList.remove("word-key-active");
    }

    type(c: string) {
        if (this._game && (!this._game.enforceWidth || this.input.length < this._game.maxWidth)) {
            this.input += c;
            this.draw();
            return true;
        }
        return false;
    }

    enter() {
        if (this._game) {
            const result = this._game.guess(this.input);
            switch (result) {
                case WordGameGuessResult.Valid:
                    this.input = "";
                    this.draw();
                    return true;
                case WordGameGuessResult.BadLimit:
                    this.notify("Out of guesses");
                    return false;
                case WordGameGuessResult.BadRepeat:
                    this.notify("Already guessed");
                    return false;
                case WordGameGuessResult.BadWidth:
                    this.notify("Not enough letters");
                    return false;
                case WordGameGuessResult.BadWord:
                    this.notify("Not in word list");
                    return false;
            }
        }
        return false;
    }

    back() {
        if (this.input.length > 0) {
            this.input = this.input.slice(0, -1);
            this.draw();
            return true;
        }
        return false;
    }

    draw() {
        this.drawBoard();
        this.drawKeyboard();
        this.drawButtons();
    }

    reset() {
        this.resetBoard();
        this.resetKeyboard();
        if (this.notificationGiveUp) {
            this.notifications.removeChild(this.notificationGiveUp);
            this.notificationGiveUp = null;
        }
        this.draw();
    }

    initButtons() {
        this.buttonContinue = this.buttons.appendChild(createElementEX("button", { "class": "word-button" }, ["Continue"]) as HTMLButtonElement);
        this.buttonContinue.addEventListener("click", () => this.continue());
        this.buttonShare = this.buttons.appendChild(createElementEX("button", { "class": "word-button word-button-center" }, ["Share"]) as HTMLButtonElement);
        this.buttonShare.addEventListener("click", () => this.share());
        this.buttonGiveUp = this.buttons.appendChild(createElementEX("button", { "class": "word-button" }, ["Give Up"]) as HTMLButtonElement);
        this.buttonGiveUp.addEventListener("click", () => this.giveUp());
        this.buttonNewGame = this.buttons.appendChild(createElementEX("button", { "class": "word-button" }, ["New Game"]) as HTMLButtonElement);
        this.buttonNewGame.addEventListener("click", () => this.newGame());
    }

    drawButtons() {
        if (!this._game) {
            return;
        }
        if (this.isGameActive() && this._game.state <= WordGameState.InProgress) {
            this.buttons.hidden = true;
            return;
        }
        this.buttons.hidden = false;

        this.buttonContinue.disabled = this._game.gaveUp || this._game.continuedState >= this._game.state;
        this.buttonGiveUp.hidden = this._game.gaveUp || this._game.state >= WordGameState.Won;
        this.buttonNewGame.hidden = !this.buttonGiveUp.hidden;
    }

    continue() {
        if (!this._game) {
            return;
        }
        this._game.continuedState = this._game.state;
        this.draw();
    }

    async share() {
        if (!this._game) {
            return;
        }
        try {
            await navigator.clipboard.writeText(this._game.toEmoji());
            this.notify("Copied!");
        } catch (e) {
            console.error(e);
            this.notify("Failed to copy");
        }
    }

    giveUp() {
        if (!this._game) {
            return;
        }
        this.notificationGiveUp = this.notifications.appendChild(createElementEX("p", {}, [this._game.solution.toUpperCase()]));
        this._game.gaveUp = true;
        this._game.continuedState = WordGameState.InProgress;
        this.draw();
    }

    newGame() {
        this.game = this.gameGenerator();
    }

    async notify(str: string) {
        const notification = this.notifications.appendChild(createElementEX("p", {}, [str]));
        await delay(1000);
        this.notifications.removeChild(notification);
    }

    initKeyboard() {
        /* if ((navigator as any).keyboard) {
            const keyboard = (navigator as any).keyboard;
        }  */

        const keys = ["qwertyuiop", " asdfghjkl ", "zxcvbnm"];

        let row: HTMLDivElement;
        for (let i = 0; i < keys.length; i++) {
            const str = keys[i];

            row = this.keyboard.appendChild(createElementEX("div", { "class": "word-keyrow" }) as HTMLDivElement);

            for (let j = 0; j < str.length; j++) {
                const c = str.charAt(j);

                if (c === " ") {
                    row.appendChild(createElementEX("div", { "class": "word-key-space" }) as HTMLDivElement);
                } else {
                    const key = row.appendChild(createElementEX("button", { "class": "word-key" }, [c]) as HTMLButtonElement);
                    this.keys[c] = key;
                    key.addEventListener("click", () => this.type(c));
                }

            }
        }

        this.keyenter = createElementEX("button", { "class": "word-key word-key-wide" }, ["⤶"]) as HTMLButtonElement;
        row!.prepend(this.keyenter);
        this.keyenter.addEventListener("click", () => this.enter());
        this.keyback = row!.appendChild(createElementEX("button", { "class": "word-key word-key-wide" }, ["🡐"]) as HTMLButtonElement);
        this.keyback.addEventListener("click", () => this.back());
    }

    drawKeyboard() {
        if (!this._game) {
            this.resetKeyboard();
            return;
        }

        if (!this.isGameActive()) {
            this.keyboard.hidden = true;
            return;
        }
        this.keyboard.hidden = false;

        this._game.letters.forEach((c, quality) => {
            this.keys[c].setAttribute("data-state", (() => {
                switch (quality) {
                    case WordGameLetterQuality.Correct: return "correct";
                    case WordGameLetterQuality.Present: return "present";
                    case WordGameLetterQuality.Absent: return "absent";
                }
            })());
        });
    }

    resetKeyboard() {
        for (const c in this.keys) {
            this.keys[c].removeAttribute("data-state");
        }
    }

    drawBoard() {
        if (!this._game) {
            this.resetBoard();
            return;
        }

        let i = 0;
        for (; i < this._game.guesses.length; i++) {
            const guess = this._game.guesses[i];
            const quality = this._game.qualities[i];

            for (let j = 0; j < guess.length; j++) {
                const tile = this.tile(i, j);
                tile.innerText = guess.charAt(j);
                tile.setAttribute("data-state", (() => {
                    switch (quality[j]) {
                        case WordGameLetterQuality.Correct: return "correct";
                        case WordGameLetterQuality.Present: return "present";
                        case WordGameLetterQuality.Absent: return "absent";
                    }
                })());
            }
        }

        if (this.input || this.rows[i]) {
            const row = this.row(i);
            const tiles = this.tiles[i];
            let j = 0;
            for (; j < this.input.length; j++) {
                const tile = this.tile(i, j);
                tile.innerText = this.input.charAt(j);
                tile.setAttribute("data-state", "typing");
                tile.scrollIntoView();
            }
            for (; j < this._game.width; j++) {
                const tile = this.tile(i, j);
                tile.innerText = "";
                tile.setAttribute("data-state", "empty");
            }
            const width = Math.max(j, this._game.width);
            while (tiles.length > width) {
                const tile = tiles.pop();
                if (tile) {
                    row.removeChild(tile);
                }
            }
            i++;
        }

        if (this.isGameActive()) {
            for (; i < this._game.limit; i++) {
                this.row(i);
            }
        } else {
            while (this.rows.length > this._game.guesses.length) {
                const row = this.rows.pop();
                if (row) {
                    this.board.removeChild(row);
                }
            }
        }
    }

    resetBoard() {
        this.board.replaceChildren();
        this.rows = [];
        this.tiles = [];
    }

    row(i: number) {
        return this.rows[i] || this.initRow(i);
    }

    initRow(i: number) {
        const row = createElementEX("div", { "class": "word-row" }) as HTMLDivElement;
        this.rows[i] = row;
        this.tiles[i] = [];

        for (let j = 0; j < this._game!.width; j++) {
            this.initTile(i, j);
        }
        this.board.replaceChildren(...this.rows);

        return row;
    }

    tile(i: number, j: number) {
        if (!this.tiles[i]) {
            this.initRow(i);
        }
        return this.tiles[i][j] || this.initTile(i, j);
    }

    initTile(i: number, j: number) {
        const tile = createElementEX("div", {
            "class": "word-tile",
            "data-state": "empty"
        }) as HTMLDivElement;

        this.tiles[i][j] = tile;
        this.rows[i].replaceChildren(...this.tiles[i]);

        return tile;
    }
}

enum SeedType {
    Daily,
    Random,
    Fixed
}

enum Difficulty {
    Normal,
    Hard,
    Impossible
}

class WordGameGenerator {
    dictionary: WordDictionary;
    private initialSeed: string = "";
    private extraSeed: number = -1;

    seedType: SeedType = SeedType.Daily;
    difficulty: Difficulty = Difficulty.Normal;
    width: number = 5;
    limit: number = 6;

    constructor(dictionary: WordDictionary, initialParams?: URLSearchParams) {
        this.dictionary = dictionary;
        if (initialParams) {
            WordGameGenerator.validateParams(initialParams);
        }
    }

    getRng() {
        this.extraSeed!++;
        const seed = this.extraSeed ? `${this.initialSeed}_${this.extraSeed}` : this.initialSeed!;

        if (true || this.seedType !== SeedType.Daily || this.extraSeed !== 0) {
            const url = new URL(window.location.href);
            url.searchParams.set("s", seed);
            window.history.replaceState({}, '', url.toString());
        }

        return random(seed);
    }

    newGame() {
        const rng = this.getRng();
        let word = (() => {
            switch (this.difficulty) {
                case Difficulty.Normal: return WordGameGenerator.randomDictionaryWord([this.dictionary[this.width]![1]], rng);
                case Difficulty.Hard: return WordGameGenerator.randomDictionaryWord(this.dictionary[this.width]!, rng);
                case Difficulty.Impossible: return WordGameGenerator.randomWord(this.width, rng);
            }
        })();

        const game = new WordGame(this.dictionary, this.width, this.limit, word);
        return game;
    }

    setParams(params: URLSearchParams) {
        let modified = false;

        if (params.has("w")) this.width = parseInt(params.get("w") as string);
        if (params.has("l")) this.limit = parseInt(params.get("l") as string);
        if (params.has("d")) {
            switch (params.get("d") as string) {
                case "normal":
                    this.difficulty = Difficulty.Normal;
                    break;
                case "hard":
                    this.difficulty = Difficulty.Hard;
                    break;
                case "impossible":
                    this.difficulty = Difficulty.Impossible;
                    break;
            }
        }

        if (params.has("seed")) {
            switch (params.get("seed") as string) {
                case "daily":
                    this.setDailySeed();

                    if (params.has("s")) {
                        params.delete("s");
                        modified = true;
                    }
                    break;
                case "random":
                    this.setRandomSeed();

                    params.set("s", this.initialSeed);
                    modified = true;
                    break;
                default:
                    if (params.has("s")) {
                        this.setFixedSeed(params.get("s")!);
                    } else {
                        this.setDailySeed();
                    }
                    break;
            }
        }
        return modified;
    }

    static validateParams(params: URLSearchParams) {
        let modified = false;
        if (params.has("s")) {
            if (!params.has("seed") || params.get("seed")! !== "fixed") {
                params.set("seed", "fixed");
                modified = true;
            }
        }
        return modified;
    }

    setDailySeed() {
        this.seedType = SeedType.Daily;
        const start = new Date(2026, 4, 15);
        const today = new Date();
        const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        this.initialSeed = diff.toString();
        this.extraSeed = -1;
    }

    setRandomSeed() {
        this.seedType = SeedType.Random;
        this.initialSeed = WordGameGenerator.randomWord(5);
        this.extraSeed = -1;
    }

    setFixedSeed(s: string) {
        this.seedType = SeedType.Fixed;
        
        const reg = /^(.*)_(\d+)$/;
        const match = s.match(reg);

        if (match) {
            this.initialSeed = match[1];
            this.extraSeed = parseInt(match[2]) - 1;
        } else {
            this.initialSeed = s;
            this.extraSeed = -1;
        }
    }

    static randomWord(length: number, random: RandomNumberGenerator = Math.random) {
        const codes: number[] = [];
        for (let i = 0; i < length; i++) {
            codes.push(Math.floor(97 + random() * 26));
        }
        return String.fromCharCode(...codes);
    }

    static randomDictionaryWord(dictionary: string[][], random: RandomNumberGenerator = Math.random): string {
        const total = dictionary.reduce(((acc, arr) => acc + arr.length), 0);
        let randVal = Math.floor(random() * total);

        let i = 0;
        while (randVal > dictionary[i].length) {
            randVal -= dictionary[i].length;
            i++;
        }

        return dictionary[i][randVal];
    }
}

function formDeserialize(form: HTMLFormElement, params: URLSearchParams) {
    for(const [key, val] of params) {
        if (form.elements[key as any]) {
            const input = form.elements[key as any] as HTMLInputElement;
            switch(input.type) {
                case 'checkbox': input.checked = !!val; break;
                default:         input.value = val;     break;
            }
        }
    }
}

const INITIAL_URL = new URL(window.location.href);
const INITIAL_PARAMS = INITIAL_URL.searchParams;

const DICTIONARY = _dictionary as WordDictionary;
const FORM_SECTION = document.getElementById("formSection") as HTMLDivElement;
const FORM = document.getElementById("form") as HTMLFormElement;
const GENERATOR = new WordGameGenerator(DICTIONARY, INITIAL_PARAMS);
formDeserialize(FORM, INITIAL_PARAMS);

FORM.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const params = new URLSearchParams(formData as any);

    GENERATOR.setParams(params);

    const url = new URL(window.location.href);
    url.search = params.toString();
    window.history.replaceState({}, '', url.toString());
    
    FORM_SECTION.hidden = true;
    WORD_SECTION.hidden = false;
    MANAGER.active = true;
    MANAGER.newGame();
})

const WORD_SECTION = document.getElementById("wordSection") as HTMLDivElement;
const WORD_BOARD = document.getElementById("wordBoard") as HTMLDivElement;
const WORD_KEYBOARD = document.getElementById("wordKeyboard") as HTMLDivElement;
const WORD_BUTTONS = document.getElementById("wordButtons") as HTMLDivElement;
const WORD_NOTIFICATIONS = document.getElementById("wordNotifications") as HTMLDivElement;
const MANAGER: WordGameManager = new WordGameManager(() => GENERATOR.newGame(), WORD_BOARD, WORD_KEYBOARD, WORD_BUTTONS, WORD_NOTIFICATIONS);

(window as any).dictionary = DICTIONARY;
(window as any).WordGame = WordGame;
(window as any).generator = GENERATOR;
(window as any).manager = MANAGER;

export { }