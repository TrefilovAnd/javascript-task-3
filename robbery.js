'use strict';
var GOOD_WEEK_DAYS = ['ПН', 'ВТ', 'СР'];

var MINUTES_IN_DAY = 24 * 60;
var MINUTES_IN_HOUR = 60;
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
    var badPeriods = getBadPeriods(schedule, bankTimezone, workingHours);
    var goodPeriods = getGoodPeriods(badPeriods, duration);
    var formatResult = getFormatResult(goodPeriods);

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
                .replace('%DD', firstVariant.day)
                .replace('%HH', firstVariant.hours)
                .replace('%MM', firstVariant.minutes);
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

function getBadPeriods(schedule, mainFormat, workingHours) {
    var badGangPeriods = getBadGangPeriods(schedule, mainFormat);
    var badBankPeriods = getBadBankPeriods(workingHours, mainFormat);
    var badPeriods = badGangPeriods.concat(badBankPeriods);

    badPeriods.sort(function (a, b) {
        if (a.from === b.from) {
            return a.to - b.to;
        }

        return a.from - b.from;
    });
    badPeriods = unionBadTimes(badPeriods);

    return badPeriods;
}

function unionBadTimes(badTimes) {
    var times = badTimes;

    for (var i = 0; i < times.length - 1; i++) {
        var firstVerifiablePeriod = times[i];
        var nextVerifiablePeriod = times[i + 1];

        if (firstVerifiablePeriod.to > nextVerifiablePeriod.to) {
            times[i + 1] = firstVerifiablePeriod;
        } else if (firstVerifiablePeriod.to > nextVerifiablePeriod.from &&
            firstVerifiablePeriod.to < nextVerifiablePeriod.to) {
            times[i + 1] = {
                from: firstVerifiablePeriod.from,
                to: nextVerifiablePeriod.to
            };
        }
    }

    return times;
}

function getBadGangPeriods(schedule, mainTimezone) {
    var periods = [];
    var gangsters = Object.keys(schedule);

    gangsters.forEach(function (gangster) {
        schedule[gangster].forEach(function (time) {
            periods.push({
                from: dayTimeStringToMinutes(time.from, mainTimezone),
                to: dayTimeStringToMinutes(time.to, mainTimezone)
            });
        });
    });

    return periods;
}

//  Перевод дня недели в минуты
function dayToMinutes(day) {
    //  Берем изначально большое количество,
    //  чтобы в дальнейшем не рассматривать, если не ПН, ВТ или СР
    var result = 4 * MINUTES_IN_DAY;

    GOOD_WEEK_DAYS.forEach(function (weekDay) {
        if (weekDay === day) {
            result = GOOD_WEEK_DAYS.indexOf(day) * MINUTES_IN_DAY;
        }
    });

    return result;
}

function getBadBankPeriods(workTime) {
    var periods = [];

    for (var i = 0; i < 3; i++) {
        var period = {
            from: timeStringToMinutes(workTime.from) +
                i * MINUTES_IN_DAY,
            to: timeStringToMinutes(workTime.to) +
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

//  Перевод строки времени банка в минуты
function timeStringToMinutes(stringTime) {
    var time = stringTime.match(/(\d\d):(\d\d)/);

    return Number(time[1]) * MINUTES_IN_HOUR +
        Number(time[2]);
}

//  Перевод строки времени бандитов в минуты
function dayTimeStringToMinutes(stringTime, mainTimezone) {
    var time = stringTime.split(' ');
    var day = time[0];
    time = time[1].split('+');
    var timeZone = Number(time[1]);
    var hoursAndMinutes = timeStringToMinutes(time[0]);

    return dayToMinutes(day) +
        hoursAndMinutes -
        timeZone * MINUTES_IN_HOUR +
        mainTimezone * MINUTES_IN_HOUR;
}

function getGoodPeriods(badTime, likeTime) {
    var goodPeriods = [];

    for (var i = 0; i < badTime.length - 1; i ++) {
        var currentPeriod = badTime[i + 1].from - badTime[i].to;

        if (currentPeriod >= likeTime) {
            goodPeriods.push({
                from: badTime[i].to,
                to: badTime[i + 1].from
            });
        }
    }

    return goodPeriods;
}

function getFormatResult(result) {
    var formatResult = [];

    result.forEach(function (fromTo) {
        var period = {
            from: {
                day: dayString(Math.floor(fromTo.from / (MINUTES_IN_DAY))),
                hours: timeString(Math.floor(fromTo.from / MINUTES_IN_HOUR) -
                    Math.floor(fromTo.from / (MINUTES_IN_DAY)) * 24),
                minutes: timeString(fromTo.from -
                    Math.floor(fromTo.from / (MINUTES_IN_DAY)) * (MINUTES_IN_DAY) -
                    (Math.floor(fromTo.from / MINUTES_IN_HOUR) -
                    Math.floor(fromTo.from / (MINUTES_IN_DAY)) * 24) *
                    MINUTES_IN_HOUR)
            },
            to: {
                day: dayString(Math.floor(fromTo.to / (MINUTES_IN_DAY))),
                hours: timeString(Math.floor(fromTo.to / MINUTES_IN_HOUR) -
                    Math.floor(fromTo.to / (MINUTES_IN_DAY)) * 24),
                minutes: timeString(fromTo.to -
                    Math.floor(fromTo.to / (MINUTES_IN_DAY)) * (MINUTES_IN_DAY) -
                    (Math.floor(fromTo.to / MINUTES_IN_HOUR) -
                    Math.floor(fromTo.to / (MINUTES_IN_DAY)) * 24) *
                    MINUTES_IN_HOUR)
            }
        };
        if (period.from.day === period.to.day) {
            formatResult.push(period);
        }
    });

    return formatResult;
}

function dayString(day) {
    return GOOD_WEEK_DAYS[day];
}

function timeString(time) {
    if (time.toString().length === 1) {
        return '0' + time.toString();
    }

    return time.toString();
}
