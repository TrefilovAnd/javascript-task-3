'use strict';
var goodDays = [
    {
        coeff: 0,
        toString: 'ПН'
    },
    {
        coeff: 1,
        toString: 'ВТ'
    },
    {
        coeff: 2,
        toString: 'СР'
    }
];

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
    //console.info(schedule, duration, workingHours);

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
    var days = getTimesOfDay(schedule);

    console.info(days);
}

function getTimesOfDay(schedule) {
    var times = [];
    for (var person in schedule) {
        schedule[person].map(function (time) {
            var k;
            var period = {
                name: person,
                fromTo: [
                    Number(time.from.split(' ')[1].split('+')[0].split(':')[0]) * 60 +
                    Number(time.from.split(' ')[1].split('+')[0].split(':')[1]) +
                    minutesInDay(time.from.split(' ')[0]),
                    Number(time.to.split(' ')[1].split('+')[0].split(':')[0]) * 60 +
                    Number(time.to.split(' ')[1].split('+')[0].split(':')[1]) +
                    minutesInDay(time.to.split(' ')[0])
                ]
            };
            times.push(period);
        });
    }
    return times;
}

function minutesInDay(day) {
    var result = 0;
    goodDays.forEach(function (dayWeek) {
        if (dayWeek.toString === day) {
            result = dayWeek.coeff * 24 * 60;
        }
    });
    return result;
}
