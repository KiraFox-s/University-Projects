
import { ScoreManager } from "./ScoreManager.js";
import { formatTime } from "./TimeFormatter.js";

export class GameTimer {
    static elapsed = 0;
    static startedAt = null;
    static running = false;
    static currentLevel = null;
    static gameMode = "story";

    static results = GameTimer.loadResults();
    static pendingResult = null;

    static loadResults() {
        try {
            const saved = localStorage.getItem("spiritFoxLevelResults");

            if (!saved) {
                return {};
            }

            const parsed = JSON.parse(saved);

            return parsed && typeof parsed === "object" && !Array.isArray(parsed)
                ? parsed
                : {};
        } catch (error) {
            console.error("Level results could not be loaded:", error);
            return {};
        }
    }

    static saveResults() {
        try {
            localStorage.setItem(
                "spiritFoxLevelResults",
                JSON.stringify(this.results)
            );

            return true;
        } catch (error) {
            console.error("Level results could not be saved:", error);
            return false;
        }
    }

    static setGameMode(mode) {
        if (mode !== "level" && mode !== "story") {
            console.error(`Invalid game mode: ${mode}`);
            return false;
        }

        if (this.gameMode === mode) {
            return true;
        }

        if (this.currentLevel !== null) {
            console.warn(
                "Finish the current level before changing game mode."
            );
            return false;
        }

        this.gameMode = mode;
        return true;
    }

    static getGameMode() {
        return this.gameMode;
    }

    // Käynnistää uuden tason omasta nollapisteestään.
    static startLevel(levelId) {
        if (levelId === null || levelId === undefined || levelId === "") {
            console.error("Cannot start timer without a level ID.");
            return false;
        }

        if (this.currentLevel !== null) {
            if (this.currentLevel === levelId) {
                // Samaa tasoa ei käynnistetä uudelleen, jos sen ajastin
                // on jo aktiivinen tai tauolla.
                return false;
            }

            console.warn(
                `Cannot start ${levelId}: ${this.currentLevel} has not been finished.`
            );
            return false;
        }

        this.currentLevel = levelId;
        this.elapsed = 0;
        this.startedAt = Date.now();
        this.running = true;
        this.pendingResult = null;

        return true;
    }

    // Tauko säilyttää aktiivisen tason ja sen ajan.
    static pause() {
        if (!this.running || this.startedAt === null) {
            return;
        }

        this.elapsed += Date.now() - this.startedAt;
        this.startedAt = null;
        this.running = false;
    }

    // Jatkaa saman tason ajanottoa tauon jälkeen.
    static resume() {
        if (this.running || this.currentLevel === null) {
            return;
        }

        this.startedAt = Date.now();
        this.running = true;
    }

    static getElapsed() {
        if (this.running && this.startedAt !== null) {
            return this.elapsed + Date.now() - this.startedAt;
        }

        return this.elapsed;
    }

    static getCurrentLevel() {
        return this.currentLevel;
    }

        // Palauttaa tallennetun tason ajastimen.
    static restoreLevel(levelId, elapsed = 0, running = true) {
        if (
            typeof levelId !== "string" ||
            !levelId.trim() ||
            !Number.isFinite(elapsed) ||
            elapsed < 0
        ) {
            console.error("Invalid saved timer state.");
            return false;
        }

        this.currentLevel = levelId;
        this.elapsed = elapsed;
        this.pendingResult = null;

        if (running) {
            this.startedAt = Date.now();
            this.running = true;
        } else {
            this.startedAt = null;
            this.running = false;
        }

        return true;
    }

    static isRunning() {
        return this.running;
    }

    // Päättää tason ja vapauttaa ajastimen seuraavaa tasoa varten.
    // Level Mode -tulosta ei tallenneta ennätyksiin automaattisesti.
    static finishLevel(score = 0) {
        if (this.currentLevel === null) {
            return null;
        }

        this.pause();

        const result = {
            level: this.currentLevel,
            time: this.getElapsed(),
            score: Math.max(0, Number(score) || 0),
            gameMode: this.gameMode,
            completedAt: new Date().toISOString()
        };

        if (this.gameMode === "level") {
            // Odotetaan pelaajan päätöstä ennen ennätyksen tallentamista.
            this.pendingResult = { ...result };
        } else {
            // Story Moden tulokset käsittelee StoryModeManager.
            this.pendingResult = null;
        }

        this.currentLevel = null;
        this.elapsed = 0;
        this.startedAt = null;
        this.running = false;

        return { ...result };
    }

    static getPendingResult() {
        return this.pendingResult ? { ...this.pendingResult } : null;
    }

    // Tallentaminen edellyttää pelaajan erillistä hyväksyntää
    // ja nimeä. ScoreManager tarkistaa Top 3 -kelpoisuuden.
    static savePendingResult(playerName) {
        const result = this.pendingResult;

        if (!result || result.gameMode !== "level") {
            return false;
        }

        const saved = ScoreManager.saveLevelResult(
            result.level,
            result.time,
            result.score,
            playerName
        );

        if (saved) {
            this.pendingResult = null;
        }

        return saved;
    }

    static discardPendingResult() {
        this.pendingResult = null;
    }

    static getFormattedTime() {
        return formatTime(this.getElapsed());
    }

    static getAllResults() {
        return Object.values(this.results);
    }

    static getResult(levelId) {
        return this.results[levelId] || null;
    }

    // Nollaa aktiivisen tason ajan tallentamatta tulosta.
    static reset() {
        this.elapsed = 0;
        this.startedAt = null;
        this.running = false;
        this.currentLevel = null;
        this.pendingResult = null;
    }
}
