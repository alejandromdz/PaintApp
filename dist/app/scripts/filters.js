"use strict";
function IdToUsername() {
    return function (id, participants) {
        var username;
        angular.forEach(participants, function (participantValue, participantKey) {
            if (participantValue._id == id)
                username = participantValue.username;
        });
        return username;
    };
}
exports.IdToUsername = IdToUsername;
