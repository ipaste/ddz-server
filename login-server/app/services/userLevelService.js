/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var User = require('../domain/user');
var DataKeyId = require('../domain/dataKeyId');
var DdzProfile = require('../domain/ddzProfile');
var DdzUserLevelConfigs = require('../domain/ddzUserLevelConfigs');

var UserSession = require('../domain/userSession');
var ErrorCode = require('../consts/errorCode');
var utils = require('../util/utils');
var crypto = require('crypto');
var messageService = require('./messageService');
var taskService = require('./taskService');
var userService = require('./userService');

var Q = require('q');

var pomeloApp = null;
var UserLevelService = module.exports;

var levelConfigCache = {levels:[]};

var _genPasswordDigest = function (password, salt) {
    return crypto.createHash('md5').update(password + "_" + salt).digest('hex');
};

UserLevelService.init = function(app, opts) {
    pomeloApp = app;
    DdzUserLevelConfigs.findQ({})
        .then(function(levels){
            levelConfigCache.levels = levels;
            logger.info('UserLevelService.init, levels.length=', levelConfigCache.levels.length);
        })
        .fail(function(error){
            logger.error('UserLevelService.init failed.', error);
        });
};

var genError = function(errCode) {
    var error = new Error();
    error.errCode = errCode;
    return error;
};

UserLevelService.reloadLevelConfig = function(cb){
    logger.info('UserLevelService.reloadLevelConfig');
    DdzUserLevelConfigs.findQ({})
        .then(function(levels){
            levelConfigCache.levels = levels;
            logger.info('UserLevelService.reloadLevelConfig, levels.length=', levelConfigCache.levels.length);
        })
        .fail(function(error){
            logger.error('UserLevelService.reloadLevelConfig failed.', error);
        });
    utils.invokeCallback(cb, null, null);
};

UserLevelService.onUserCoinsChanged = function(userId, coinsUp, callback) {
    logger.info('UserLevelService.onUserCoinsChanged, userId=',userId);
    logger.info('UserLevelService.onUserCoinsChanged, levelConfigMap.length=',levelConfigCache.levels.length);
    if (levelConfigCache.levels.length == 0) {
        utils.invokeCallback(callback, null, false);
        return;
    }
    logger.info('UserLevelService.onUserCoinsChanged, begin');
    var result = {levelChanged: false};
    User.findOne({userId: userId})
        .populate('ddzProfile')
        .execQ()
        .then(function(user){
            result.user = user;
            logger.info('UserLevelService.onUserCoinsChanged, result.user.userId=',user.userId);
            logger.info('UserLevelService.onUserCoinsChanged, user.ddzProfile.levelName=',user.ddzProfile.levelName);
            for(var i=0;i<levelConfigCache.levels.length;i++){
                var u_level = levelConfigCache.levels[i];
                //logger.info('UserService.getUserLevelName, u_level=',u_level);
                var user_coins = user.ddzProfile.coins;
                if (user_coins >= u_level.min_coins && (user_coins < u_level.max_coins || u_level.max_coins == 0)) {
                    logger.info('UserLevelService.onUserCoinsChanged, level_name=',u_level.level_name);
                    if (user.ddzProfile.levelName != u_level.level_name) {
                        result.levelChanged = true;
                        user.ddzProfile.levelName = u_level.level_name;
                    }
                }
            }
            logger.info('UserLevelService.onUserCoinsChanged, user.ddzProfile.coins=',user.ddzProfile.coins);
            return user.ddzProfile.saveQ();
        })
        .then(function(ddzProfile){
            logger.info('UserLevelService.onUserCoinsChanged, done. result.levelChanged=',result.levelChanged);
            if (result.levelChanged){
                logger.info('UserLevelService.onUserCoinsChanged, after saved, ddzProfile.levelName=',ddzProfile.levelName);
                result.ddzProfile = ddzProfile;
                return UserSession.findOneQ({userId: userId});
            }
        })
        .then(function(userSession){
            if (result.levelChanged && !result.user.robot) {
                process.nextTick(function () {
                    messageService.pushMessage('onUserLevelChanged',
                        {levelName: result.ddzProfile.levelName},
                        [{uid: result.user.userId, sid: userSession.frontendId}]);
                    if (coinsUp) {
                        taskService.processOtherTasks(result.user, 'level_up', {
                            user: result.user,
                            trigger: 'level_up'
                        });
                    }
                });
            }
            utils.invokeCallback(callback, null, true);
        })
        .fail(function(error){
            logger.error('UserLevelService.onUserCoinsChanged, failed. ', error);
            utils.invokeCallback(callback, {code: error.number, msg: error.message}, false);
        });

};


