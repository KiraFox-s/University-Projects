
export class MenuMusic {
    static music = null;

    /**
     * Käynnistää valikkomusiikin.
     * Jos musiikki soi jo, sitä ei käynnistetä uudelleen.
     */
    static play(scene) {
        // Käytetään olemassa olevaa musiikkia, jos se on jo luotu.
        if (!MenuMusic.music) {
            MenuMusic.music = scene.sound.add("main-menu-music", {
                loop: true,
                volume: 0.35
            });
        }

        // Käynnistetään musiikki vain, jos se ei jo soi.
        if (!MenuMusic.music.isPlaying) {
            MenuMusic.music.play();
        }
    }

    //Pysäyttää valikkomusiikin esimerkiksi pelitason alkaessa.
    static stop() {
        if (MenuMusic.music && MenuMusic.music.isPlaying) {
            MenuMusic.music.stop();
        }
    }

    
     //Säätää musiikin äänenvoimakkuutta tarvittaessa koodista.
    static setVolume(volume) {
        if (MenuMusic.music) {
            MenuMusic.music.setVolume(
                Math.max(0, Math.min(1, volume))
            );
        }
    }
}
