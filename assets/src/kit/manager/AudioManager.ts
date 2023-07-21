import ResLoader from "../framework/load/ResLoader";

/**
 * 音频播放类
 */
export default class AudioManager {

    private static _music: Map<string, number> = new Map();

    private static _effect: Map<string, number> = new Map();

    /**  */
    public static get config() { return this._config; }
    /** 默认配置 */
    private static _config: ConfigAudio = { isPlayMusic: true, isPlayEffect: true, volumeMusic: 1.0, volumeEffect: 1.0, };

    /** 初始化音乐 */
    public static initAudio() {
        let config: ConfigAudio = JSON.parse(cc.sys.localStorage.getItem("cfgAudio"));
        if (config) {
            this._config = config;
        }
        else {
            cc.sys.localStorage.setItem("cfgAudio", JSON.stringify(this._config));
        }
    }

    /**
     * 设置 音频
     * @param isSound 
     */
    public static setIsSound(isSound: boolean){
        this._config.isPlayMusic = isSound;
        if (!this._config.isPlayMusic) {
            this.stopAllMusic();
        }
        this._config.isPlayEffect = isSound;
        if (!this._config.isPlayEffect) {
            this.stopAllEffect();
        }
        cc.sys.localStorage.setItem("cfgAudio", JSON.stringify(this._config));
    }

    /**
     * 设置 音乐
     * @param isPlay 
     */
    public static setIsPlayMusic(isPlay: boolean) {
        this._config.isPlayMusic = isPlay;
        if (!this._config.isPlayMusic) {
            this.stopAllMusic();
        }
        cc.sys.localStorage.setItem("cfgAudio", JSON.stringify(this._config));
    }

    /**
     * 设置 音乐
     * @param isPlay 
     */
    public static setIsPLayEffect(isPlay: boolean) {
        this._config.isPlayEffect = isPlay;
        if (!this._config.isPlayEffect) {
            this.stopAllEffect();
        }
        cc.sys.localStorage.setItem("cfgAudio", JSON.stringify(this._config));
    }

    /**
     * 设置音量（音乐与特效）
     * @param value 音量值（0.0 ~ 1.0）
     */
    public static setVolume(value: number): void {
        this.setVolumeMusic(value);
        this.setVolumeEffect(value);
    }

    /**
     * 设置音乐音量
     * @param value 音量值（0.0 ~ 1.0）
     */
    public static setVolumeMusic(value: number): void {
        if (value < 0.0) value = 0.0;
        else if (value > 1.0) value = 1.0;

        this._config.volumeMusic = value;
        this._music.forEach((value, key) => cc.audioEngine.setVolume(value, this._config.volumeMusic));
        cc.sys.localStorage.setItem("cfgAudio", JSON.stringify(this._config));
    }

    /**
     * 设置特效音量
     * @param value 音量值（0.0 ~ 1.0）
     */
    public static setVolumeEffect(value: number): void {
        if (value < 0.0) value = 0.0;
        else if (value > 1.0) value = 1.0;

        this._config.volumeEffect = value;
        this._effect.forEach((value, key) => cc.audioEngine.setVolume(value, this._config.volumeEffect));
        cc.sys.localStorage.setItem("cfgAudio", JSON.stringify(this._config));
    }

    /********************************************************************************************************************** */
    /*******************************************************  音乐相关  **************************************************** */
    /********************************************************************************************************************** */
    /**
     * 播放音乐
     * @param path 音频地址
     */
    public static playMusic(path: string): void {
        if (!this._config.isPlayMusic) {
            return;
        }
        // 停止旧的
        if (this._music.has(path)) this.stopMusic(path);
        // 开始新的
        ResLoader.loadRes(path, cc.AudioClip, (e, clip) => {
            if (e) {
                return;
            }
            let id = cc.audioEngine.play(clip, true, this._config.volumeMusic);
            this._music.set(path, id);
        });
    }

