import { GAME_WIDTH, GAME_HEIGHT } from "./GameData.js";

export class FoxMoves {
    constructor(scene, x, y) {
        this.scene = scene;
        this.speed = 220;
        this.jumpForce = 480;
        this.facing = "right";
        this.isJumping = false;

        this.sprite = scene.physics.add.sprite(
            x,
            y,
            "fox-idle-right"
        );

        this.sprite.setScale(0.08);
        this.sprite.setDepth(10);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setBounce(0);

        const width = this.sprite.width;
        const height = this.sprite.height;

        this.sprite.body.setSize(
            width * 0.65,
            height * 0.75
        );

        this.sprite.body.setOffset(
            width * 0.175,
            height * 0.2
        );

        this.keys = scene.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        this.createAnimations();
        this.createTouchControls();
    }

    createAnimations() {
        const scene = this.scene;

        if (!scene.anims.exists("fox-run-right")) {
            scene.anims.create({
                key: "fox-run-right",
                frames: [
                    { key: "fox-run-right-1" },
                    { key: "fox-run-right-2" }
                ],
                frameRate: 8,
                repeat: -1
            });
        }

        if (!scene.anims.exists("fox-run-left")) {
            scene.anims.create({
                key: "fox-run-left",
                frames: [
                    { key: "fox-run-left-1" },
                    { key: "fox-run-left-2" }
                ],
                frameRate: 8,
                repeat: -1
            });
        }
    }

    createTouchControls() {
        const scene = this.scene;
    
        scene.input.addPointer(2);

        this.touchControls = {
            left: false,
            right: false,
            jump: false
        };

        const controlsEnabled =
        this.scene.registry.get("touchControlsEnabled") ??
        (
            this.scene.sys.game.device.input.touch ||
            (navigator.maxTouchPoints || 0) > 0
        );

        
        const createButton = (x, y, label, key) => {
            const button = scene.add.text(x, y, label, {
                fontFamily: "Arial",
                fontSize: "48px",
                fontStyle: "bold",
                color: "#ffffff",
                backgroundColor: "#397e91cc",
                padding: {
                    x: 24,
                    y: 18
                }
            })
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(2000)
                .setAlpha(0.85)
                .setInteractive();

            button.on("pointerdown", () => {
                this.touchControls[key] = true;

                if (key === "jump") {
                    this.jumpRequested = true;
                }

                button.setAlpha(1);
            });

            const release = () => {
                this.touchControls[key] = false;
                button.setAlpha(0.8);
            };

            button.on("pointerup", release);
            button.on("pointerout", release);

            return button;
        };

        if (controlsEnabled) {
            // Liikkuminen vasemmalla
            createButton(80, GAME_HEIGHT - 85, "◀", "left");
            createButton(175, GAME_HEIGHT - 85, "▶", "right");

            // Hyppy oikeassa alakulmassa
            const jumpButton = createButton(
                GAME_WIDTH - 100,
                GAME_HEIGHT - 95,
                "▲",
                "jump"
            );

            // Suurempi painike helpottaa hyppäämistä puhelimella.
            jumpButton
                .setStyle({
                    fontSize: "48px"
                })
                .setPadding(22, 16);
        }
    }

    update() {
        const fox = this.sprite;
        const body = fox.body;

        const left =
            this.keys.left.isDown ||
            this.keys.a.isDown ||
            this.touchControls.left;

        const right =
            this.keys.right.isDown ||
            this.keys.d.isDown ||
            this.touchControls.right;

        // Vaakasuuntainen liike
        if (left && !right) {
            this.facing = "left";
            fox.setVelocityX(-this.speed);
        } else if (right && !left) {
            this.facing = "right";
            fox.setVelocityX(this.speed);
        } else {
            fox.setVelocityX(0);
        }

        const onGround =
            body.blocked.down ||
            body.touching.down ||
            body.onFloor();

        const jumpPressed =
            Phaser.Input.Keyboard.JustDown(this.keys.space) ||
            this.jumpRequested;

        if (jumpPressed && onGround) {
            this.isJumping = true;
            fox.setVelocityY(-this.jumpForce);
        }

        this.jumpRequested = false;
        this.touchControls.jump = false;

        // Lopetetaan hyppytila vasta laskeutumisen jälkeen.
        if (
            this.isJumping &&
            onGround &&
            body.velocity.y >= 0
        ) {
            this.isJumping = false;
            this.jumpRequested = false;
        }

        // Hyppykuva
        if (this.isJumping) {
            fox.anims.stop();

            const jumpTexture = this.facing === "left"
                ? "fox-jump-left"
                : "fox-jump-right";

            if (fox.texture.key !== jumpTexture) {
                fox.setTexture(jumpTexture);
            }

            return;
        }

        // Juoksuanimaatio
        if (left !== right) {
            const runAnimation = this.facing === "left"
                ? "fox-run-left"
                : "fox-run-right";

            if (
                fox.anims.currentAnim?.key !== runAnimation ||
                !fox.anims.isPlaying
            ) {
                fox.anims.play(runAnimation);
            }

            return;
        }

        // Seisomiskuva
        fox.anims.stop();

        const idleTexture = this.facing === "left"
            ? "fox-idle-left"
            : "fox-idle-right";

        if (fox.texture.key !== idleTexture) {
            fox.setTexture(idleTexture);
        }
    }

    getSprite() {
        return this.sprite;
    }
}
