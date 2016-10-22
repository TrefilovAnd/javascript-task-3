'use strict';

var DAYWEEK = 1;
var HOURS = 2;
var MINUTES = 3;
var TIMEFORMAT = 4;

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);

    var mainTimeFormat = workingHours.from.match(/\+(\d+)/)[1];
    var bestOverAllTimes = getBestOverAllTimes(schedule, mainTimeFormat);


    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            return false;
        }
    };
};

function getBestOverAllTimes(schedule, timeFormat) {
    var days = [
        getTimesOfDay('ПН', schedule),
        getTimesOfDay('ВТ', schedule),
        getTimesOfDay('СР', schedule)
    ];
    for (var day in days) {
        if (day) {
            day = getBestTime(day);
        }
    }

    console.info(days[0]);
}

function getTimesOfDay(day, schedule) {
    var times = [];
    var countWhichCan = 0;
    for (var person in schedule) {
        var check = false;
        schedule[person].filter(function (time) {
            if (time.from.split(' ')[0] === day ||
                time.to.split(' ')[0] === day) {
                times.push(time);
                check = true;
            }
        });
        if (check) {
            countWhichCan++;
        } else {
            return false;
        }
    }
    return times;
}

function getBestTime(day) {
    var time = {
        from: [0, 0],
        to: [23, 59]
    };
    for (var timeOfDay in day) {
        if (timeOfDay.from.split(' ')[0] === timeOfDay.to.split(' ')[0]) {
            compareTimesFrom(timeOfDay.from.split(' ')[1].split('+')[0], time);
        }
    }
}

function compareTimesFrom(checkedTime, time) {
    var checked = checkedTime.split(':');
    for (var i = 0; i < 2; i++) {
        if (checked[i] > time.from[i]) {
            
        }
    }
}
