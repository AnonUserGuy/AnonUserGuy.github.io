
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

class WordGameParams {
    static readonly startDate = new Date(2026, 4, 15);

    difficulty: Difficulty = Difficulty.Normal;
    seed: string = "";
    extraSeed: number = 0;

    limit: number = 6;
    width: number = 5;
    maxWidth: number = 5;

    enforceWidth = true;
    enforceDictionary = true;
    enforceUnique = false;
    hardmode = false;

    static fromURLSearchParams(search: URLSearchParams, oldParams?: WordGameParams) {
        const params = new WordGameParams;

        if (search.has("w")) {
            const w = parseInt(search.get("w")!);
            if (!isNaN(w)) {
                params.width = w;
            }
        }
        if (search.has("wmax")) {
            const wmax = parseInt(search.get("wmax")!);
            if (!isNaN(wmax)) {
                params.maxWidth = wmax;
            }
            if (params.maxWidth === params.width) {
                search.delete("wmax");
            } else if (params.maxWidth < params.width) {
                const w = params.width;
                params.width = params.maxWidth;
                params.maxWidth = w;

                search.set("w", params.width.toString());
                search.set("wmax", params.maxWidth.toString());
            }
        } else {
            params.maxWidth = params.width;
        }

        if (search.has("l")) {
            const l = parseInt(search.get("l")!);
            if (!isNaN(l)) {
                params.limit = l;
            }
        }

        params.enforceDictionary = !search.has("nodictionary");
        params.enforceUnique = search.has("unique");
        params.hardmode = search.has("hard");

        if (search.has("d")) {
            const d = (() => {
                switch (search.get("d")!) {
                    case "normal": return Difficulty.Normal
                    case "hard": return Difficulty.Hard
                    case "impossible": return Difficulty.Impossible
                }
            })();
            if (d !== undefined && d !== params.difficulty) {
                params.difficulty = d;
            }
        }

        switch (search.get("seed")!) {
            case "daily":
                params.seed = this.getSeedFromDate(new Date()).toString();
                params.extraSeed = 0;

                search.set("s", params.stringSeed());
                break;
            case "random":
                params.seed = WordGameParams.randomWord(8);
                params.extraSeed = 0;

                search.set("s", params.stringSeed());
                break;
            default:
                if (search.get("date") && search.get("seed") !== "fixed") {
                    const dateStr = search.get("date")!;
                    const [year, month, day] = dateStr.split('-').map(Number);
                    const date = new Date(year, month - 1, day);

                    params.seed = this.getSeedFromDate(date).toString();
                    params.extraSeed = 0;

                    search.set("s", params.stringSeed());

                } else if (search.has("s")) {
                    const s = search.get("s")!;
                    const reg = /^(.*)_(\d+)$/;
                    const match = s.match(reg);

                    if (match) {
                        params.seed = match[1];
                        params.extraSeed = parseInt(match[2]);
                    } else {
                        params.seed = s;
                        params.extraSeed = 0;
                    }
                }
                break;
        }
        search.delete("date");
        search.delete("seed");

        return params;
    }

    static getSeedFromDate(d: Date) {
        return Math.floor((d.valueOf() - this.startDate.valueOf()) / (1000 * 60 * 60 * 24));
    }

    static getDateFromSeed(n: number | string) {
        if (typeof n === "string") {
            n = parseInt(n);
            if (isNaN(n)) {
                return null;
            }
        }
        return new Date(this.startDate.valueOf() + n * (1000 * 60 * 60 * 24));
    }

    date() {
        return WordGameParams.getDateFromSeed(this.seed);
    }

    toURLSearchParams(search?: URLSearchParams) {
        if (!search) {
            search = new URLSearchParams();
        }
        search.set("w", this.width.toString());
        if (this.maxWidth !== this.width) {
            search.set("wmax", this.maxWidth.toString());
        }
        search.set("l", this.limit.toString());
        if (!this.enforceDictionary) search.set("nodictionary", "on");
        if (this.enforceUnique) search.set("unique", "on");
        if (this.hardmode) search.set("hard", "on");
        search.set("d", (() => {
            switch (this.difficulty) {
                case Difficulty.Normal: return "normal";
                case Difficulty.Hard: return "hard";
                case Difficulty.Impossible: return "impossible";
            }
        })());
        search.set("seed", "fixed");
        search.set("s", this.stringSeed());
        return search;
    }

    static fromJSON(obj: any) {
        if (typeof obj === "string") {
            obj = JSON.parse(obj);
        }
        const params = new WordGameParams();
        Object.assign(params, obj);
        return params;
    }

    stringSeed() {
        return this.extraSeed ? `${this.seed}_${this.extraSeed}` : this.seed;
    }

    realSeed() {
        const seed = tsh(this.stringSeed());

        let j = 0;
        j = this.addshift(j, this.maxWidth - 5, 5);
        j += this.width - 5;
        return (seed + j) >>> 0;
    }

    private addshift(j: number, n: number, w: number) {
        j += n;
        w %= 32;
        return ((j << w) | (j >>> (32 - w))) >>> 0;
    }

    incrementSeed() {
        this.extraSeed++;
    }

    getWord(dictionary: string[][][]) {
        const rng = random(this.realSeed());
        let word: string;
        switch (this.difficulty) {
            case Difficulty.Normal:
                word = WordGameParams.randomDictionaryWord(dictionary.slice(this.width, this.maxWidth + 1).map(arr => arr[1]), rng);
                break;
            case Difficulty.Hard:
                rng();
                word = WordGameParams.randomDictionaryWord(dictionary.slice(this.width, this.maxWidth + 1).flat(), rng);
                break;
            case Difficulty.Impossible:
                word = WordGameParams.randomWord(
                    this.width !== this.maxWidth
                        ? Math.floor(this.width + rng() * (this.maxWidth - this.width + 1))
                        : this.width
                    , rng);
                break;
        }
        return word;
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

    clone() {
        const params = new WordGameParams();
        Object.assign(params, this); // *currently* doesn't need deep copy
        return params;
    }

    needsNewGame(other: WordGameParams) {
        return this.width !== other.width ||
            this.maxWidth !== other.maxWidth ||
            this.difficulty !== other.difficulty ||
            this.seed !== other.seed ||
            this.extraSeed !== other.extraSeed;
    }

    needsReset(other: WordGameParams) {
        return this.limit !== other.limit;
    }
}

export { SeedType, Difficulty, WordGameParams };