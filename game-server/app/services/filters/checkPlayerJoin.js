/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var utils = require('../../util/utils');
var ErrorCode = require('../../consts/errorCode');

var CheckPlayerJoinBeforeFilter = function(opts) {

};

module.exports = CheckPlayerJoinBeforeFilter;

CheckPlayerJoinBeforeFilter.execute = function(params, cb) {
  var table = params.table;
  var player = params.player;
  var existPlayer = table.getPlayerByUserId(player.userId);

  if (table.players.length > 3 && existPlayer == null) {
    utils.invokeCallback(cb, {err: ErrorCode.TABLE_FULL}, params);
  }

  utils.invokeCallback(cb, null, params);
};