import _dictionary from "./dictionary.json";

interface WordDictionary {
    [index: number]: [string[], string[]] | null;
}

enum WordGameState {
    InProgress,
    Won,
    Lost,
}

enum WordGameGuessResult {
    BadRepeat = -3,
    BadLength = -2,
    BadWord = -1,
    Valid = 0
}

enum WordGameLetterQuality {
    Absent,
    Present,
    Correct
}

class LetterCounts {
    private data: { [index: string]: number } = {};

    constructor(word?: string) {
        if (word) {
            for (let i = 0; i < word.length; i++) {
                const c = word.charAt(i);
                this.add(c);
            }
        }
    }

    add(c: string) {
        if (!this.data[c]) {
            this.data[c] = 1;
        } else {
            this.data[c]++;
        }
        return this.data[c];
    }

    get(c: string) {
        return this.data[c] || 0;
    }
}

class LetterQualities {
    private data: { [index: string]: WordGameLetterQuality } = {};

    set(c: string, quality: WordGameLetterQuality) {
        if (!this.data[c] || quality > this.data[c]) {
            this.data[c] = quality;
        }
        return this.data[c];
    }

    get(c: string) {
        return this.data[c];
    }

    forEach(fn: (c: string, quality: WordGameLetterQuality) => any) {
        for (const c in this.data) {
            fn(c, this.data[c]);
        }
    }
}

class WordGame {
    readonly dictionary: string[][];
    readonly limit: number;
    readonly width: number;
    readonly solution: string;
    readonly letterCounts: LetterCounts;
    readonly guesses: string[];
    readonly qualities: WordGameLetterQuality[][];
    readonly letters: LetterQualities;

    state: WordGameState;

    enforceWidth = true;
    enforceDictionary = true;
    enforceRepeat = true;

    constructor(width: number, limit: number, solution?: string, guesses?: string[][], solutions?: string[][]) {
        this.dictionary = [];
        if (guesses) {
            for (const guesses2 of guesses) {
                this.dictionary.push(guesses2);
            }
        } 
        if (solutions) {
            for (const solutions2 of solutions) {
                this.dictionary.push(solutions2);
            }
        }
        this.limit = limit;
        this.width = width;
        if (solution) {
            this.solution = solution;
        } else if (solutions) {
            this.solution = WordGame.randomSolution(solutions);
        } else {
            this.solution = WordGame.randomSolution(this.dictionary);
        }
        this.letterCounts = new LetterCounts(this.solution);
        this.guesses = [];
        this.qualities = [];
        this.letters = new LetterQualities();
        this.state = WordGameState.InProgress;
    }

    dictionaryHas(word: string): boolean {
        return word === this.solution || this.dictionary.some(arr => WordGame.binarySearch(arr, word) !== -1);
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

    static randomSolution(dictionary: string[][]): string {
        const total = dictionary.reduce(((acc, arr) => acc + arr.length), 0);
        let randVal = Math.floor(Math.random() * total);

        let i = 0;
        while (randVal > dictionary[i].length) {
            randVal -= dictionary[i].length;
            i++;
        }

        return dictionary[i][randVal];
    }

    guess(word: string) {
        word = word.toLowerCase();

        if (this.enforceWidth && word.length !== this.width) {
            return WordGameGuessResult.BadLength;
        } else if (this.enforceDictionary && !this.dictionaryHas(word)) {
            return WordGameGuessResult.BadWord;
        } else if (this.enforceRepeat && this.guesses.indexOf(word) !== -1) {
            return WordGameGuessResult.BadRepeat;
        }

        return this.forceGuess(word);
    }

    forceGuess(word: string) {
        word = word.toLowerCase();

        const letterCounts = new LetterCounts();
        const quality: WordGameLetterQuality[] = [];

        let won = true;
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
        } else if (this.guesses.length >= this.limit) {
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

                let out3: string;
                switch (q) {
                    case WordGameLetterQuality.Correct:
                        out3 = `[${c}]`;
                        break;
                    case WordGameLetterQuality.Present:
                        out3 = `(${c})`;
                        break;
                    case WordGameLetterQuality.Absent:
                        out3 = ` ${c} `;
                        break;
                }
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
        let out: string[] = [];
        for (let i = 0; i < this.guesses.length; i++) {
            const guess = this.guesses[i];
            const quality = this.qualities[i];

            let out2: string[] = [];
            for (let j = 0; j < guess.length; j++) {
                const q = quality[j];

                let out3: string;
                switch (q) {
                    case WordGameLetterQuality.Correct:
                        out3 = "🟩";
                        break;
                    case WordGameLetterQuality.Present:
                        out3 = "🟨";
                        break;
                    case WordGameLetterQuality.Absent:
                        out3 = "⬛";
                        break;
                }
                out2.push(out3);
            }
            out.push(out2.join(""));
        }

        return out.join("\n");
    }
}

class WordGameManager {
    input: string = "";
    game?: WordGame;

