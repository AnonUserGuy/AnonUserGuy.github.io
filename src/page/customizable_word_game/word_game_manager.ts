import { LetterQuality, State, WordGame } from "./word_game";

class WordGameManager {
    private _game?: WordGame;
    gameGenerator: () => WordGame;

    isTabbed: boolean = false;
    active: boolean = false;
    input: string = "";

    board: HTMLDivElement;
    rows: HTMLDivElement[] = [];
    maxRowScrolledTo: number = -1;
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

        window.addEventListener("keydown", this.keyDown.bind(this));
        window.addEventListener("keyup", this.keyUp.bind(this));
        window.addEventListener("mousedown", this.mouseEvent.bind(this));
        window.addEventListener("pointerdown", this.mouseEvent.bind(this));
        window.addEventListener("touchstart", this.mouseEvent.bind(this));

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

    mouseEvent() {
        this.isTabbed = false;
    }

    targetDown(target: HTMLButtonElement) {
        target.classList.add("word-key-active");
    }

    targetUp(target: HTMLButtonElement) {
        target.classList.remove("word-key-active");
    }

    type(c: string) {
        if (this._game && (!this._game.params.enforceWidth || this.input.length < this._game.params.maxWidth)) {
            this.input += c;
            this.draw();
            return true;
        }
        return false;
    }

