/** 游戏打点 */
const GameDot = {
    /*****************************************************************************************/
    /*************************************** 打点 ****************************************/
    /*****************************************************************************************/
    /** 资源加载 */
    dot_resource_load_success: '100_Resource_load_success',// 游戏加载完成（参数：0）
    /** 新手 */
    dot_guide_adventure_01: '101_Guide_adventure_01',// 新手引导 1（参数：0）
    dot_guide_adventure_02: '102_Guide_adventure_02',// 新手引导 2（参数：0）
    dot_guide_adventure_03: '103_Guide_adventure_03',// 新手引导 3（参数：0）
    /** 视频相关（有奖励的，先检测视频；其他情况只检测插屏） */
    dot_ads_request_all: '118_Ads_direct_request',// 视频+插屏 请求（参数：0）
    dot_ads_request_video: '120_Ads_All_direct_request',// 视频 请求（参数：0）
    dot_ads_request_advert: '123_Ads_Interstitial_direct_request',// 插屏 请求（参数：0）
    dot_ads_advert_succe_back: 'Ads_beckground_Interstitial_succ',// 游戏恢复 只请求插屏插屏 （参数：0|1）
    dot_ads_advert_succe_win: 'Ads_Interstitial_nextlevel_Succeed', // 关卡结束，插屏播放成功后调用 （参数：0|1）
    dot_ads_advert_succe_rePlay: 'Ads_Interstitial_restart_Succeed',// 游戏重新开始时调用
    dot_ads_advert_succe_noVideo: 'Ads_Interstitial_videoNull_Succeed',// 插屏播放成功(无奖励视频)
    /** 广告相关 */
    dot_ad_revenue_track_flag_20: '227_Ad_revenue_track_flag', // 广告计数 20
    dot_ad_revenue_track_flag_30: '228_Ad_revenue_track_flag_30', // 广告计数 30
    dot_ad_revenue_track_flag_40: '229_Ad_revenue_track_flag_40', // 广告计数 40
    dot_ad_revenue_track_flag_50: '230_Ad_revenue_track_flag_50', // 广告计数 50
    dot_ad_revenue_track_flag_60: '231_Ad_revenue_track_flag_60', // 广告计数 60
    dot_ad_revenue_track_flag_70: '232_Ad_revenue_track_flag_70', // 广告计数 70
    dot_ad_revenue_track_flag_80: '233_Ad_revenue_track_flag_80', // 广告计数 80
    dot_ad_revenue_track_flag_90: '234_Ad_revenue_track_flag_90', // 广告计数 90
    dot_ad_revenue_track_flag_100: '235_Ad_revenue_track_flag_100', // 广告计数 100
    dot_applovin_cpe: 'applovin_cpe',// 过完35关、看广告次数达到50次打点，只记一次；
    dot_adDone: 'AdDone',// android端使用
    dot_adReq: 'AdReq',// 广告请求（参数：3）
    dot_OnApplicationResume: 'OnApplicationResume',//?
    /** 关卡开始 总点 */
    dot_levelStart: 'levelStart',
    /** 关卡通过 总点 */
    dot_levelPass: 'levelPass',
    /** 关卡通过 总点 */
    dot_longLevelPass: 'longLevelPass',
    /** 关卡通过 */
    dot_pass_level_1: '161_pass_level_1',
    dot_pass_level_2: '162_pass_level_2',
    dot_pass_level_3: '163_pass_level_3',
    dot_pass_level_4: '164_pass_level_4',
    dot_pass_level_5: '165_pass_level_5',
    dot_pass_level_6: '166_pass_level_6',
    dot_pass_level_7: '167_pass_level_7',
    dot_pass_level_8: '168_pass_level_8',
    dot_pass_level_9: '169_pass_level_9',
    dot_pass_level_10: '170_pass_level_10',
    dot_pass_level_30: '190_pass_level_30',
    dot_pass_level_50: '210_pass_level_50',
    dot_pass_level_70: '230_pass_level_70',
    dot_pass_level_100: '260_pass_level_100',
    dot_pass_level_all: '205_Stage_pass_all',
    /** 加载成功 总点 */
    dot_loadok_to_all: 'loadok_to_all',
    /** Match玩法 关卡开始 总点 */
    dot_JigLevelStart: 'JigLevelStart',
    dot_JigLevelPass: 'JigLevelPass',
    dot_JigReStart: 'JigReStart',
    dot_JigHelpSucc: 'JigHelpSucc',
    dot_JigReturn: 'JigReturn',
    dot_JigLevelOver: 'JigLevelOver',

    // 添加 返回道具成功（视频完成后）
    dot_addSortReturn_succe: 'Ads_addSortReturn_succ',
    // 添加 瓶子道具成功（视频完成后）
    dot_addTube_succ: 'Ads_addTube_succ',

    /** 购买返回道具 */
    dot_buy_back_click: 'buy_back_click',
    dot_buy_back_show: 'buy_back_show',
    dot_buy_back_succe: 'buy_back_succ',
    /** 购买瓶子道具 */
    dot_buy_bottle_click: 'buy_bottle_click',
    dot_buy_bottle_show: 'buy_bottle_show',
    dot_buy_bottle_succe: 'buy_bottle_succ',

    /** 云存储相关 */
    dot_loadGame: 'loadGame',
    dot_cloudCover: 'cloudCover',
    dot_cloudDataShow: 'cloudDataShow',
    dot_excludeLowEcpm: 'excludeLowEcpm',

    dot_noads_buySucc: 'noads_buySucc',
    dot_share_level_click: 'share_level_click',

    dot_sortPass: 'sortPass',
    dot_sortReStart: 'sortReStart',
    dot_sortStart: 'sortStart',

    dot_matchReStart: 'matchReStart',
    /*************************************** end **************************************************/
};
export default GameDot;