    board: HTMLDivElement;
    rows: HTMLDivElement[] = [];
    tiles: HTMLDivElement[][] = [];

    keyboard: HTMLDivElement;
    keys: { [index: string]: HTMLDivElement } = {};

    constructor(game?: WordGame, board?: HTMLDivElement, keyboard?: HTMLDivElement) {
        this.game = game;
        if (!board) {
            this.board = createElementEX("div", { "class": "word-board" }) as HTMLDivElement;
        } else {
            this.board = board;
        }
        if (!keyboard) {
            this.keyboard = createElementEX("div", { "class": "word-keyboard" }) as HTMLDivElement;
        } else {
            this.keyboard = keyboard;
        }

        this.initKeyboard();
        this.draw();
    }

    onkeydown(event: KeyboardEvent) {
        if (!this.game) {
            return;
        }
        if (event.repeat) {
            return;
        }
        const key = event.key;
        if (key.length === 1) {
            const code = key.charCodeAt(0);
            if (code >= 64 && code <= 90) {
                this.type(String.fromCharCode(code + 32));
            } else if (code >= 97 && code <= 122) {
                this.type(key);
            }
        } else if (key === "Backspace") {
            this.back();
        } else if (key === "Enter") {
            this.enter();
        }
    }

    type(c: string) {
        if (this.game && (!this.game.enforceWidth || this.input.length < this.game.width)) {
            this.input += c;
            this.draw();
            return true;
        }
        return false;
    }

    enter() {
        if (this.game) {
            const result = game.guess(this.input);
            if (result === WordGameGuessResult.Valid) {
                this.input = "";
                this.draw();
                return true;
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
    }

    drawKeyboard() {
        if (!this.game) {
            return;
        }
        this.game.letters.forEach((c, quality) => {
            this.keys[c].setAttribute("data-state", (() => {
                switch (quality) {
                    case WordGameLetterQuality.Correct: return "correct";
                    case WordGameLetterQuality.Present: return "present";
                    case WordGameLetterQuality.Absent: return "absent";
                }
            })());
        });
    }

    initKeyboard() {
        /* if ((navigator as any).keyboard) {
            const keyboard = (navigator as any).keyboard;
        }  */

        const keys = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

        let row: HTMLDivElement;
        for (let i = 0; i < keys.length; i++) {
            const str = keys[i];

            row = this.keyboard.appendChild(createElementEX("div", { "class": "word-keyrow" }) as HTMLDivElement);

            for (let j = 0; j < str.length; j++) {
                const c = str.charAt(j);

                const key = row.appendChild(createElementEX("div", { "class": "word-key" }, [c]) as HTMLDivElement);
                this.keys[c] = key;
                key.addEventListener("click", () => this.type(c));
            }
        }

        const enter = createElementEX("div", { "class": "word-key word-key-wide" }, ["⤶"]) as HTMLDivElement;
        row!.prepend(enter);
        enter.addEventListener("click", () => this.enter());
        const back = row!.appendChild(createElementEX("div", { "class": "word-key word-key-wide" }, ["←"]) as HTMLDivElement);
        back.addEventListener("click", () => this.back());
    }

    drawBoard() {
        if (!this.game) {
            this.board.replaceChildren();
            this.rows = [];
            this.tiles = [];
            return;
        }

        let i = 0;
        for (; i < this.game.guesses.length; i++) {
            const guess = this.game.guesses[i];
            const quality = this.game.qualities[i];

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
            for (; j < this.game.width; j++) {
                const tile = this.tile(i, j);
                tile.innerText = "";
                tile.setAttribute("data-state", "empty");
            }
            const width = Math.max(j, this.game.width);
            while (tiles.length > width) {
                const tile = tiles.pop();
                if (tile) {
                    row.removeChild(tile);
                }
            }
            i++;
        }

        for (; i < this.game.limit; i++) {
            this.row(i);
        }
    }

    row(i: number) {
        return this.rows[i] || this.initRow(i);
    }

    initRow(i: number) {
        const row = createElementEX("div", { "class": "word-row" }) as HTMLDivElement;
        this.rows[i] = row;
        this.tiles[i] = [];

        for (let j = 0; j < this.game!.width; j++) {
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

function randomWord(length: number) {
    const codes: number[] = [];
    for (let i = 0; i < length; i++) {
        codes.push(Math.floor(97 + Math.random() * 26));
    }
    return String.fromCharCode(...codes);
}

const dictionary = _dictionary as WordDictionary;
const wordBoard = document.getElementById("wordBoard") as HTMLDivElement;
const wordKeyboard = document.getElementById("wordKeyboard") as HTMLDivElement;
const game = new WordGame(5, 6, randomWord(5), [dictionary[5]![0]], [dictionary[5]![1]]);
const gameManager = new WordGameManager(game, wordBoard, wordKeyboard);

window.addEventListener("keydown", (event) => gameManager.onkeydown(event));

(window as any).dictionary = dictionary;
(window as any).WordGame = WordGame;
(window as any).game = game;
(window as any).gameManager = gameManager;

export { }