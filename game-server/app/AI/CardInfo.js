/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var PokeGroup = require('./PokeGroup');
var PokeGroupArray = require('./PokeGroupArray');
var AIHelper = require('./AIHelper');
var cardUtil = require('../util/cardUtil');
var PokeCardValue = require('../consts/consts').PokeCardValue;

var CardInfo = function() {
  //var pokeCards = opts.pokeCards.slice(0);
  this.pokeCards = [];
  this.groups = [];
  this.groupsMap = {};
  this.bombs = [];
  this.threes = [];
  this.pairs = [];
  this.signles = [];
  this.rockets = [];
  this.possibleStraights = [];
  this.workingGroups = [];
  this.cardPlans = [];
  this.grabLoadWeight = 0;
};

CardInfo.prototype.clone = function() {
  var newCardInfo = new CardInfo();
  newCardInfo.pokeCards = this.pokeCards.slice(0);

  for(var key in this.groupsMap) {
    newCardInfo.groupsMap[key] = this.groupsMap[key].slice(0);
  }


  AIHelper.copyGroups(this.groups, newCardInfo.groups);
  AIHelper.copyGroups(this.bombs, newCardInfo.bombs);
  AIHelper.copyGroups(this.threes, newCardInfo.threes);
  AIHelper.copyGroups(this.pairs, newCardInfo.pairs);
  AIHelper.copyGroups(this.signles, newCardInfo.signles);
  AIHelper.copyGroups(this.rockets, newCardInfo.rockets);
  AIHelper.copyGroups(this.signles, newCardInfo.signles);
  AIHelper.copyGroups(this.possibleStraights, newCardInfo.possibleStraights);
  AIHelper.copyGroups(this.workingGroups, newCardInfo.workingGroups);

  return newCardInfo;
};

CardInfo.create = function(pokeCards) {

  pokeCards = pokeCards.slice(0);
  pokeCards.sort(AIHelper.sortAscBy('pokeIndex'));

  var pokeGroups = createPokeGroups(pokeCards)

  var cardInfo = new CardInfo();
  cardInfo.pokeCards = pokeCards;
  cardInfo.groups = pokeGroups;
  //cardInfo.groupsMap = groupsMap;

  cardInfo.bombs = CardInfo.getBombs(pokeGroups);
  cardInfo.threes = CardInfo.getThrees(pokeGroups);
  cardInfo.pairs = CardInfo.getPairs(pokeGroups);
  cardInfo.singles = CardInfo.getSingles(pokeGroups);
  cardInfo.rockets = CardInfo.getRockets(pokeGroups);

  cardInfo.possibleStraights = CardInfo.findPossibleStraights(pokeGroups);
  cardInfo.grabLoadWeight = CardInfo.getGrabLoadWeight(pokeGroups);

  return cardInfo;
};

CardInfo:createPokeGroups = function (pokeCards){
  pokeCards = pokeCards.slice(0);
  pokeCards.sort(AIHelper.sortAscBy('pokeIndex'));

  var pokeGroups = new PokeGroupArray();
  var group = [];

  for (var index=0; index<pokeCards.length; index++) {
    if (group.length == 0) {
      group.push(pokeCards[index]);
    } else if (group[0].value == pokeCards[index].value) {
      group.push(pokeCards[index]);
    } else {
      pokeGroups.push(new PokeGroup(group));
      group = [];
      group.push(pokeCards[index]);
    }
  }
  if (group.length > 0)
    pokeGroups.push(new PokeGroup(group));

  return pokeGroups;
};

CardInfo.getPokeGroupsExcludeUsedPokes = function (pokeCards, usedPokeGroups){
  pokeCards = pokeCards.slice(0);
  pokeCards.sort(AIHelper.sortAscBy('pokeIndex'));

  var pokeGroups = new PokeGroupArray();
  var group = [];

  for (var index=0; index<pokeCards.length; index++) {
    if (!CardInfo.isInPokeGroups(pokeCards[index], usedPokeGroups)){
      if (group.length == 0) {
        group.push(pokeCards[index]);
      } else if (group.length > 0 && group[0].value == pokeCards[index].value) {
        group.push(pokeCards[index]);
      } else {
        pokeGroups.push(new PokeGroup(group));
        group = [];
        group.push(pokeCards[index]);
      }
    }

  }
  if (group.length > 0)
    pokeGroups.push(new PokeGroup(group));

  return pokeGroups;
};

CardInfo.isInPokeGroups = function (pokeCard, pokeGroups) {
  for (var i=0; i < pokeGroups.length; i ++) {
    var group = pokeGroups.get(i);
    for (var j=0; j<group.length; j ++){
      if (group.get(j).pokeIndex == pokeCard.pokeIndex)
        return true;
    }
  }
  return false;
};

CardInfo.getGrabLoadWeight =function (pokeGroups) {
  var weight = 0;
  for (var index=0; index<pokeGroups.length; index++) {
    var group = pokeGroups.get(index);
    if (group.pokeValue > PokeCardValue.ACE || group.length >= 4)
      weight = weight + 1*group.length;
  }
  return weight;
};


CardInfo.getBombs = function (pokeGroups) {
  var bombs = new PokeGroupArray();
  for (var index=0; index<pokeGroups.length; index++) {
    var group = pokeGroups.get(index);
    if (group.length == 4)
      bombs.push(group);
  }

  return bombs;
};

