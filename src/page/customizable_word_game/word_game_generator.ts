import { WordGame } from "./word_game";

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
    dictionary: string[][][];
    initialSeed: string = "";
    extraSeed: number = 0;

    seedType: SeedType = SeedType.Daily;
    difficulty: Difficulty = Difficulty.Normal;
    width: number = 5;
    maxWidth: number = 5;
    limit: number = 6;

    enforceDictionary = true;
    enforceUnique = false;

    constructor(dictionary: string[][][], initialParams?: URLSearchParams) {
        this.dictionary = dictionary;
        if (initialParams) {
            this.validateParams(initialParams);
        }
    }

    seed() {
        return this.extraSeed ? `${this.initialSeed}_${this.extraSeed}` : this.initialSeed!;
    }

    realSeed() {
        const seed = tsh(this.seed());

        let j = 0;
        j = addshift(j, this.maxWidth - 5, 5);
        j += this.width - 5;
        return (seed + j) >>> 0;
    }

    newGame() {
        const rng = random(this.realSeed());
        let word: string;
        switch (this.difficulty) {
            case Difficulty.Normal:
                word = WordGameGenerator.randomDictionaryWord(this.dictionary.slice(this.width, this.maxWidth + 1).map(arr => arr[1]), rng);
                break;
            case Difficulty.Hard:
                rng();
                word = WordGameGenerator.randomDictionaryWord(this.dictionary.slice(this.width, this.maxWidth + 1).flat(), rng);
                break;
            case Difficulty.Impossible:
                word = WordGameGenerator.randomWord(
                    this.width !== this.maxWidth
                        ? Math.floor(this.width + rng() * (this.maxWidth - this.width + 1))
                        : this.width
                    , rng);
                break;
        }

        const game = new WordGame(this.dictionary, this.width, this.limit, word);
        game.maxWidth = this.maxWidth;
        this.updateGameParams(game);
        return game;
    }

    updateGameParams(game: WordGame) {
        let needsReset = false;
        if (game.limit !== this.limit) {
            game.limit = this.limit;
            needsReset = true;
        }
        game.enforceDictionary = this.enforceDictionary;
        game.enforceUnique = this.enforceUnique;
        return needsReset;
    }

    setParams(params: URLSearchParams) {
        let needsNewGame = false;

        if (params.has("w")) {
            const w = parseInt(params.get("w")!);
            if (!isNaN(w) && w !== this.width) {
                this.width = w;
                needsNewGame = true;
            }
        }
        if (params.has("wmax")) {
            const wmax = parseInt(params.get("wmax")!);
            if (!isNaN(wmax) && wmax !== this.maxWidth) {
                this.maxWidth = wmax;
                needsNewGame = true;
            }
            if (this.maxWidth === this.width) {
                params.delete("wmax");
            }
        } else {
            if (this.maxWidth !== this.width) {
                this.maxWidth = this.width;
                needsNewGame = true;
            }
        }
        if (this.maxWidth < this.width) {
            const w = this.width;
            this.width = this.maxWidth;
            this.maxWidth = w;
            needsNewGame = true;
        }

        if (params.has("l")) {
            const l = parseInt(params.get("l")!);
            if (!isNaN(l) && l !== this.limit) {
                this.limit = l;
            }
        }

        this.enforceDictionary = !params.has("nodictionary");
        this.enforceUnique = params.has("unique");

        if (params.has("d")) {
            const d = (() => {
                switch (params.get("d")!) {
                    case "normal": return Difficulty.Normal
                    case "hard": return Difficulty.Hard
                    case "impossible": return Difficulty.Impossible
                }
            })();
            if (d !== undefined && d !== this.difficulty) {
                this.difficulty = d;
                needsNewGame = true;
            }
        }

        switch (params.get("seed")!) {
            case "daily":
                this.seedType = SeedType.Daily;
                const start = new Date(2026, 4, 15);
                const today = new Date();
                const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

                this.initialSeed = diff.toString();
                this.extraSeed = 0;

                params.set("s", this.seed());
                needsNewGame = true;
                break;
            case "random":
                this.seedType = SeedType.Random;
                this.initialSeed = WordGameGenerator.randomWord(5);
                this.extraSeed = 0;

                params.set("s", this.seed());
                needsNewGame = true;
                break;
            default:
                if (params.has("s")) {
                    if (this.setFixedSeed(params.get("s")!)) {
                        this.seedType = SeedType.Fixed;
                        needsNewGame = true;
                    } else {
                        switch (this.seedType) {
                            case SeedType.Daily:
                                params.set("seed", "daily");
                                break;
                            case SeedType.Random:
                                params.set("seed", "random");
                                break;
                        }
                    }
                } else {
                    params.set("s", "");
                    needsNewGame = true;
                }
                break;
        }
        return needsNewGame;
    }

    validateParams(params: URLSearchParams) {
        const w = WordGameGenerator.validateIntParam(params, "w");
        const wmax = WordGameGenerator.validateIntParam(params, "wmax");
        if (!isNaN(w) && !isNaN(wmax) && wmax < w) {
            params.set("w", wmax.toString());
            params.set("wmax", w.toString());
        }
        WordGameGenerator.validateIntParam(params, "l");

        switch (params.get("seed")!) {
            case "daily":
                this.seedType = SeedType.Daily;
                break;
            case "random":
                this.seedType = SeedType.Random;
                break;
            case "fixed":
                this.seedType = SeedType.Fixed;
                break;
        }

        if (params.has("s")) {
            this.setFixedSeed(params.get("s")!);
            params.set("seed", "fixed");
        }
    }

    static validateIntParam(params: URLSearchParams, name: string) {
        if (!params.has(name)) {
            return NaN;
        }
        const int = parseInt(params.get(name)!);
        if (isNaN(int)) {
            params.delete(name);
            return NaN;
        }
        return int;
    }

    setFixedSeed(s: string) {
        const reg = /^(.*)_(\d+)$/;
        const match = s.match(reg);

        let initialSeed: string;
        let extraSeed: number;
        if (match) {
            initialSeed = match[1];
            extraSeed = parseInt(match[2]);
        } else {
            initialSeed = s;
            extraSeed = 0;
        }
        let changed = initialSeed !== this.initialSeed || extraSeed !== this.extraSeed;
        this.initialSeed = initialSeed;
        this.extraSeed = extraSeed;
        return changed;
    }

    incrementSeed() {
        this.extraSeed!++;
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

function addshift(j: number, n: number, w: number) {
    j += n;
    w %= 32;
    return ((j << w) | (j >>> (32 - w))) >>> 0;
}

export { WordGameGenerator };