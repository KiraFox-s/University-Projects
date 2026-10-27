
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "./GameData.js";

import { MenuScene } from "./MenuScene.js";
import { ControlsScene } from "./ControlsScene.js";
import { IntroScene } from "./IntroScene.js";
import { LevelSelectScene } from "./LevelSelectScene.js";
import { LoadScene } from "./LoadScene.js";

import { Level1Scene } from "./Level1Scene.js";
import { Level2Scene } from "./Level2Scene.js";
import { Level3Scene } from "./Level3Scene.js";
import { BossLevelScene } from "./BossLevelScene.js";

import { ResultsScene } from "./ResultsScene.js";
import { EndingScene } from "./EndingScene.js";

const config = {
    type: Phaser.AUTO,
    parent: "game",

    width: GAME_WIDTH,
    height: GAME_HEIGHT,

    backgroundColor: COLORS.background,

    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT
    },

    scene: [
        MenuScene,
        ControlsScene,
        IntroScene,
        LevelSelectScene,
        LoadScene,

        Level1Scene,
        Level2Scene,
        Level3Scene,
        BossLevelScene,

        ResultsScene,
        EndingScene
    ]
};

new Phaser.Game(config);
