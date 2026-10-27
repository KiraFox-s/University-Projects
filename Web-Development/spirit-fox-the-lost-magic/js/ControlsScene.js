
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "./GameData.js";

export class ControlsScene extends Phaser.Scene {
    constructor() {
        super("ControlsScene");
    }

    preload() {
        this.load.image(
            "controls-background",
            "assets/images/backgrounds/controls.webp"
        );
    }

    create() {
        // Taustakuva
        this.add.image(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            "controls-background"
        ).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

        // Tumma kerros tekstien luettavuuden parantamiseksi
        this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x05091c,
            0.25
        ).setDepth(1);

        // Otsikko
        this.add.text(
            GAME_WIDTH / 2,
            85,
            "CONTROLS",
            {
                fontFamily: "Georgia, serif",
                fontSize: "48px",
                color: COLORS.lightBlue,
                stroke: "#07133d",
                strokeThickness: 5
            }
        )
            .setOrigin(0.5)
            .setDepth(3);

        // Ohjeiden sisältö
        const instructions = [
            "A / ←       Move left",
            "D / →       Move right",
            "SPACE       Jump",
            "Mouse / ✦ Button      Shoot magic",
            "(Shooting available from Level 3)"
        ];

        // Läpinäkyvä paneeli ohjeiden taakse
        this.add.rectangle(
            GAME_WIDTH / 2,
            330,
            650,
            350,
            0x07152e,
            0.82
        )
            .setStrokeStyle(2, 0x32cfff, 0.8)
            .setDepth(2);

        // Ohjetekstit
        this.add.text(
            GAME_WIDTH / 2,
            330,
            instructions.join("\n\n"),
            {
                fontFamily: "Arial",
                fontSize: "25px",
                color: "#ffffff",
                align: "center",
                lineSpacing: 6
            }
        )
            .setOrigin(0.5)
            .setDepth(3);

        // Takaisin päävalikkoon
        const back = this.add.text(
            GAME_WIDTH / 2,
            600,
            "BACK TO MENU",
            {
                fontFamily: "Georgia, serif",
                fontSize: "23px",
                color: "#ffffff",
                backgroundColor: "#102a57",
                padding: {
                    x: 25,
                    y: 12
                }
            }
        )
            .setOrigin(0.5)
            .setDepth(4)
            .setInteractive({ useHandCursor: true });

        back.on("pointerover", () => {
            back.setColor("#65f5ff");
            back.setScale(1.05);
        });

        back.on("pointerout", () => {
            back.setColor("#ffffff");
            back.setScale(1);
        });

        back.on("pointerdown", () => {
            this.scene.start("MenuScene");
        });

        // ESC palauttaa päävalikkoon
        if (this.input.keyboard) {
            this.input.keyboard.once("keydown-ESC", () => {
                this.scene.start("MenuScene");
            });
        }
    }
}
