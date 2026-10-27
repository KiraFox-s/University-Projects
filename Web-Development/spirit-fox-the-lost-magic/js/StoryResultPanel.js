
import { ScoreManager } from "./ScoreManager.js";
import { formatTime } from "./TimeFormatter.js";

export class StoryResultsPanel {
    constructor(scene) {
        this.scene = scene;
        this.container = scene.add.container(0, 0);
    }

    show(x, y, width, height) {
        this.container.removeAll(true);

        const scene = this.scene;

        const title = scene.add.text(
            x,
            y,
            "STORY MODE RESULTS",
            {
                fontSize: "24px",
                color: "#ffffff",
                fontStyle: "bold"
            }
        ).setOrigin(0, 0).setScrollFactor(0);

        this.container.add(title);

        const results = ScoreManager.getStoryResults();

        if (!results || results.length === 0) {
            const emptyText = scene.add.text(
                x,
                y + 50,
                "No Story Mode results yet.",
                {
                    fontSize: "18px",
                    color: "#cccccc"
                }
            ).setOrigin(0, 0);

            this.container.add(emptyText);
            return;
        }

        const visibleResults = results.slice(0, 10);

        visibleResults.forEach((result, index) => {
            const rowY = y + 50 + index * 38;

            const playerName = result.playerName || "Forest Fox";
            const score = Number(result.totalScore ?? result.score ?? 0);
            const time = Number(result.totalTime ?? result.time ?? 0);

            const row = scene.add.text(
                x,
                rowY,
                `${index + 1}. ${playerName}   |   Score: ${score}   |   Time: ${formatTime(time)}`,
                {
                    fontSize: "16px",
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
