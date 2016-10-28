'use strict';
var GOOD_WEEK_DAYS = [
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

var MINUTES_IN_DAY = 24 * 60;
var MINUTES_IN_HOURS = 60;
var MORNING_OF_THURSDAY = 3 * MINUTES_IN_DAY;

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

    var bankTimezone = Number(workingHours.from.split('+')[1]);
    var badTimes = getBadTimes(schedule, bankTimezone, workingHours);
    var workingTimes = getGoodTime(badTimes, duration, bankTimezone);
    var formatResult = getFormatResult(workingTimes);

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
            if (!this.exists()) {
                return '';
            }
            var firstVariant = formatResult[0].from;

            return template
                .replace(/%DD/, firstVariant.day)
                .replace(/%HH/, firstVariant.hours)
                .replace(/%MM/, firstVariant.minutes);
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

function getBadTimes(schedule, mainFormat, workTime) {
    var badGangTimes = getBadGangTimes(schedule, mainFormat);
    var badBankTimes = getBadWorkTimesOfDays(workTime, mainFormat);

    var badTimes = badGangTimes.concat(badBankTimes);
    badTimes.sort(function (a, b) {
        return a.to - b.to;
    });
    badTimes.sort(function (a, b) {
        return a.from - b.from;
    });
    badTimes = unionBadTimes(badTimes);

    return badTimes;
}

function unionBadTimes(badTimes) {
    var times = badTimes;
    for (var i = 0; i < times.length - 1; i++) {
        var firstCheckedPeriod = times[i];
        var nextCheckedPeriod = times[i + 1];
        if (firstCheckedPeriod.to > nextCheckedPeriod.from &&
            firstCheckedPeriod.to > nextCheckedPeriod.to) {
            times[i + 1] = firstCheckedPeriod;
        } else if (firstCheckedPeriod.to > times[i + 1].from &&
            firstCheckedPeriod.to < times[i + 1].to) {
            times[i + 1] = {
                from: firstCheckedPeriod.from,
                to: nextCheckedPeriod.to
            };
        }
    }

    return times;
}

function getBadGangTimes(schedule, timeFormat) {
    var periods = [];
    for (var person in schedule) {
        if (!schedule.hasOwnProperty(person)) {
            return periods;
        }
        schedule[person].forEach(function (time) {
            var period = {
                from: Number(time.from.split(' ')[1].split('+')[0].split(':')[0]) *
                    MINUTES_IN_HOURS +
                    Number(time.from.split(' ')[1].split('+')[0].split(':')[1]) +
                    minutesInDay(time.from.split(' ')[0]) -
                    Number(time.from.split(' ')[1].split('+')[1]) *
                    MINUTES_IN_HOURS + (timeFormat) * MINUTES_IN_HOURS,
                to: Number(time.to.split(' ')[1].split('+')[0].split(':')[0]) *
                    MINUTES_IN_HOURS +
                    Number(time.to.split(' ')[1].split('+')[0].split(':')[1]) +
                    minutesInDay(time.to.split(' ')[0]) -
                    Number(time.to.split(' ')[1].split('+')[1]) *
                    MINUTES_IN_HOURS + (timeFormat) * MINUTES_IN_HOURS
            };
            periods.push(period);
        });
    }

    return periods;
}

function minutesInDay(day) {
    var result = 4 * MINUTES_IN_DAY;
    GOOD_WEEK_DAYS.forEach(function (dayWeek) {
        if (dayWeek.toString === day) {
            result = dayWeek.coeff * MINUTES_IN_DAY;
        }
    });

    return result;
}

function getBadWorkTimesOfDays(workTime) {
    var periods = [];
    for (var i = 0; i < 3; i++) {
        var period = {
            from: Number(workTime.from.split('+')[0].split(':')[0]) *
                MINUTES_IN_HOURS +
                Number(workTime.from.split('+')[0].split(':')[1]) +
                i * MINUTES_IN_DAY,
            to: Number(workTime.to.split('+')[0].split(':')[0]) *
                MINUTES_IN_HOURS +
                Number(workTime.to.split('+')[0].split(':')[1]) +
                i * MINUTES_IN_DAY
        };
        periods.push(period);
    }
    periods = [
        { from: 0, to: periods[0].from },
        { from: periods[0].to, to: periods[1].from },
        { from: periods[1].to, to: periods[2].from },
        { from: periods[2].to, to: MORNING_OF_THURSDAY }
    ];

    return periods;
}

function getGoodTime(badTime, likeTime) {
    var goodTime = [];
    for (var i = 0; i < badTime.length - 1; i ++) {
        var selectedPeriod = badTime[i + 1].from - badTime[i].to;
        if (selectedPeriod >= likeTime) {
            goodTime.push({
                from: badTime[i].to,
                to: badTime[i + 1].from
            });
        }
    }
    console.log(goodTime);

    return goodTime;
}

function getFormatResult(result) {
    var formatResult = [];
    result.forEach(function (fromTo) {
        var period = {
            from: {
                day: dayString(Math.floor(fromTo.from / (MINUTES_IN_DAY))),
                hours: timeString(Math.floor(fromTo.from / MINUTES_IN_HOURS) -
                    Math.floor(fromTo.from / (MINUTES_IN_DAY)) * 24),
                minutes: timeString(fromTo.from -
                    Math.floor(fromTo.from / (MINUTES_IN_DAY)) * (MINUTES_IN_DAY) -
                    (Math.floor(fromTo.from / MINUTES_IN_HOURS) -
                    Math.floor(fromTo.from / (MINUTES_IN_DAY)) * 24) *
                    MINUTES_IN_HOURS)
            },
            to: {
                day: dayString(Math.floor(fromTo.to / (MINUTES_IN_DAY))),
                hours: timeString(Math.floor(fromTo.to / MINUTES_IN_HOURS) -
                    Math.floor(fromTo.to / (MINUTES_IN_DAY)) * 24),
                minutes: timeString(fromTo.to -
                    Math.floor(fromTo.to / (MINUTES_IN_DAY)) * (MINUTES_IN_DAY) -
                    (Math.floor(fromTo.to / MINUTES_IN_HOURS) -
                    Math.floor(fromTo.to / (MINUTES_IN_DAY)) * 24) *
                    MINUTES_IN_HOURS)
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
    GOOD_WEEK_DAYS.forEach(function (dayWeek) {
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
