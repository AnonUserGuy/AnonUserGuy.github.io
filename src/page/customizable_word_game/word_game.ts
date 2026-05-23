import { WordGameParams } from "./word_game_params.js";

enum State {
    InProgress,
    Lost,
    Won
}

enum GuessResult {
    BadLimit = -4,
    BadRepeat = -3,
    BadWidth = -2,
    BadWord = -1,
    Valid = 0
}

enum LetterQuality {
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
    private _data: { [index: string]: LetterQuality } = {};

    set(c: string, quality: LetterQuality) {
        if (!this._data[c] || quality > this._data[c]) {
            this._data[c] = quality;
        }
        return this._data[c];
    }

    get(c: string) {
        return this._data[c];
    }

    forEach(fn: (c: string, quality: LetterQuality) => any) {
        for (const c in this._data) {
            fn(c, this._data[c]);
        }
    }
}

class WordGame {
    dictionary: string[][][];

    private _solution!: string;
    private _letterCounts!: LetterCounts;
    guesses: string[] = [];
    qualities: LetterQuality[][] = [];
    letters: LetterQualities = new LetterQualities();

    state: State = State.InProgress;
    continuedState: State = State.InProgress;
    gaveUp = false;

    private _params!: WordGameParams;

    constructor(dictionary: string[][][], params: WordGameParams, solution?: string) {
        this.dictionary = dictionary;
        this.params = params;
        if (solution !== undefined) {
            this.solution = solution;
        } else if (this.dictionary[this.params.width]) {
            this.solution = params.getWord(dictionary);
        } else {
            this.solution = "a".repeat(this.params.width);
        }
    }

    toJSON() {
        return {
            guesses: this.guesses,
            solution: this.solution,
            params: this.params
        }
    }

    static fromJSON(dictionary: string[][][], obj: any) {
        if (typeof obj === "string") {
            obj = JSON.parse(obj);
        }
        const params = WordGameParams.fromJSON(obj.params);
        const solution: string = obj.solution;
        const guesses: string[] = obj.guesses;
        const game = new WordGame(dictionary, params, solution);
        for (const guess of guesses) {
            game.forceGuess(guess);
        }
        return game;
    }

    get solution() {
        return this._solution;
    }
    set solution(solution: string) {
        this._solution = solution;
        this._letterCounts = new LetterCounts(this._solution);
    }

    get letterCounts() {
        return this._letterCounts;
    }

    get params() {
        return this._params;
    }
    set params(params: WordGameParams) {
        this._params = params;
        this.updateLost();
    }

    updateLost() {
        if (this.guesses.length >= this._params.limit && this.state === State.InProgress) {
            this.state = State.Lost;
        } else if (!this.gaveUp && this.guesses.length < this._params.limit && this.state === State.Lost) {
            this.state = State.InProgress;
        }
    }

    dictionaryHas(word: string): boolean {
        return word === this._solution ||
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

        if (this._params.enforceWidth && (word.length < this._params.width || word.length > this._params.maxWidth)) {
            return GuessResult.BadWidth;
        } else if (this._params.enforceDictionary && !this.dictionaryHas(word)) {
            return GuessResult.BadWord;
        } else if (this._params.enforceUnique && this.guesses.indexOf(word) !== -1) {
            return GuessResult.BadRepeat;
        } else if (!this.isActive()) {
            return GuessResult.BadLimit;
        }

        return this.forceGuess(word);
    }

    forceGuess(word: string) {
        word = word.toLowerCase();

        const letterCounts = new LetterCounts();
        const quality: LetterQuality[] = [];

        let won = word.length === this._solution.length;
        for (let i = 0; i < word.length; i++) {
            const c = word.charAt(i);

            if (this._solution.charAt(i) === c) {
                quality[i] = LetterQuality.Correct;
                this.letters.set(c, LetterQuality.Correct);
            } else {
                won = false;
                const guessCount = letterCounts.get(c);
                const solutionCount = this._letterCounts.get(c);

                if (guessCount < solutionCount) {

                    let futureCsInCorrectPosition = 0;
                    let futureHasCorrect = false;
                    for (let j = i + 1; j < word.length; j++) {
                        const c2 = word.charAt(j);
                        if (c === c2 && this._solution.charAt(j) === c2) {
                            futureCsInCorrectPosition++;

                            if (guessCount + futureCsInCorrectPosition >= solutionCount) {
                                futureHasCorrect = true;
                                break;
                            }
                        }
                    }
                    if (futureHasCorrect) {
                        quality[i] = LetterQuality.Absent;
                        this.letters.set(c, LetterQuality.Absent);
                    } else {
                        quality[i] = LetterQuality.Present;
                        this.letters.set(c, LetterQuality.Present);
                    }

                } else {
                    quality[i] = LetterQuality.Absent;
                    this.letters.set(c, LetterQuality.Absent);
                }
            }
            letterCounts.add(c);
        }
        this.guesses.push(word);
        this.qualities.push(quality);

        if (won) {
            this.state = State.Won;
        } else if (this.state !== State.Won && this.guesses.length >= this._params.limit) {
            this.state = State.Lost;
        }

        return GuessResult.Valid;
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
                        case LetterQuality.Correct: return `[${c}]`;
                        case LetterQuality.Present: return `(${c})`;
                        case LetterQuality.Absent: return ` ${c} `;
                    }
                })();
                out2.push(out3);
            }
            out.push(out2.join(" "));
        }
        for (let i = this.guesses.length; i < this._params.limit; i++) {
            out.push(Array(this._params.maxWidth).fill(" _ ").join(" "));
        }

        return out.join("\n");
    }

    toEmoji(): string {
        const url = window.location.href.replace("/customizable_word_game/", "/cwg/");
        let out: string[] = [`${url}\n===== ${this.state === State.Lost ? "X" : this.guesses.length}/${this._params.limit} =====`];
        for (let i = 0; i < this.guesses.length; i++) {
            const guess = this.guesses[i];
            const quality = this.qualities[i];

            let out2: string[] = [];
            for (let j = 0; j < guess.length; j++) {
                const q = quality[j];

                let out3 = (() => {
                    switch (q) {
                        case LetterQuality.Correct: return "🟩";
                        case LetterQuality.Present: return "🟨";
                        case LetterQuality.Absent: return "⬛";
                    }
                })();
                out2.push(out3);
            }
            out.push(out2.join(""));
        }

        return out.join("\n");
    }
}

export { State, GuessResult, LetterQuality, LetterCounts, LetterQualities, WordGame };