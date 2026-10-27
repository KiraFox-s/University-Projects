
import { StoryModeManager } from "./StoryModeManager.js";

export class GameTechnic {
    // Yhteiset elämät säilyvät kentästä toiseen.
    static lives = 3;

    constructor(scene, fox, greenCrystals, redCrystals) {
        console.log("GameTechnic alustetaan:", scene.scene.key);
        console.trace("GameTechnic kutsupolku");

        this.scene = scene;
        this.fox = fox;
        this.invulnerable = false;
        this.gameOver = false;

        const savedState = StoryModeManager.getLevelState(
            scene.scene.key
        );

        this.score = Number.isFinite(savedState?.score)
            ? savedState.score
            : 0;

        this.collectedCrystals = Array.isArray(
            savedState?.collectedCrystals
        )
            ? [...savedState.collectedCrystals]
            : [];

        console.log(
            "Level3Scene tallennustila:",
            JSON.stringify(savedState)
        );

        // Poistetaan jo aiemmin kerätyt vihreät kristallit.
        greenCrystals.getChildren().forEach(crystal => {
            if (this.collectedCrystals.includes(crystal.name)) {
                greenCrystals.remove(crystal, true, true);
            }
        });

        // Poistetaan jo aiemmin kerätyt punaiset kristallit.
        redCrystals.getChildren().forEach(crystal => {
            if (this.collectedCrystals.includes(crystal.name)) {
                redCrystals.remove(crystal, true, true);
            }
        });


        console.log(
            "Tallennetut kristallit:",
            this.collectedCrystals
        );

        console.log(
            "Jäljellä olevat vihreät:",
            greenCrystals.getChildren().map(crystal => crystal.name)
        );

        console.log(
            "Jäljellä olevat punaiset:",
            redCrystals.getChildren().map(crystal => crystal.name)
        );


        // Pistelaskuri.
        this.scoreText = scene.add.text(
            30,
            85,
            `Score: ${this.score}`,
            {
                fontFamily: "Georgia, serif",
                fontSize: "22px",
                color: "#ffffff",
                stroke: "#080d25",
                strokeThickness: 4
            }
        );

        this.scoreText.setScrollFactor(0);
        this.scoreText.setDepth(100);

        // Elämälaskuri.
        this.livesText = scene.add.text(
            30,
            115,
            "",
            {
                fontFamily: "Georgia, serif",
                fontSize: "22px",
                color: "#ff4444",
                stroke: "#080d25",
                strokeThickness: 4
            }
        );

        this.livesText.setScrollFactor(0);
        this.livesText.setDepth(100);
        this.updateLivesText();

        // Vihreät kristallit: +10 pistettä.
        scene.physics.add.overlap(
            fox,
            greenCrystals,
            (player, crystal) => {
                this.collectCrystal(crystal, 10);
            }
        );

        // Punaiset kristallit: +15 pistettä.
        scene.physics.add.overlap(
            fox,
            redCrystals,
            (player, crystal) => {
                this.collectCrystal(crystal, 15);
            }
        );

        // Kristallien leijumisanimaatiot.
        this.animateCrystals(greenCrystals);
        this.animateCrystals(redCrystals);
    }

    // Päivittää näkyvän elämälaskurin.
    updateLivesText() {
        const lives = Math.max(
            0,
            Math.floor(Number(GameTechnic.lives) || 0)
        );

        this.livesText.setText("❤️".repeat(lives));
    }

    static createLivesDisplay(scene, x = 30, y = 115) {
        const livesText = scene.add.text(
            x,
            y,
            "",
            {
                fontFamily: "Georgia, serif",
                fontSize: "22px",
                color: "#ff4444",
                stroke: "#080d25",
                strokeThickness: 4
            }
        );

        livesText.setScrollFactor(0);
        livesText.setDepth(1000);

        const update = () => {
            const lives = Math.max(
                0,
                Math.floor(Number(GameTechnic.lives) || 0)
            );

            livesText.setText("❤️".repeat(lives));
        };

        update();

        return { livesText, update };
    }

    // Kutsutaan, kun pelaaja osuu viholliseen tai piikkeihin.
    loseLife() {
        if (
            this.invulnerable ||
            this.gameOver ||
            GameTechnic.lives <= 0
        ) {
            return;
        }

        this.invulnerable = true;

        GameTechnic.lives = Math.max(
            0,
            Math.floor(Number(GameTechnic.lives) || 0) - 1
        );

        StoryModeManager.setLives(GameTechnic.lives);
        this.updateLivesText();

        // Pelaaja välähtää osuman jälkeen.
        this.fox.setTint(0xff5555);

        this.scene.time.delayedCall(1000, () => {
            if (this.fox.active) {
                this.fox.clearTint();
            }

            this.invulnerable = false;
        });

        // Kaikki elämät menetetty.
        if (GameTechnic.lives === 0) {
            this.gameOver = true;
            this.fox.setVelocity(0, 0);

            if (typeof this.scene.showGameOver === "function") {
                this.scene.showGameOver("YOU DIED");
            } else {
                this.scene.physics.pause();

                this.scene.add.text(
                    640,
                    360,
                    "YOU DIED",
                    {
                        fontFamily: "Georgia, serif",
                        fontSize: "56px",
                        color: "#ff3333",
                        stroke: "#080d25",
                        strokeThickness: 6
                    }
                )
                    .setOrigin(0.5)
                    .setScrollFactor(0)
                    .setDepth(200);
            }
        }
    }

    // Kristallit leijuvat hitaasti ylös ja alas.
    animateCrystals(crystalGroup) {
        crystalGroup.getChildren().forEach((crystal, index) => {
            this.scene.tweens.add({
                targets: crystal,
                y: crystal.y - 8,
                duration: 900 + index * 100,
                ease: "Sine.easeInOut",
                yoyo: true,
                repeat: -1
            });
        });
    }

    // Tallennetaan tämän tason pisteet ja kerätyt kristallit.
    saveCollectionState() {
        const previousState = StoryModeManager.getLevelState(
            this.scene.scene.key
        ) ?? {};

        return StoryModeManager.saveLevelState(
            this.scene.scene.key,
            {
                ...previousState,
                score: this.score,
                collectedCrystals: [...this.collectedCrystals]
            }
        );
    }

    // Kristallin kerääminen ja pisteiden lisääminen.
    collectCrystal(crystal, points) {
        if (!crystal || !crystal.active || this.gameOver) {
            return;
        }

        if (
            crystal.name &&
            !this.collectedCrystals.includes(crystal.name)
        ) {
            this.collectedCrystals.push(crystal.name);
        }

        // Soitetaan ääni, kun kristalli kerätään.
        this.scene.sound.play("collect-sound");


        crystal.destroy();

        const earnedPoints = Math.max(
            0,
            Number(points) || 0
        );

        this.score += earnedPoints;
        this.scoreText.setText(`Score: ${this.score}`);

        // Päivitetään tason tila muistissa.
        this.saveCollectionState();
    }
}
