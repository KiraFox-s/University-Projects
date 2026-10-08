const config = {
    type: Phaser.AUTO,

    width: 800,
    height: 600,

    backgroundColor: "#17251d",

    physics: {
        default: "arcade",

        arcade: {
            debug: false
        }
    },

    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// --------------------------------
// GLOBAL VARIABLES
let player;
let cursors;

let enemies;
let crystals;
let bullets;

let score = 0;
let scoreText;

let lastDirection = "right";

let canShoot = true;
let shootCooldown = 300;

// --------------------------------
// PRELOAD
function preload() {

    this.load.image(
        "fox-down",
        "assets/player/fox-down.png"
    );

    this.load.image(
        "fox-up",
        "assets/player/fox-up.png"
    );

    this.load.image(
        "fox-left",
        "assets/player/fox-left.png"
    );

    this.load.image(
        "fox-right",
        "assets/player/fox-right.png"
    );

    this.load.image(
    "shadow-flame",
    "assets/enemies/shadow-flame.png"
    );

    this.load.image(
    "flame",
    "assets/elements/flame.png"
    );

    this.load.image(
    "green-crystal",
    "assets/elements/green-crystal.png"
    );

    this.load.image(
    "blue-crystal",
    "assets/elements/blue-crystal.png"
    );    

    this.load.image(
    "violet-crystal",
    "assets/elements/violet-crystal.png"
    );

    this.load.image(
    "forest-background",
    "assets/elements/forest-background.png"
    );
};
// --------------------------------
// CREATE
function create() {

    // Forest background
    this.add.image(
        400,
        300,
        "forest-background"
    ).setDisplaySize(800, 600);

    // --------------------------------
    // Player 
    player = this.physics.add.sprite(
    400,
    300,
    "fox-down"
    );

    player.setDisplaySize(100, 100);
    player.body.setSize(200, 200);
    player.setCollideWorldBounds(true);

    // Keyboard controls
    cursors = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        shoot: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    // Enemies
    enemies = this.physics.add.group();
    createEnemy(this, 150, 150);
    createEnemy(this, 650, 200);
    createEnemy(this, 650, 450);

    // Crystals 
    crystals = this.physics.add.group();
    createCrystal(this, 200, 250);
    createCrystal(this, 600, 350);
    createCrystal(this, 400, 100);

    createBlueCrystal(this, 550, 120);
    createVioletCrystal(this, 300, 400);

    // Bullets 
    bullets = this.physics.add.group();

    // Score 
    scoreText = this.add.text(
        20,
        20,
        "Score: 0",
        {
            fontSize: "24px",
            color: "#ffffff"
        }
    );

    // Crystal collision
    this.physics.add.overlap(
        player,
        crystals,
        collectCrystal,
        null,
        this
    );

    // Bullet / enemy collision 
    this.physics.add.overlap(
        bullets,
        enemies,
        bulletHitEnemy,
        null,
        this
    );
}

// --------------------------------
// UPDATE
function update() {

    // Stop player movement
    player.body.setVelocity(0);

    // Player movement 
    if (cursors.left.isDown) {
        player.body.setVelocityX(-200);
        player.setTexture("fox-left");
        lastDirection = "left";
    }

    else if (cursors.right.isDown) {
        player.body.setVelocityX(200);
        player.setTexture("fox-right");
        lastDirection = "right";
    }

    if (cursors.up.isDown) {
        player.body.setVelocityY(-200);
        player.setTexture("fox-up");
        lastDirection = "up";
    }

    else if (cursors.down.isDown) {
        player.body.setVelocityY(200);
        player.setTexture("fox-down");
        lastDirection = "down";
    }

    // Shooting 
    if (
        Phaser.Input.Keyboard.JustDown(cursors.shoot) &&
        canShoot
    ) {
        shoot();
    }

    // Enemy movment 
    enemies.children.iterate(function(enemy) {
        if (!enemy) {
            return;
        }

        const angle = Phaser.Math.Angle.Between(
            enemy.x,
            enemy.y,
            player.x,
            player.y
        );

        enemy.body.setVelocity(
            Math.cos(angle) * 60,
            Math.sin(angle) * 60
        );
    });
}

// --------------------------------
// SHOOT SPIRIT BOLT
function shoot() {
    const scene = player.scene;

    // Create a new spirit bolt
    const bullet = scene.physics.add.sprite(
        player.x,
        player.y,
        "flame"
    );

    bullet.setDisplaySize(35, 35);

    // Add bullet to group
    bullets.add(bullet);

    // Bullet direction 
    if (lastDirection === "right") {
        bullet.body.setVelocityX(500);
        bullet.body.setVelocityY(0);
    }

    else if (lastDirection === "left") {
        bullet.body.setVelocityX(-500);
        bullet.body.setVelocityY(0);
    }

    else if (lastDirection === "up") {
        bullet.body.setVelocityX(0);
        bullet.body.setVelocityY(-500);
    }

    else if (lastDirection === "down") {
        bullet.body.setVelocityX(0);
        bullet.body.setVelocityY(500);
    }

    // Destroy bullet after 1 second
    scene.time.delayedCall(
        1000,
        function() {
            if (bullet.active) {
                bullet.destroy();
            }
        }
    );

    // Shooting cooldown 
    canShoot = false;
    scene.time.delayedCall(
        shootCooldown,
        function() {
            canShoot = true;
        }
    );
}

// --------------------------------
// CREATE ENEMY
function createEnemy(scene, x, y) {
    const enemy = scene.physics.add.sprite(
        x,
        y,
        "shadow-flame"
    );

    // Add physics
    enemy.setDisplaySize(70, 70);
    enemy.body.setSize(35, 35);

    // Add enemy to group
    enemies.add(enemy);
}

// --------------------------------
// CREATE CRYSTAL
function createCrystal(scene, x, y) {
    const crystal = scene.physics.add.sprite(
        x,
        y,
        "green-crystal"
    );

    crystal.setDisplaySize(35, 35);
    crystal.body.setSize(250, 250);
    crystals.add(crystal);

}

function createBlueCrystal(scene, x, y) {

    const crystal = scene.physics.add.sprite(
        x,
        y,
        "blue-crystal"
    );

    crystal.setDisplaySize(35, 35);
    crystal.body.setSize(250, 250);
    crystal.value = 25;
    crystals.add(crystal);
}

function createVioletCrystal(scene, x, y) {

    const crystal = scene.physics.add.sprite(
        x,
        y,
        "violet-crystal"
    );

    crystal.setDisplaySize(35, 35);
    crystal.body.setSize(250, 250);
    crystal.value = 50;
    crystals.add(crystal);
}

// --------------------------------
// COLLECT CRYSTAL
function collectCrystal(player, crystal) {

    // Remove crystal
    crystal.setVisible(false);
    crystal.body.enable = false;

    // Add points
    score += crystal.value || 10;

    // Update score
    scoreText.setText(
        "Score: " + score
    );
}

// --------------------------------
// BULLET HITS ENEMY
function bulletHitEnemy(bullet, enemy) {

    // Remove bullet
    bullet.destroy();

    // Remove enemy
    enemy.destroy();

    // Give player points
    score += 20;

    // Update score
    scoreText.setText(
        "Score: " + score
    );
}