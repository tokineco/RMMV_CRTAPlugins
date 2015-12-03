//=============================================================================
// CRTA_ScreenPicture.js
//=============================================================================
 
/*:
 * @plugindesc v1.1.0 ピクチャを使用したスクリーンコマンドプラグイン
 * @author tokineco@cretia studio
 *
 * @param Screen Picture ID
 * @desc スクリーンに使用するピクチャID。このピクチャ番号は他で使用しないでください。
 * Default: 90
 * @default 90
 * 
 * @param Fade Picture ID
 * @desc フェードに使用するピクチャID。このピクチャ番号は他で使用しないでください。
 * Default: 91
 * @default 91
 *
 * @help  
 * 概要:
 * ピクチャを使用したスクリーン制御コマンド(主にフェード用)を追加します。
 * モバイル向けのスクリーンの色調変更に問題があるため、こちらを使用します。
 * 色指定により内部でスクリーンピクチャを生成することもできますし、用意した独自ピクチャを使用することもできます。
 * 
 * このプラグインのスクリーン(screen)とは、夜だったりセピア調といった色調変更演出のためのスクリーンのことで、
 * フェード(fade)とは画面切り替え時などで黒や白で画面を隠すための演出用スクリーンのことを示します。
 * 両方同時に使用できるように分けています。
 * 
 * エディタのイベントコマンドのみでもできますが、簡潔かつスクリーン画像やフェード時間のパラメータ化のためにプラグインにしています。
 * 
 * 詳細な使用方法は下記をご覧ください。
 * http://studio.cretia.net/blog/634
 * 
 * プラグインコマンド:
 *   CRTA_ScreenPicture set fade 0 0 0 0                 # 指定色でフェードスクリーンを作成する(引数1:screen or fade, 引数2:赤[0～255], 引数3:緑[0～255] 引数4:青[0～255] 引数5:透明度[0～255])
 *   CRTA_ScreenPicture set fade ScreenPoisonMist 168    # 指定ピクチャでフェードスクリーンを作成する(引数1:screen or fade, 引数2:ピクチャファイル名, 引数3:透明度[0～255])
 *   CRTA_ScreenPicture fade fade 255 60                 # フェードスクリーンを60frame使って指定透明度までフェードする(引数1:screen or fade, 引数2:透明度[0～255, 引数3:フレーム数[変数指定可能$gameVariables.value(1)等])
 *   CRTA_ScreenPicture erase fade                       # フェードスクリーンを消去する(引数1:screen or fade)
 * 
 * ライセンス:
 * このプラグインは以下のライセンスのもと、使用することができます。 
 *   Copyright (c) 2015 tokineco
 *   Released under the MIT license
 *   https://github.com/tokineco/RMMV_CRTAPlugins/blob/master/LICENSE
 */
 
(function() {
 
    var parameters = PluginManager.parameters('CRTA_ScreenPicture');
    var screenPicId = Number(parameters['Screen Picture ID'] || 90);
    var fadePicId = Number(parameters['Fade Picture ID'] || 91);

    var KEY_NAME = 'CRTA_ScreenPicture_';

    // プラグインコマンド
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'CRTA_ScreenPicture') {
            
            var picId = fadePicId;
            if (String(args[1]) === 'screen') {
                picId = screenPicId;
            }

            switch (String(args[0])) {
            case 'set':
                if (args.length <= 4) {
                    // ピクチャ指定の場合
                    $gameScreen.showPicture(picId, String(args[2]), 0, 0, 0,
                    100, 100, Number(args[3]), 0);
                } else if (args.length >= 6) {
                    // カラー指定の場合
                    $gameScreen.showPicture(picId, KEY_NAME + String(args[1]), 0, 0, 0,
                    100, 100, Number(args[5]), 0);
                    $gameScreen.picture(picId)._CRTAScreenPictureType = String(args[1]);
                    $gameScreen.picture(picId)._CRTAScreenPictureColor = [Number(args[2]), Number(args[3]), Number(args[4])];
                }
                break;
            case 'fade':
                $gameScreen.movePicture(picId, 0, 0, 0, 100,
                    100, Number(args[2]), 0, eval(args[3]));
                break;
            case 'erase':
                $gameScreen.erasePicture(picId);
                break;
            }
        }
    };

    // override
    var _Game_Picture_initBasic = Game_Picture.prototype.initBasic;
    Game_Picture.prototype.initBasic = function() {
        _Game_Picture_initBasic.call(this);

        // 変数拡張
        this._CRTAScreenPictureType = '';
        this._CRTAScreenPictureColor = null;
    };
    
    // override
    var _Sprite_Picture_loadBitmap = Sprite_Picture.prototype.loadBitmap;
    Sprite_Picture.prototype.loadBitmap = function() {

        // 拡張変数がセットされていればピクチャを生成する
        var type = this.picture()._CRTAScreenPictureType;
        if (type != undefined && type != null && type != '') {
            this.bitmap = ImageManager.createScreenPicture(this._pictureName, this.picture()._CRTAScreenPictureColor);
        } else {
            this.bitmap = ImageManager.loadPicture(this._pictureName);
        }
    };

    // ImageManager拡張
    ImageManager.createScreenPicture = function(path, hue) {
        var key = path + ':' + hue;
        if (!this._cache[key]) {
            // スクリーンを作成する
            var bitmap = new Bitmap(Graphics.width, Graphics.height);
            bitmap.fillAll('black');
            bitmap.adjustTone(hue[0], hue[1], hue[2]);
            bitmap.addLoadListener(function() {
                bitmap.rotateHue(hue);
            });
            this._cache[key] = bitmap;
        }
        return this._cache[key];
    };
 
})();