'use strict';
var GOODDAYS = [
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

    var formatResult = [];
    if (isValidInput(workingHours, schedule)) {
        var mainTimeFormat = Number(workingHours.from.match(/\+(\d+)/)[1]);
        var badTimes = getBadTime(schedule, mainTimeFormat, workingHours);
        var goodTime = getGoodTime(badTimes, duration, mainTimeFormat);
        formatResult = getFormatResult(goodTime);
    }

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

//Собираем все время, не подходящее для ограбления 
function getBadTime(schedule, mainFormat, workTime) {
    var badTimes = getBadTimesOfPerson(schedule);
    var badWorkTimes = getBadWorkTimesOfDays(workTime, mainFormat);

    //Сложим их вместе и отсортируем
    badWorkTimes.forEach(function (time) {
        badTimes.push(time);
    });
    badTimes.sort(function (a, b) {

        return a[0] - b[0];
    });

    return badTimes;
}

//Неудачное время исходя из занятости персонажей
function getBadTimesOfPerson(schedule) {
    var times = [];
    for (var person in schedule) {
        if (!schedule.hasOwnProperty(person)) {
            return times;
        }
        schedule[person].forEach(function (time) {
            //Вычисли отрезки времени от a до b в минутах: [a, b]
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

//Проверка положительный часовой пояс
function isValidInput(bankTime, schedule) {
    if (bankTime.from.split('+').length === 1) {
        return false;
    }
    var result = true;
    for (var person in schedule) {
        if (!schedule.hasOwnProperty(person)) {
            return false;
        }
        schedule[person].forEach(function (time) {
            if (time.from.split('+').length === 1) {
                result = false;
            }
        });
    }

    return result;
}

//Перевод из ПН и пр. в минуты
function minutesInDay(day) {
    var result = 4 * 24 * 60;
    GOODDAYS.forEach(function (dayWeek) {
        if (dayWeek.toString === day) {
            result = dayWeek.coeff * 24 * 60;
        }
    });

    return result;
}

//Все то же самое, но с временем банка
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
        if (period[0] < 3 * 24 * 60 &&
            period[1] < 3 * 24 * 60) {
            time.push(period);
        }
    }
    var badTime = [
        [0, time[0][0]],
        [time[0][1], time[1][0] - 1],
        [time[1][1], time[2][0] - 1],
        [time[2][1], 4319]
    ];

    return badTime;
}

//Нахоим промежутки, куда влезит наше время на ограбление
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

//Переводим полученные интервалы для ограбления в удобный вид
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
        if (period.from.day === period.to.day) {
            formatResult.push(period);
        }
    });

    return formatResult;
}

//кол. дней в день недели
function dayString(day) {
    var dayToString = '';
    GOODDAYS.forEach(function (dayWeek) {
        if (dayWeek.coeff === day) {
            dayToString = dayWeek.toString;
        }
    });

    return dayToString;
}

//кол. времени в правильную строку
function timeString(time) {
    if (time.toString().length === 1) {
        return '0' + time.toString();
    }

    return time.toString();
}
