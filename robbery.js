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
    unionBadTimes(badPeriods);

    return badPeriods;
}

function unionBadTimes(badPeriods) {
    for (var i = 0; i < badPeriods.length - 1; i++) {
        if (badPeriods[i].to > badPeriods[i + 1].to) {
            badPeriods[i + 1] = badPeriods[i];
        } else if (badPeriods[i].to > badPeriods[i + 1].from &&
            badPeriods[i].to < badPeriods[i + 1].to) {
            badPeriods[i + 1] = {
                from: badPeriods[i].from,
                to: badPeriods[i + 1].to
            };
        }
    }
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
    //  Вернем большое количество,
    //  чтобы в дальнейшем не рассматривать, если не ПН, ВТ или СР
    if (GOOD_WEEK_DAYS.some(function (weekDay) {
        return weekDay === day;
    })) {
        return GOOD_WEEK_DAYS.indexOf(day) * MINUTES_IN_DAY;
    }

    return 4 * MINUTES_IN_DAY;
}

function getBadBankPeriods(workTime) {
    var badBankPeriods = [{ from: 0, to: MORNING_OF_THURSDAY }];

    for (var i = 0; i < 3; i++) {
        badBankPeriods[i].to = timeStringToMinutes(workTime.from) + i * MINUTES_IN_DAY;
        badBankPeriods.push({
            from: timeStringToMinutes(workTime.to) + i * MINUTES_IN_DAY,
            to: timeStringToMinutes(workTime.from) + (i + 1) * MINUTES_IN_DAY
        });
    }
    badBankPeriods[badBankPeriods.length - 1].to = MORNING_OF_THURSDAY;

    return badBankPeriods;
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

    return dayToMinutes(day) +
        timeStringToMinutes(time[0]) -
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
            from: minutesToTimeString(fromTo.from),
            to: minutesToTimeString(fromTo.to)
        };
        if (period.from.day === period.to.day) {
            formatResult.push(period);
        }
    });

    return formatResult;
}

function minutesToTimeString(allMinutes) {
    var day = Math.floor(allMinutes / (MINUTES_IN_DAY));
    var hours = Math.floor(allMinutes / MINUTES_IN_HOUR) -
            day * 24;
    var minutes = allMinutes -
        Math.floor(day) * (MINUTES_IN_DAY) -
        (hours) * MINUTES_IN_HOUR;

    return {
        day: GOOD_WEEK_DAYS[day],
        hours: formatTimeNumber(hours),
        minutes: formatTimeNumber(minutes)
    };
}

function formatTimeNumber(time) {
    if (time.toString().length === 1) {
        return '0' + time.toString();
    }

    return time.toString();
}
