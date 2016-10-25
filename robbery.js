'use strict';
var GOODWEEKDAYS = [
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

var MINUTESINDAY = 24 * 60;
var MINUTESINHOURS = 60;

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
    var goodTime = getGoodTime(badTimes, duration, mainTimeFormat);
    var formatResult = getFormatResult(goodTime);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {

            return formatResult.length > 0;
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
            var day = RegExp('(%DD)');
            var hours = RegExp('(%HH)');
            var minutes = RegExp('(%MM)');

            return template.replace(day, firstVariant.day)
                .replace(hours, firstVariant.hours)
                .replace(minutes, firstVariant.minutes);
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
    var badTimes = getBadTimesOfPerson(schedule, mainFormat);
    var badWorkTimes = getBadWorkTimesOfDays(workTime, mainFormat);

    badWorkTimes.forEach(function (time) {
        badTimes.push(time);
    });
    badTimes.sort(function (a, b) {

        return a[1] - b[1];
    });
    badTimes.sort(function (a, b) {

        return a[0] - b[0];
    });
    badTimes = unionBadTimes(badTimes);

    return badTimes;
}

function unionBadTimes(badTimes) {
    var times = badTimes;
    for (var i = 0; i < times.length - 1; i++) {
        if (times[i][1] > times[i + 1][0] &&
            times[i][1] > times[i + 1][1]) {
            times[i + 1] = times[i];
        } else if (times[i][1] > times[i + 1][0] &&
            times[i][1] < times[i + 1][1]) {
            times[i + 1] = [times[i][0], times[i + 1][1]];
        }
    }

    return times;
}

function getBadTimesOfPerson(schedule, timeFormat) {
    var times = [];
    for (var person in schedule) {
        if (!schedule.hasOwnProperty(person)) {
            return times;
        }
        schedule[person].forEach(function (time) {
            var period = [
                Number(time.from.split(' ')[1].split('+')[0].split(':')[0]) *
                MINUTESINHOURS +
                Number(time.from.split(' ')[1].split('+')[0].split(':')[1]) +
                minutesInDay(time.from.split(' ')[0]) -
                Number(time.from.split(' ')[1].split('+')[1]) *
                MINUTESINHOURS + (timeFormat) * MINUTESINHOURS,

                Number(time.to.split(' ')[1].split('+')[0].split(':')[0]) *
                MINUTESINHOURS +
                Number(time.to.split(' ')[1].split('+')[0].split(':')[1]) +
                minutesInDay(time.to.split(' ')[0]) -
                Number(time.to.split(' ')[1].split('+')[1]) *
                MINUTESINHOURS + (timeFormat) * MINUTESINHOURS
            ];
            times.push(period);
        });
    }

    return times;
}

function minutesInDay(day) {
    var result = 4 * MINUTESINDAY;
    GOODWEEKDAYS.forEach(function (dayWeek) {
        if (dayWeek.toString === day) {
            result = dayWeek.coeff * MINUTESINDAY;
        }
    });

    return result;
}

function getBadWorkTimesOfDays(workTime) {
    var time = [];
    for (var i = 0; i < 3; i++) {
        var period = [
            Number(workTime.from.split('+')[0].split(':')[0]) *
            MINUTESINHOURS +
            Number(workTime.from.split('+')[0].split(':')[1]) +
            i * MINUTESINDAY,

            Number(workTime.to.split('+')[0].split(':')[0]) *
            MINUTESINHOURS +
            Number(workTime.to.split('+')[0].split(':')[1]) +
            i * MINUTESINDAY
        ];
        if (period[0] < 3 * MINUTESINDAY &&
            period[1] < 3 * MINUTESINDAY) {
            time.push(period);
        }
    }
    var badTime = [
        [0, time[0][0]],
        [time[0][1], time[1][0]],
        [time[1][1], time[2][0]],
        [time[2][1], 4320]
    ];

    return badTime;
}

function getGoodTime(badTime, likeTime) {
    var goodTime = [];
    for (var i = 0; i < badTime.length - 1; i ++) {
        var selectedPeriod = badTime[i + 1][0] - badTime[i][1];
        if (selectedPeriod >= likeTime) {
            goodTime.push([
                badTime[i][1],
                badTime[i + 1][0]
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
                day: dayString(Math.floor(fromTo[0] / (MINUTESINDAY))),
                hours: timeString(Math.floor(fromTo[0] / MINUTESINHOURS) -
                    Math.floor(fromTo[0] / (MINUTESINDAY)) * 24),
                minutes: timeString(fromTo[0] -
                    Math.floor(fromTo[0] / (MINUTESINDAY)) * (MINUTESINDAY) -
                    (Math.floor(fromTo[0] / MINUTESINHOURS) -
                    Math.floor(fromTo[0] / (MINUTESINDAY)) * 24) *
                    MINUTESINHOURS)
            },
            to: {
                day: dayString(Math.floor(fromTo[1] / (MINUTESINDAY))),
                hours: timeString(Math.floor(fromTo[1] / MINUTESINHOURS) -
                    Math.floor(fromTo[1] / (MINUTESINDAY)) * 24),
                minutes: timeString(fromTo[1] -
                    Math.floor(fromTo[1] / (MINUTESINDAY)) * (MINUTESINDAY) -
                    (Math.floor(fromTo[1] / MINUTESINHOURS) -
                    Math.floor(fromTo[1] / (MINUTESINDAY)) * 24) *
                    MINUTESINHOURS)
            }
        };
        if (period.from.day === period.to.day) {
            formatResult.push(period);
        }
    });

    return formatResult;
}

function dayString(day) {
    var dayToString = '';
    GOODWEEKDAYS.forEach(function (dayWeek) {
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
