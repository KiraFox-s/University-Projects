
import { formatTime } from "./TimeFormatter.js";
import { GameTimer } from "./GameTimer.js";

const STORY_SAVE_KEY = "spiritFoxStorySave";

const VALID_SCENES = [
    "Level1Scene",
    "Level2Scene",
    "Level3Scene",
    "BossLevelScene"
];

const VALID_RESULT_IDS = [
    "Level 1",
    "Level 2",
    "Level 3",
    "Boss Level: Shadow Eagle"
];

export class StoryModeManager {
    static active = false;
    static totalScore = 0;
    static totalTime = 0;
    static startedAt = null;
    static running = false;
    static levelResults = [];
    static completedLevels = [];
    static currentLevel = null;
    static lives = 3;

    // Tason täydellinen tila, jonka taso itse toimittaa managerille.
    static levelStates = {};
    static currentLevelState = null;

    static start(initialLives = 3) {
        this.reset();

        this.active = true;
        this.lives = Math.max(0, Number(initialLives) || 0);

        this.resumeTimer();
    }

    static resumeTimer() {
        if (!this.active || this.running) {
            return;
        }

        this.startedAt = Date.now();
        this.running = true;
    }

    static pauseTimer() {
        if (!this.running || this.startedAt === null) {
            return;
        }

        this.totalTime += Date.now() - this.startedAt;
        this.startedAt = null;
        this.running = false;
    }

    static getTotalTime() {
        // Lasketaan kaikkien suoritettujen tasojen ajat yhteen.
        const completedTime = this.levelResults.reduce(
            (sum, result) => sum + (Number(result.time) || 0),
            0
        );

        // Lisätään käynnissä olevan tason tähänastinen aika.
        const currentLevelTime =
            this.active && GameTimer.getCurrentLevel() !== null
                ? GameTimer.getElapsed()
                : 0;

        return completedTime + currentLevelTime;
    }

    static addLevelResult(levelId, score = 0, time = 0) {
        if (!this.active || !levelId) {
            return false;
        }

        if (this.levelResults.some(result => result.level === levelId)) {
            return false;
        }

        const cleanScore = Math.max(0, Number(score) || 0);
        const cleanTime = Math.max(0, Number(time) || 0);

        this.levelResults.push({
            level: levelId,
            score: cleanScore,
            time: cleanTime
        });

        this.totalScore += cleanScore;

        if (!this.completedLevels.includes(levelId)) {
            this.completedLevels.push(levelId);
        }

        return true;
    }

    static setCurrentLevel(levelId) {
        this.currentLevel = VALID_SCENES.includes(levelId)
            ? levelId
            : null;

        this.currentLevelState =
            this.currentLevel && this.levelStates[this.currentLevel]
                ? structuredClone(this.levelStates[this.currentLevel])
                : null;
    }

    static setLives(lives) {
        const value = Number(lives);

        if (Number.isFinite(value)) {
            this.lives = Math.max(0, Math.floor(value));
        }
    }

    /**
     * Taso toimittaa tänne oman pelitilansa.
     * state voi sisältää esimerkiksi ketun sijainnin,
     * kristallit, viholliset, ansat ja pomon tilan.
     */
    static saveLevelState(levelId, state) {
        if (!VALID_SCENES.includes(levelId) || !state ||
            typeof state !== "object" || Array.isArray(state)) {
            return false;
        }

        try {
            const safeState = JSON.parse(JSON.stringify(state));

            this.levelStates[levelId] = safeState;

            if (this.currentLevel === levelId) {
                this.currentLevelState = structuredClone(safeState);
            }

            return true;
        } catch (error) {
            console.error("Tason tilan valmistelu tallennukseen epäonnistui:", error);
            return false;
        }
    }

    /**
     * Taso pyytää managerilta aiemmin tallennetun tilansa.
     */
    static getLevelState(levelId = this.currentLevel) {
        if (!VALID_SCENES.includes(levelId)) {
            return null;
        }

        const state = this.levelStates[levelId];

        return state ? structuredClone(state) : null;
    }

    static getFormattedTotalTime() {
        return formatTime(this.getTotalTime());
    }

    static getTimerLevelName(sceneKey) {
        const levelNames = {
            Level1Scene: "Level 1",
            Level2Scene: "Level 2",
            Level3Scene: "Level 3",
            BossLevelScene: "Boss Level: Shadow Eagle"
        };

        return levelNames[sceneKey] ?? null;
    }

    static getSummary() {
        return {
            totalScore: this.totalScore,
            totalTime: this.getTotalTime(),
            formattedTime: this.getFormattedTotalTime(),
            levelResults: this.levelResults.map(result => ({ ...result })),
            completedLevels: [...this.completedLevels],
            currentLevel: this.currentLevel,
            lives: this.lives
        };
    }

