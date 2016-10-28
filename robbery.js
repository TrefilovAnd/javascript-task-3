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
    gangStringInMinutes('ВТ 11:05+5', 5);

    var bankTimezone = Number(workingHours.from.split('+')[1]);
    var badPeriods = getBadPeriods(schedule, bankTimezone, workingHours);
    var goodPeriods = getGoodPeriods(badPeriods, duration, bankTimezone);
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

function getBadPeriods(schedule, mainFormat, workTime) {
    var badGangPeriods = getBadGangPeriods(schedule, mainFormat);
    var badBankPeriods = getBadBanksPeriods(workTime, mainFormat);

    var badPeriods = badGangPeriods.concat(badBankPeriods);
    badPeriods.sort(function (a, b) {
        return a.to - b.to;
    });
    badPeriods.sort(function (a, b) {
        return a.from - b.from;
    });
    badPeriods = unionBadTimes(badPeriods);

    return badPeriods;
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

function getBadGangPeriods(schedule, mainTimezone) {
    var periods = [];
    for (var person in schedule) {
        if (!schedule.hasOwnProperty(person)) {
            return periods;
        }
        schedule[person].forEach(function (time) {
            var period = {
                from: gangStringInMinutes(time.from, mainTimezone),
                to: gangStringInMinutes(time.to, mainTimezone)
            };
            periods.push(period);
        });
    }

    return periods;
}

//Перевод дня недели в минуты
function minutesInDay(day) {
    //Берем изначально большое количество,
    //чтобы в дальнейшем не рассматривать, если не ПН, ВТ или СР
    var result = 4 * MINUTES_IN_DAY;
    GOOD_WEEK_DAYS.forEach(function (dayWeek) {
        if (dayWeek.toString === day) {
            result = dayWeek.coeff * MINUTES_IN_DAY;
        }
    });

    return result;
}

function getBadBanksPeriods(workTime) {
    var periods = [];
    for (var i = 0; i < 3; i++) {
        var period = {
            from: bankStringInMinutes(workTime.from) +
                i * MINUTES_IN_DAY,
            to: bankStringInMinutes(workTime.to) +
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

//Перевод строки времени банка в минуты
function bankStringInMinutes(stringTime) {
    var time = stringTime.match(/(\d\d):(\d\d)/);
    return Number(time[1]) * MINUTES_IN_HOURS +
        Number(time[2]);
}

//Перевод строки времени бандитов в минуты
function gangStringInMinutes(stringTime, mainTimezone) {
    var time = stringTime.match(/([ПНВТСРЧБ]{2}) (\d\d):(\d\d)\+(\d)/);

    return Number(time[2]) * MINUTES_IN_HOURS +
            Number(time[3]) +
            minutesInDay(time[1]) -
            Number(time[4]) * MINUTES_IN_HOURS +
            mainTimezone * MINUTES_IN_HOURS;
}

function getGoodPeriods(badTime, likeTime) {
    var periods = [];
    for (var i = 0; i < badTime.length - 1; i ++) {
        var selectedPeriod = badTime[i + 1].from - badTime[i].to;
        if (selectedPeriod >= likeTime) {
            periods.push({
                from: badTime[i].to,
                to: badTime[i + 1].from
            });
        }
    }

    return periods;
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
