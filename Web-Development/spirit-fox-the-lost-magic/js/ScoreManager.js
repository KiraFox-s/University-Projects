
export class ScoreManager {
    static storageKey = "spiritFoxScoreData";

    static defaultData = {
        playerName: "",
        storyResults: [],
        levelRecords: {},
        leaderboard: [],
        storyResult: null
    };

    static load() {
        const emptyData = () => ({
            ...this.defaultData,
            storyResults: [],
            levelRecords: {},
            leaderboard: []
        });

        try {
            const saved = localStorage.getItem(this.storageKey);

            if (!saved) {
                return emptyData();
            }

            const parsed = JSON.parse(saved);

            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                return emptyData();
            }

            const data = {
                ...this.defaultData,
                ...parsed,
                storyResults: Array.isArray(parsed.storyResults)
                    ? [...parsed.storyResults]
                    : [],
                levelRecords: parsed.levelRecords &&
                    typeof parsed.levelRecords === "object" &&
                    !Array.isArray(parsed.levelRecords)
                    ? { ...parsed.levelRecords }
                    : {},
                leaderboard: Array.isArray(parsed.leaderboard)
                    ? [...parsed.leaderboard]
                    : []
            };

            // Siirretään vanha yksittäinen tarinatulos listaan.
            if (data.storyResults.length === 0 && data.storyResult) {
                data.storyResults = [data.storyResult];
            }

            // Tarkistetaan ja järjestetään Story Moden tulostaulu.
            data.leaderboard = data.leaderboard
                .filter(item =>
                    item &&
                    typeof item === "object" &&
                    Number.isFinite(Number(item.totalScore)) &&
                    Number(item.totalScore) >= 0 &&
                    Number.isFinite(Number(item.totalTime)) &&
                    Number(item.totalTime) >= 0
                )
                .sort((a, b) => {
                    const scoreDifference =
                        Number(b.totalScore) - Number(a.totalScore);

                    if (scoreDifference !== 0) {
                        return scoreDifference;
                    }

                    return Number(a.totalTime) - Number(b.totalTime);
                })
                .slice(0, 10);

            // Normalisoidaan tasokohtaiset ennätykset Top 3 -muotoon.
            for (const [levelId, value] of Object.entries(data.levelRecords)) {
                const oldRecords = Array.isArray(value)
                    ? value
                    : value
                        ? [value]
                        : [];

                data.levelRecords[levelId] = oldRecords
                    .filter(record => {
                        const time = Number(record?.bestTime);
                        return Number.isFinite(time) && time > 0;
                    })
                    .map(record => ({
                        ...record,
                        level: record.level || levelId,
                        playerName: String(record.playerName || "Forest Fox"),
                        bestTime: Number(record.bestTime),
                        score: Math.max(0, Number(record.score) || 0)
                    }))
                    .sort((a, b) => a.bestTime - b.bestTime)
                    .slice(0, 3);
            }

            return data;
        } catch (error) {
            console.error("Could not load score data:", error);
            return emptyData();
        }
    }

    static data = ScoreManager.load();

    static save() {
        try {
            localStorage.setItem(
                this.storageKey,
                JSON.stringify(this.data)
            );

            return true;
        } catch (error) {
            console.error("Could not save score data:", error);
            return false;
        }
    }

    static getPlayerName() {
        return this.data.playerName || "";
    }

    static setPlayerName(name) {
        const cleanName = String(name || "").trim().slice(0, 24);

        if (!cleanName) {
            return false;
        }

        const previousName = this.data.playerName;
        this.data.playerName = cleanName;

        if (this.save()) {
            return true;
        }

        this.data.playerName = previousName;
        return false;
    }

    // Tallentaa Story Mode -tuloksen vasta pelaajan hyväksynnän jälkeen.
    static saveStoryResult(
        totalTime,
        totalScore,
        levelResults = [],
        playerName = ""
    ) {
        const name = String(
            playerName || this.getPlayerName()
        ).trim().slice(0, 24);

        const cleanTime = Number(totalTime);
        const cleanScore = Number(totalScore);

        if (
            !name ||
            !Number.isFinite(cleanTime) ||
            cleanTime < 0 ||
            !Number.isFinite(cleanScore) ||
            cleanScore < 0
        ) {
            return false;
        }

        const result = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            playerName: name,
            totalTime: cleanTime,
            totalScore: cleanScore,
            levelResults: Array.isArray(levelResults)
                ? levelResults.map(item => ({ ...item }))
                : [],
            completedAt: new Date().toISOString()
        };

        // Säilytetään alkuperäiset viitteet palautusta varten.
        const oldStoryResults = this.data.storyResults;
        const oldLeaderboard = this.data.leaderboard;
        const oldStoryResult = this.data.storyResult;
        const oldPlayerName = this.data.playerName;

        this.data.storyResults = [...oldStoryResults, result];
        this.data.storyResult = result;
        this.data.playerName = name;

        this.data.leaderboard = [
            ...oldLeaderboard.filter(item => item && typeof item === "object"),
            result
        ]
            .sort((a, b) => {
                const scoreDifference =
                    (Number(b.totalScore) || 0) -
                    (Number(a.totalScore) || 0);

                if (scoreDifference !== 0) {
                    return scoreDifference;
                }

                return (
                    (Number(a.totalTime) || 0) -
                    (Number(b.totalTime) || 0)
                );
            })
            .slice(0, 10);

        if (this.save()) {
            return true;
        }

        this.data.storyResults = oldStoryResults;
        this.data.leaderboard = oldLeaderboard;
        this.data.storyResult = oldStoryResult;
        this.data.playerName = oldPlayerName;

        return false;
    }

    // Uusimmat Story Mode -tulokset ensin.
    static getStoryResults() {
        return [...this.data.storyResults].reverse();
    }

    static getStoryResult() {
        return this.data.storyResult;
    }

    static getLevelRecord(levelId) {
        return this.getLevelTop3(levelId)[0] || null;
    }

    static getLevelTop3(levelId) {
        const records = this.data.levelRecords[levelId];

        if (!Array.isArray(records)) {
            return records ? [{ ...records }] : [];
        }

        return [...records]
            .sort((a, b) => Number(a.bestTime) - Number(b.bestTime))
            .slice(0, 3);
    }

    static getLevelRecords() {
        return Object.keys(this.data.levelRecords).map(levelId => ({
            level: levelId,
            records: this.getLevelTop3(levelId)
        }));
    }

    static qualifiesForLevelTop3(levelId, time) {
        const cleanTime = Number(time);

        if (!Number.isFinite(cleanTime) || cleanTime <= 0) {
            return false;
        }

        const records = this.getLevelTop3(levelId);

        return (
            records.length < 3 ||
            cleanTime < Number(records[records.length - 1].bestTime)
        );
    }

    // Kutsutaan vain pelaajan hyväksyttyä ennätyksen tallennuksen.
    static saveLevelResult(
        levelId,
        time,
        score = 0,
        playerName = ""
    ) {
        const cleanTime = Number(time);
        const cleanScore = Math.max(0, Number(score) || 0);
        const name = String(
            playerName || this.getPlayerName()
        ).trim().slice(0, 24);

        if (
            !levelId ||
            !Number.isFinite(cleanTime) ||
            cleanTime <= 0 ||
            !name
        ) {
            return false;
        }

        const previousRecords = this.getLevelTop3(levelId);

        // Estetään saman pelaajan saman ajan tallentaminen uudelleen.
        const duplicate = previousRecords.some(record =>
            record.playerName === name &&
            Number(record.bestTime) === cleanTime
        );

        if (duplicate) {
            return false;
        }

        const newRecord = {
            level: levelId,
            playerName: name,
            bestTime: cleanTime,
            score: cleanScore,
            completedAt: new Date().toISOString()
        };

        const updatedRecords = [...previousRecords, newRecord]
            .sort((a, b) => Number(a.bestTime) - Number(b.bestTime))
            .slice(0, 3);

        // Tallennetaan vain, jos uusi tulos pääsee Top 3 -listalle.
        if (!updatedRecords.some(record => record === newRecord)) {
            return false;
        }

        const hadOldRecords = Object.prototype.hasOwnProperty.call(
            this.data.levelRecords,
            levelId
        );
        const oldRecords = this.data.levelRecords[levelId];
        const oldPlayerName = this.data.playerName;

        this.data.levelRecords[levelId] = updatedRecords;
        this.data.playerName = name;

        if (this.save()) {
            return true;
        }

        if (hadOldRecords) {
            this.data.levelRecords[levelId] = oldRecords;
        } else {
            delete this.data.levelRecords[levelId];
        }

        this.data.playerName = oldPlayerName;

        return false;
    }

    static getLeaderboard() {
        return [...this.data.leaderboard];
    }

    static resetStoryResult() {
        const oldStoryResult = this.data.storyResult;
        this.data.storyResult = null;

        if (this.save()) {
            return true;
        }

        this.data.storyResult = oldStoryResult;
        return false;
    }
}
