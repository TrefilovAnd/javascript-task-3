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
exports.isStar = false;

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

    var mainTimeFormat = Number(workingHours.from.match(/\+(\d+)/)[1]);
    var badTimes = getBadTime(schedule, mainTimeFormat, workingHours);
    var formatResult = getFormatResult(getGoodTime(badTimes, duration, mainTimeFormat));


    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (formatResult.length) {

                return true;
            }

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
            if (!formatResult.length) {

                return '';
            }
            var firstVariant = formatResult[0].from;

            return template.replace(/(%DD)|(%HH)|(%MM)/g, function (str, dd, hh, mm) {
                if (dd) {

                    return firstVariant.day;
                } else if (hh) {

                    return firstVariant.hours;
                } else if (mm) {

                    return firstVariant.minutes;
                }
            });
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

function getBadTime(schedule, mainFormat, workTime) {
    var badTimes = getBadTimesOfPerson(schedule);
    var badWorkTimes = getBadWorkTimesOfDays(workTime, mainFormat);
    badWorkTimes.forEach(function (time) {
        badTimes.push(time);
    });
    badTimes.sort(function (a, b) {

        return a[0] - b[0];
    });

    return badTimes;
}

function getBadTimesOfPerson(schedule) {
    var times = [];
    for (var person in schedule) {
        schedule[person].forEach(function (time) {
            var period = [
                Number(time.from.split(' ')[1].split('+')[0].split(':')[0]) * 60 +
                    Number(time.from.split(' ')[1].split('+')[0].split(':')[1]) +
                    minutesInDay(time.from.split(' ')[0]) -
                    Number(time.from.split(' ')[1].split('+')[1]) * 60,

                Number(time.to.split(' ')[1].split('+')[0].split(':')[0]) * 60 +
                    Number(time.to.split(' ')[1].split('+')[0].split(':')[1]) +
                    minutesInDay(time.to.split(' ')[0]) -
                    Number(time.to.split(' ')[1].split('+')[1]) * 60
            ];
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

function getBadWorkTimesOfDays(workTime, timeFormat) {
    var time = [];
    for (var i = 0; i < 3; i++) {
        var period = [
            Number(workTime.from.split('+')[0].split(':')[0]) * 60 +
            Number(workTime.from.split('+')[0].split(':')[1]) -
            (timeFormat) * 60 + i * 24 * 60,

            Number(workTime.to.split('+')[0].split(':')[0]) * 60 +
            Number(workTime.to.split('+')[0].split(':')[1]) -
            (timeFormat) * 60 + i * 24 * 60
        ];
        time.push(period);
    }
    var badTime = [
        [0, time[0][0] - 1],
        [time[0][1], time[1][0] - 1],
        [time[1][1], time[2][0] - 1],
        [time[2][1], 4320]
    ];

    return badTime;
}

function getGoodTime(badTime, likeTime, timeFormat) {
    var goodTime = [];
    for (var i = 0; i < badTime.length - 1; i ++) {
        if (badTime[i + 1][0] - badTime[i][1] >= likeTime) {
            goodTime.push([
                badTime[i][1] + timeFormat * 60,
                badTime[i + 1][0] + timeFormat * 60
            ]);
        }
    }

    return goodTime;
}

function getFormatResult(result) {
    var formatResult = [];
    result.forEach(function (fromTo) {
        var period = {
            from: {
                day: dayString(Math.floor(fromTo[0] / (24 * 60))),
                hours: timeString(Math.floor(fromTo[0] / 60) -
                    Math.floor(fromTo[0] / (24 * 60)) * 24),
                minutes: timeString(fromTo[0] -
                    Math.floor(fromTo[0] / (24 * 60)) * (24 * 60) -
                    (Math.floor(fromTo[0] / 60) -
                    Math.floor(fromTo[0] / (24 * 60)) * 24) * 60)
            },
            to: {
                day: dayString(Math.floor(fromTo[1] / (24 * 60))),
                hours: timeString(Math.floor(fromTo[1] / 60) -
                    Math.floor(fromTo[1] / (24 * 60)) * 24),
                minutes: timeString(fromTo[1] -
                    Math.floor(fromTo[1] / (24 * 60)) * (24 * 60) -
                    (Math.floor(fromTo[1] / 60) -
                    Math.floor(fromTo[1] / (24 * 60)) * 24) * 60)
            }
        };
        formatResult.push(period);
    });

    return formatResult;
}

function dayString(day) {
    var dayToString = '';
    goodDays.forEach(function (dayWeek) {
        if (dayWeek.coeff === day) {
            dayToString = dayWeek.toString;
        }
    });

    return dayToString;
}

function timeString(time) {
    if (time.toString().length === 1) {
        return '0' + time.toString();
    }

    return time.toString();
}