CardInfo.getPossibleThrees = function (pokeGroups) {
  var threes = new PokeGroupArray();
  for (var index=0; index<pokeGroups.length; index++) {
    var group = pokeGroups.get(index);
    if (group.length == 3)
      threes.push(group);
    else if (group.length == 4)
      threes.push(new PokeGroup(group.slice(0,3)));
  }

  return threes;
};

CardInfo.getThrees = function (pokeGroups) {
  var threes = new PokeGroupArray();
  for (var index=0; index<pokeGroups.length; index++) {
    var group = pokeGroups.get(index);
    if (group.length == 3)
      threes.push(group);
  }

  return threes;
};

CardInfo.getPairs = function (pokeGroups) {
  var pairs = new PokeGroupArray();
  for (var index=0; index<pokeGroups.length; index++) {
    var group = pokeGroups.get(index);
    if (group.length == 2)
      pairs.push(group);
  }

  return pairs;
};

CardInfo.getPossiblePairs = function (pokeGroups) {
  var pairs = new PokeGroupArray();
  for (var index=0; index<pokeGroups.length; index++) {
    var group = pokeGroups.get(index);
    if (group.length == 2)
      pairs.push(group);
    else if (group.length == 3)
      pairs.push(new PokeGroup(group.slice(0,2)));
    else if (group.length == 4) {
      pairs.push(new PokeGroup(group.slice(0,2)));
      pairs.push(new PokeGroup(group.slice(-2)));
    }

  }

  return pairs;
};

CardInfo.getSingles = function (pokeGroups) {
  var singles = new PokeGroupArray();

  var count = pokeGroups.length;
  if (count>=2) {
    if ( pokeGroups.get(count-1).pokeValue == PokeCardValue.BIG_JOKER
      && pokeGroups.get(count-2).pokeValue == PokeCardValue.SMALL_JOKER) {
      count = count -2
    }
  }

  for (var index=0; index<count; index++) {
    var group = pokeGroups.get(index);
    if (group.length == 1)
      singles.push(group);
  }

  return singles

};

CardInfo.getPossibleSingles = function (pokeGroups) {
  var singles = new PokeGroupArray();

  var count = pokeGroups.length;
  if (count>=2) {
    if ( pokeGroups.get(count-1).pokeValue == PokeCardValue.BIG_JOKER
        && pokeGroups.get(count-2).pokeValue == PokeCardValue.SMALL_JOKER) {
      count = count -2
    }
  }

  for (var index=0; index<count; index++) {
    var group = pokeGroups.get(index);
    for (var i= 0; i < group.length; i++){
      singles.push(new PokeGroup([group.get(i)]))
    }
  }

  return singles

};

CardInfo.getRockets = function (pokeGroups) {
  var rockets = new PokeGroupArray();
  var count = pokeGroups.length;

  if (count >=2
    && pokeGroups.get(count-1).pokeValue == PokeCardValue.BIG_JOKER
    && pokeGroups.get(count-2).pokeValue == PokeCardValue.SMALL_JOKER) {
    var group = [];
    group.push(pokeGroups.get(count-1).get(0));
    group.push(pokeGroups.get(count-2).get(0));
    rockets.push(new PokeGroup(group));
    pokeGroups.remove(pokeGroups.get(count-1));
    pokeGroups.remove(pokeGroups.get(count-2));
  }

  return rockets;
};


CardInfo.pokeCardsFromGroups = function(groups, startIndex, count) {
  if (startIndex + count > groups.length) {
    return [];
  }

  var pokes = Array(count);
  for (var index=startIndex; index< startIndex+count; index++) {
    pokes[index-startIndex] = groups.get(index).get(0);
  }

  return pokes;
};

CardInfo.findPossibleStraights = function(groups, minLen, maxLen) {
  var straights = [];
  var count = groups.length;

  minLen = minLen || 5;
  maxLen = maxLen || 20;

  var index = 0;

  if (count < minLen)
    return straights;

  // 取前5张牌
  var pokes = CardInfo.pokeCardsFromGroups(groups, 0, minLen);
  index = minLen;

  var done = false;

  while (!done) {
    var result = cardUtil.isStraight(pokes, true);
    if (result) {
      if (pokes.length == minLen) {
        straights.push(pokes);
      }

      if (pokes.length == maxLen) {
        pokes = CardInfo.pokeCardsFromGroups(groups, index, minLen );
        index = index + minLen;
        continue;
      }

      if (index < count) {
        pokes.push(groups.get(index).get(0));
      }
      index++;
    } else if (pokes.length > minLen) {
      pokes.pop();
      pokes = CardInfo.pokeCardsFromGroups(groups, index-1, minLen);
      index = index + minLen-1;
    } else {
      pokes.shift();
      if (index < count) {
        pokes.push(groups.get(index).get(0));
      }
      index++;
    }

    done = index > count;
  }

  return straights;
};


CardInfo.prototype.dump = function() {
  var valueChar = this.pokeCards.map(function(p) { return p.valueChar; }).join('');
  var pokeChars = this.pokeCards.map(function(p) { return p.pokeChar; }).join('');
  console.log('pokeCards: ' + valueChar);
  console.log('pokeChars: ' + pokeChars );
  console.log('groups: ', AIHelper.groupsToString(this.groups));
  console.log('单牌: ' + AIHelper.groupsToString(this.singles));
  console.log('对子: ' + AIHelper.groupsToString(this.pairs));
  console.log('三张: ' + AIHelper.groupsToString(this.threes));
  console.log('炸弹: ' + AIHelper.groupsToString(this.bombs));
  console.log('火箭: ' + AIHelper.groupsToString(this.rockets));
};

module.exports = CardInfo;