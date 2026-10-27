
import { ScoreManager } from "./ScoreManager.js";
import { formatTime } from "./TimeFormatter.js";

export class LevelRecordsPanel {
    constructor(scene) {
        this.scene = scene;
        this.container = scene.add.container(0, 0);
    }

    show(x, y, levelId) {
        this.container.removeAll(true);

        const scene = this.scene;

        const title = scene.add.text(
            x,
            y,
            `${levelId} — TOP 3`,
            {
                fontSize: "24px",
                color: "#ffffff",
                fontStyle: "bold"
            }
        ).setOrigin(0, 0);

        this.container.add(title);

        const records = ScoreManager.getLevelTop3(levelId);

        if (!records || records.length === 0) {
            const emptyText = scene.add.text(
                x,
                y + 50,
                "No records yet.",
                {
                    fontSize: "18px",
                    color: "#cccccc"
                }
            ).setOrigin(0, 0);

            this.container.add(emptyText);
            return;
        }

        records.slice(0, 3).forEach((record, index) => {
            const playerName = record.playerName || "Forest Fox";
            const time = Number(record.bestTime ?? record.time ?? 0);

            const row = scene.add.text(
                x,
                y + 50 + index * 40,
                `${index + 1}. ${playerName}   —   ${formatTime(time)}`,
                {
                    fontSize: "18px",
                    color: "#ffffff"
                }
            ).setOrigin(0, 0);

            this.container.add(row);
        });
    }

    destroy() {
        this.container.destroy();
    }
}