    enter() {
        if (this._game) {
            const result = this._game.guess(this.input);
            if (!result) {
                this.input = "";
                const row = this.row(this._game.guesses.length - 1);
                row.classList.remove("word-row-typing");
                this.scrollElementIntoView(row);
                this.draw();
                return true;
            }
            this.notify(result);
            this.wiggle(this.row(this._game.guesses.length));
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
        this.save();
    }

    save() {
        if (this._game && this._game.guesses.length > 0) {
            localStorage.setItem("wordGame", JSON.stringify(this._game));
        }
    }

    reset() {
        this.input = "";
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
        this.buttonContinue.addEventListener("click", this.continue.bind(this));
        this.buttonShare = this.buttons.appendChild(createElementEX("button", { "class": "word-button word-button-center" }, ["Share"]) as HTMLButtonElement);
        this.buttonShare.addEventListener("click", this.share.bind(this));
        this.buttonGiveUp = this.buttons.appendChild(createElementEX("button", { "class": "word-button" }, ["Give Up"]) as HTMLButtonElement);
        this.buttonGiveUp.addEventListener("click", this.giveUp.bind(this));
        this.buttonNewGame = this.buttons.appendChild(createElementEX("button", { "class": "word-button" }, ["New Game"]) as HTMLButtonElement);
        this.buttonNewGame.addEventListener("click", this.newGame.bind(this));
    }

    drawButtons() {
        if (!this._game) {
            return;
        }
        if (this.isGameActive() && this._game.state <= State.InProgress) {
            this.buttons.hidden = true;
            return;
        }
        this.buttons.hidden = false;

        this.buttonContinue.disabled = this._game.gaveUp || this._game.continuedState >= this._game.state;
        this.buttonGiveUp.hidden = this._game.gaveUp || this._game.state >= State.Won;
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
        this._game.continuedState = State.InProgress;
        this.draw();
    }

    newGame() {
        this.game = this.gameGenerator();
    }

    async notify(str: string) {
        const notification = this.notifications.appendChild(createElementEX("p", {}, [str]));
        await delay(1000);
        notification.classList.add("word-notification-fading");
        await delay(500);
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
                    key.addEventListener("click", this.type.bind(this, c));
                }

            }
        }

        this.keyenter = createElementEX("button", { "class": "word-key word-key-wide" }, ["⤶"]) as HTMLButtonElement;
        row!.prepend(this.keyenter);
        this.keyenter.addEventListener("click", this.enter.bind(this));
        this.keyback = row!.appendChild(createElementEX("button", { "class": "word-key word-key-wide" }, ["🡐"]) as HTMLButtonElement);
        this.keyback.addEventListener("click", this.back.bind(this));
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

        for (const [c, quality] of this._game.letters) {
            this.keys[c].setAttribute("data-state", (() => {
                switch (quality) {
                    case LetterQuality.Correct: return "correct";
                    case LetterQuality.Present: return "present";
                    case LetterQuality.Absent: return "absent";
                }
            })());
        }
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

            if (!guess) {
                this.row(i);
                continue;
            }
            let j = 0;
            for (; j < guess.length; j++) {
                const tile = this.tile(i, j);
                tile.innerText = guess.charAt(j);
                tile.setAttribute("data-state", (() => {
                    switch (quality[j]) {
                        case LetterQuality.Correct: return "correct";
                        case LetterQuality.Present: return "present";
                        case LetterQuality.Absent: return "absent";
                    }
                })());
            }
            for (; j < this._game.params.maxWidth; j++) {
                const tile = this.tile(i, j);
                tile.setAttribute("data-state", "skipped");
            }
        }

        if (this.input || this.rows[i]) {
            const row = this.row(i);
            const tiles = this.tiles[i];
            let j = 0;
            if (this.input.length) {
                if (this.maxRowScrolledTo < i) {
                    this.scrollElementIntoView(row);
                    this.maxRowScrolledTo = i;
                }
                row.classList.add("word-row-typing");
                for (; j < this.input.length; j++) {
                    const tile = this.tile(i, j);
                    tile.innerText = this.input.charAt(j);
                    tile.setAttribute("data-state", "typing");
                }
            }
            for (; j < this._game.params.maxWidth; j++) {
                const tile = this.tile(i, j);

                tile.innerText = "";
                tile.setAttribute("data-state", "empty");
            }
            const width = Math.max(j, this._game.params.maxWidth);
            while (tiles.length > width) {
                const tile = tiles.pop();
                if (tile) {
                    row.removeChild(tile);
                }
            }
            i++;
        }

        if (this.isGameActive()) {
            for (; i < this._game.params.limit; i++) {
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
        this.maxRowScrolledTo = -1;
        this.tiles = [];
    }

    row(i: number) {
        return this.rows[i] || this.initRow(i);
    }

    initRow(i: number) {
        let row: HTMLDivElement | null = null;

        for (let m = this.rows.length; m <= i; m++) {
            row = createElementEX("div", { "class": "word-row" }) as HTMLDivElement;
            this.rows[m] = row;
            this.tiles[m] = [];
            if (this._game) {
                this.initTile(m, this._game.params.maxWidth - 1);
            }
            this.board.appendChild(row);
        }

        return row || this.rows[i];
    }

    tile(i: number, j: number) {
        if (!this.tiles[i]) {
            this.initRow(i);
        }
        return this.tiles[i][j] || this.initTile(i, j);
    }

    initTile(i: number, j: number) {
        let tile: HTMLDivElement | null = null;

        for (let m = this.tiles[i].length; m <= j; m++) {
            tile = createElementEX("span", {
                "class": "word-tile",
                "data-state": "empty"
            }) as HTMLDivElement;

            if (this._game && m >= this._game.params.width) {
                tile.classList.add("word-tile-extra");
            }

            this.tiles[i][m] = tile;
            this.rows[i].appendChild(tile);
        }

        return tile || this.tiles[i][j];
    }

    scrollElementIntoView(element: HTMLElement) {
        const rect = element.getBoundingClientRect();
        if (rect.y < 0) {
            window.scrollBy(0, rect.y);
            return;
        }
        const bottom = rect.y + rect.height;
        const space = window.innerHeight - this.keyboard.offsetHeight;
        const diff = bottom - space;

        if (diff > 0) {
            window.scrollBy(0, diff);
        }
    }

    async animate(element: HTMLElement, className: string, duration: number) {
        if (element.classList.contains(className)) {
            return false;
        }
        element.classList.add(className);
        await delay(duration);
        element.classList.remove(className);
        return true;
    }

    wiggle(element: HTMLElement) {
        return this.animate(element, "word-wiggle", 500);
    }
}

export { WordGameManager };