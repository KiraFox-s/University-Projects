import { GAME_WIDTH, GAME_HEIGHT } from "./GameData.js";

export class BossMechanics {
    constructor(scene) {
        this.scene = scene;
        this.busy = false;
        this.attackEvent = null;
        this.cancelled = false;
        this.nextAttack = 0;
    }

    isBlocked() {
        const s = this.scene;

        return (
            this.cancelled ||
            !s ||
            s.gameOver ||
            s.bossDefeated ||
            s.popupOpen ||
            !s.boss?.active ||
            !s.fox?.active
        );
    }

    start() {
        this.cancelled = false;
        this.scheduleNextAttack(1500);
    }

    scheduleNextAttack(delay = 1200) {
        if (this.isBlocked()) return;

        this.attackEvent?.remove();

        this.attackEvent = this.scene.time.delayedCall(delay, () => {
            if (this.isBlocked()) return;
            if (this.nextAttack === 0) {
                this.teleportAndShoot();
                this.nextAttack = 1;
            } else {
                this.crimsonRain();
                this.nextAttack = 0;
            }
        });
    }

    teleportAndShoot() {
        if (this.isBlocked() || this.busy) return;

        this.busy = true;
        const s = this.scene;
        const boss = s.boss;
        const originalScaleX = 0.22;
        const originalScaleY = 0.22;

        let round = 0;

        const shootRound = () => {
            if (this.isBlocked()) {
                this.busy = false;
                return;
            }

            // Neljä kierrosta, jokaisella kolme ammusta.
            const targetX = Phaser.Math.Clamp(
                s.fox.x + Phaser.Math.Between(-180, 180),
                100,
                GAME_WIDTH - 100
            );

            const targetY = Phaser.Math.Between(100, 230);

            boss.setAlpha(0);

            this.scene.time.delayedCall(220, () => {
                if (this.isBlocked()) {
                    this.busy = false;
                    return;
                }

                boss.setPosition(targetX, targetY);
                boss.setScale(originalScaleX, originalScaleY);
                boss.setAlpha(1);

                const angle = Math.atan2(
                    s.fox.y - boss.y,
                    s.fox.x - boss.x
                );

                const speed = 200;

                [-0.16, 0, 0.16].forEach(offset => {
                    s.fireEnemyBullet(
                        boss.x,
                        boss.y + 10,
                        Math.cos(angle + offset) * speed,
                        Math.sin(angle + offset) * speed,
                        8
                    );
                });

                round += 1;

                if (round < 4) {
                    this.scene.time.delayedCall(1000, shootRound);
                } else {
                    this.busy = false;
                    this.scheduleNextAttack(3000);
                }
            });
        };
        shootRound();
    }

    crimsonRain() {
        if (this.isBlocked() || this.busy) return;

        this.busy = true;
        this.scene.sound.play("eagle-sound");
        const s = this.scene;
        const boss = s.boss;

        // Teleporttaa oikealle reunalle muuttamatta kokoa.
        boss.setAlpha(0);

        this.scene.time.delayedCall(220, () => {
            if (this.isBlocked()) {
                this.busy = false;
                return;
            }

            boss.setPosition(
                GAME_WIDTH - 120,
                GAME_HEIGHT * 0.28
            );

            boss.setScale(0.22);
            boss.setAlpha(1);

            // Pysäytä lentävä animaatio yhteen kuvaan.
            boss.anims.stop();
            boss.setTexture("shadow-eagle-1");

            // Ammuksia putoaa satunnaisista x-sijainneista.
            let drops = 0;
            const maxDrops = 16;

            const dropEvent = this.scene.time.addEvent({
                delay: 400,
                repeat: maxDrops - 1,
                callback: () => {
                    if (this.isBlocked()) {
                        dropEvent.remove();
                        boss.play("shadow-eagle-fly");
                        boss.setScale(0.22);
                        this.busy = false;
                        return;
                    }

                    const x = Phaser.Math.Between(25, GAME_WIDTH - 25);
                    const speedY = Phaser.Math.Between(220, 310);
                    const speedX = Phaser.Math.Between(-25, 25);            
                    const bullet = s.fireEnemyBullet(
                        x,
                        -15,
                        speedX,
                        speedY,
                        9
                    );
                    if (!bullet) {
                        console.warn("Crimson Rain: ammuksen luonti epäonnistui.");
                    }

                    drops += 1;

                    if (drops >= maxDrops) {
                        this.scene.time.delayedCall(500, () => {
                            if (boss?.active && !this.isBlocked()) {
                                boss.play("shadow-eagle-fly");
                                boss.setScale(0.22);
                            }
                            this.busy = false;
                            this.scheduleNextAttack(2500);
                        });
                    }
                }
            });
        });
    }

    resume() {
        if (
            this.cancelled ||
            this.scene.gameOver ||
            this.scene.bossDefeated
        ) {
            return;
        }

        this.busy = false;

        const boss = this.scene.boss;

        if (boss?.active) {
            boss.setAlpha(1);
            boss.setScale(0.22);

            if (!boss.anims.isPlaying) {
                boss.play("shadow-eagle-fly");
            }
        }

        this.scheduleNextAttack(700);
    }

    stop() {
        this.cancelled = true;
        this.attackEvent?.remove();
        this.scene?.tweens?.killTweensOf(this.scene.boss);

        this.busy = false;
    }
}