    /**
     * Tallentaa Story Moden etenemisen ja nykyisen tason tilan.
     * currentLevelState pitää ensin päivittää saveLevelState()-metodilla.
     */
    static saveProgress(currentLevel = this.currentLevel) {
        if (!this.active || !VALID_SCENES.includes(currentLevel)) {
            return false;
        }

        const wasRunning = this.running;
        this.pauseTimer();

        try {
            const save = {
                version: 2,
                gameMode: "story",
                currentLevel,
                currentLevelState:
                    this.levelStates[currentLevel] ?? this.currentLevelState,
                levelStates: JSON.parse(JSON.stringify(this.levelStates)),
                completedLevels: [...this.completedLevels],
                levelResults: this.levelResults.map(result => ({ ...result })),
                totalScore: this.totalScore,
                totalTime: this.totalTime,
                lives: this.lives,
                gameTimer: {
                    currentLevel: GameTimer.getCurrentLevel(),
                    elapsed: GameTimer.getElapsed(),
                    running: GameTimer.isRunning()
                },
                savedAt: new Date().toISOString()
            };

            localStorage.setItem(STORY_SAVE_KEY, JSON.stringify(save));
            return true;
        } catch (error) {
            console.error("Story Moden tallentaminen epäonnistui:", error);

            if (wasRunning) {
                this.resumeTimer();
            }

            return false;
        }
    }

    /**
     * Palauttaa Story Moden managerin tilan tallennuksesta.
     */
    static loadProgress(save) {
        if (
            !save ||
            save.gameMode !== "story" ||
            !VALID_SCENES.includes(save.currentLevel) ||
            !Number.isFinite(save.totalScore) ||
            save.totalScore < 0 ||
            !Number.isFinite(save.totalTime) ||
            save.totalTime < 0 ||
            !Number.isInteger(save.lives) ||
            save.lives < 0 ||
            save.lives > 3 ||
            !Array.isArray(save.completedLevels) ||
            !Array.isArray(save.levelResults)
        ) {
            return false;
        }

        if (!save.completedLevels.every(level => VALID_RESULT_IDS.includes(level))) {
            return false;
        }

        if (!save.levelResults.every(result =>
            result &&
            VALID_RESULT_IDS.includes(result.level) &&
            Number.isFinite(result.score) &&
            result.score >= 0 &&
            Number.isFinite(result.time) &&
            result.time >= 0
        )) {
            return false;
        }

        const resultIds = save.levelResults.map(result => result.level);

        if (new Set(resultIds).size !== resultIds.length) {
            return false;
        }

        const calculatedScore = save.levelResults.reduce(
            (sum, result) => sum + result.score,
            0
        );

        if (calculatedScore !== save.totalScore) {
            return false;
        }

        if (
            save.levelStates !== undefined &&
            (!save.levelStates ||
                typeof save.levelStates !== "object" ||
                Array.isArray(save.levelStates))
        ) {
            return false;
        }

        this.reset();

        this.active = true;
        this.totalScore = save.totalScore;
        this.totalTime = save.totalTime;
        this.levelResults = save.levelResults.map(result => ({ ...result }));
        this.completedLevels = [...new Set(save.completedLevels)];
        this.currentLevel = save.currentLevel;
        this.lives = save.lives;

        this.levelStates = save.levelStates
            ? JSON.parse(JSON.stringify(save.levelStates))
            : {};

        // Tukee myös tallennuksen versiota 1.
        if (
            save.currentLevelState &&
            !this.levelStates[this.currentLevel]
        ) {
            this.levelStates[this.currentLevel] =
                JSON.parse(JSON.stringify(save.currentLevelState));
        }

        this.currentLevelState =
            this.levelStates[this.currentLevel] ?? null;

        this.startedAt = null;
        this.running = false;
        this.resumeTimer();

        // Palautetaan tallennetun tason ajastin.
        const timer = save.gameTimer;

        if (
            timer &&
            timer.currentLevel === this.getTimerLevelName(save.currentLevel) &&
            Number.isFinite(timer.elapsed) &&
            timer.elapsed >= 0
        ) {
            GameTimer.restoreLevel(
                timer.currentLevel,
                timer.elapsed,
                true
            );
        }
        return true;
    }

    static finish() {
        this.pauseTimer();

        const summary = this.getSummary();

        this.active = false;
        this.currentLevel = null;
        this.currentLevelState = null;

        return summary;
    }

    static reset() {
        console.trace("StoryModeManager.reset() kutsuttiin");
        this.active = false;
        this.active = false;
        this.totalScore = 0;
        this.totalTime = 0;
        this.running = false;
        this.levelResults = [];
        this.completedLevels = [];
        this.currentLevel = null;
        this.lives = 3;
        this.levelStates = {};
        this.currentLevelState = null;
    }
}
