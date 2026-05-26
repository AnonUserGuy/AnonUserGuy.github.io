import { WordGameParams } from "./word_game_params.js";

enum State {
    InProgress,
    Lost,
    Won
}

enum LetterQuality {
    Absent,
    Present,
    Correct
}

class LetterCounts {
    private readonly _data: { [index: string]: number } = {};

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

    set(c: string, count: number) {
        return this._data[c] = count;
    }

    merge(other: LetterCounts) {
        for (const [c, count] of other) {
            if (!this._data[c] || this._data[c] < count) {
                this._data[c] = count;
            }
        }
        return this;
    }

    *[Symbol.iterator](): Iterator<[string, number]> {
        for (const c in this._data) {
            yield [c, this._data[c]];
        }
    }
}

class LetterQualities {
    private readonly _data: { [index: string]: LetterQuality } = {};

    set(c: string, quality: LetterQuality) {
        if (!this._data[c] || quality > this._data[c]) {
            this._data[c] = quality;
        }
        return this._data[c];
    }

    get(c: string) {
        return this._data[c];
    }

    *[Symbol.iterator](): Iterator<[string, LetterQuality]> {
        for (const c in this._data) {
            yield [c, this._data[c]];
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

    greens: boolean[] = [];
    yellows: LetterCounts = new LetterCounts();

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

    guess(word: string): string {
        word = word.toLowerCase();

        if (this._params.enforceWidth && (word.length < this._params.width || word.length > this._params.maxWidth)) {
            return "Not enough letters";
        } else if (this._params.enforceDictionary && !this.dictionaryHas(word)) {
            return "Not in dictionary";
        } else if (this._params.enforceUnique && this.guesses.indexOf(word) !== -1) {
            return "Already guessed";
        } else if (!this.isActive()) {
            return "Out of guesses";
        } 
        
        if (this._params.hardmode) {
            const res = this.checkHardmode(word);
            if (res) {
                return res;
            }
        }

        this.forceGuess(word);
        return "";
    }

    forceGuess(word: string) {
        word = word.toLowerCase();

        const letterCounts = new LetterCounts();
        const yellows = new LetterCounts();
        const quality: LetterQuality[] = [];

        let won = word.length === this._solution.length;
        for (let i = 0; i < word.length; i++) {
            const c = word.charAt(i);

            if (this._solution.charAt(i) === c) {
                quality[i] = LetterQuality.Correct;
                this.letters.set(c, LetterQuality.Correct);

                this.greens[i] = true;
                yellows.add(c);
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
                        yellows.add(c);
                    }

                } else {
                    quality[i] = LetterQuality.Absent;
                    this.letters.set(c, LetterQuality.Absent);
                }
            }
            letterCounts.add(c);
        }
        this.yellows.merge(yellows);

        this.guesses.push(word);
        this.qualities.push(quality);

        if (won) {
            this.state = State.Won;
        } else if (this.state !== State.Won && this.guesses.length >= this._params.limit) {
            this.state = State.Lost;
        }
    }

    checkHardmode(word: string) {
        for (let i = 0; i < this.greens.length; i++) {
            if (!this.greens[i]) {
                continue;
            }
            const c = this.solution.charAt(i);
            if (word.charAt(i) !== c) {
                return `${i + 1}${this.getOrdinal(i + 1)} letter must be ${c.toUpperCase()}`;
            }
        }

        const letterCounts = new LetterCounts(word);

        for (const [c, count] of this.yellows) {
            if (letterCounts.get(c) < count) {
                if (count === 1) {
                    return `Guess must contain ${c.toUpperCase()}`;
                } else {
                    return `Guess must contain ${count} ${c.toUpperCase()}'s`;
                }
            }
        }
        return "";
    }

    private getOrdinal(n: number) {
        if (n % 10 == 1 && n % 100 != 11) {
            return 'st';
        }
        else if (n % 10 == 2 && n % 100 != 12) {
            return 'nd';
        }
        else if (n % 10 == 3 && n % 100 != 13) {
            return 'rd';
        }

        return 'th';
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

export { State, LetterQuality, LetterCounts, LetterQualities, WordGame };