    /**
     * 停止音乐
     * @param path 音频地址
     */
    public static stopMusic(path: string): void {
        let id = this._music.get(path);
        if (id) {
            cc.audioEngine.stop(id);
            this._music.delete(path);
        }
    }

    /**
     * 停止所有音乐
     */
    public static stopAllMusic(): void {
        this._music.forEach((id, path) => {
            cc.audioEngine.stop(id);
            this._music.delete(path);
        });
    }

    /**
     * 暂停音乐
     * @param clip 音频
     */
    public static pauseMusic(path): void {
        let id = this._music.get(path);
        if (id) {
            cc.audioEngine.pause(id);
        }
    }

    /**
     * 暂停所有音乐
     */
    public static pauseAllMusic(): void {
        this._music.forEach((id, path) => {
            cc.audioEngine.pause(id);
        });
    }

    /**
     * 恢复音乐
     * @param path 音频地址
     */
    public static resumeMusic(path: string): void {
        let id = this._music.get(path);
        if (id) {
            cc.audioEngine.resume(id);
        }
    }

    /**
     * 恢复所有音乐
     */
    public static resumeAllMusic(): void {
        this._music.forEach((id, path) => {
            cc.audioEngine.resume(id);
        });
    }

    /********************************************************************************************************************** */
    /*******************************************************  音效相关  **************************************************** */
    /********************************************************************************************************************** */
    /**
     * 播放特效音频
     * @param path 音频地址
     * @param loop 循环
     */
    public static playEffect(path: string, loop: boolean = false): void {
        if (!this._config.isPlayEffect) {
            return;
        }
        ResLoader.loadRes(path, cc.AudioClip, (e, clip) => {
            if (e) {
                return;
            }
            let id = cc.audioEngine.play(clip, loop, this._config.volumeEffect);
            this._effect.set(path, id);
            if (!loop) cc.audioEngine.setFinishCallback(id, () => this._effect.delete(path));
        });
    }

    /**
     * 停止特效音频
     * @param path 音频地址
     */
    public static stopEffect(path: string): void {
        let id = this._effect.get(path);
        if (id) {
            cc.audioEngine.stop(id);
            this._effect.delete(path);
        }
    }

    /**
     * 停止所有特效音频
     */
    public static stopAllEffect(): void {
        this._effect.forEach((id, path) => {
            cc.audioEngine.stop(id);
            this._effect.delete(path);
        });
    }

    /**
     * 暂停特效音频
     * @param path 音频地址
     */
    public static pauseEffect(path: string): void {
        let id = this._effect.get(path);
        if (id) {
            cc.audioEngine.pause(id)
        }
    }

    /**
     * 暂停所有特效音频
     */
    public static pauseAllEffect(): void {
        this._effect.forEach((id, path) => {
            cc.audioEngine.pause(id)
        });
    }

    /**
     * 恢复特效音频
     * @param path 音频地址
     */
    public static resumeEffect(path: string): void {
        let id = this._effect.get(path);
        if (id) {
            cc.audioEngine.resume(id);
        }
    }

    /**
     * 恢复所有特效音频
     */
    public static resumeAllEffect(): void {
        this._effect.forEach((id, path) => {
            cc.audioEngine.resume(id);
        });
    }

    /**
     * 停止所有音频
     */
    public static stopAll(): void {
        this.stopAllMusic();
        this.stopAllEffect();
    }

    /**
     * 暂停所有音频
     */
    public static pauseAll(): void {
        this.pauseAllMusic();
        this.pauseAllEffect();
    }

    /**
     * 恢复所有音频
     */
    public static resumeAll(): void {
        this.resumeAllMusic();
        this.resumeAllEffect();
    }
}

/** 声音配置 */
interface ConfigAudio {
    /** 是否开启 音乐 */
    isPlayMusic: boolean;
    /** 是否开启 音效 */
    isPlayEffect: boolean;
    /** 音量（音乐） */
    volumeMusic: number;
    /** 音量（音效） */
    volumeEffect: number;
}
