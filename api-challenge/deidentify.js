'use strict';

const moment = require('moment');
const { findNumbers } = require('libphonenumber-js');

// There are far fewer zipcodes that should be fully redacted, however, new zip codes are created from time to time
// so it is best to treat any unknown zipcodes as fully-redactable.
const highPopulationZipcodes = require('./zipcode_populations');

// TODO: To match more date formats, there's a package: https://github.com/wanasit/chrono
// TODO: moment.js may not be the best generic date parser, but it (and luxon) are good for date maths
// TODO: This won't work when two dates are next to each other, we really need a coarse number parser or proper entity
// extraction
const DATE_RE = /(\d{1,4}([.\-/])\d{1,2}([.\-/])\d{1,4})/g;

const SSN_RE = /((?!000)(?!666)(?:[0-6]\d{2}|7[0-2][0-9]|73[0-3]|7[5-6][0-9]|77[0-2]))-((?!00)\d{2})-((?!0000)\d{4})/gi;

const EMAIL_RE = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/gi;

module.exports = function deidentify(obj) {
    const output = {};

    if (typeof obj === 'string') return deidentifyString(obj);

    const {zipCode, birthDate, admissionDate, dischargeDate, notes} = obj;

    if (zipCode) {
        const prefix = zipCode.toString().substr(0,3);
        const isHighPop = highPopulationZipcodes[prefix] === 1;
        output.zipCode = isHighPop ? `${prefix}00` : '00000';
    }

    if (birthDate) {
        const dob = moment.utc(new Date(birthDate));
        let age = moment().diff(dob, 'years');
        if (age > 89) age = '90+';
        output.age = age.toString();
    }

    if (admissionDate) {
        const admissionYear = moment.utc(new Date(admissionDate)).year();
        output.admissionYear = admissionYear.toString();
    }

    if (dischargeDate) {
        const dischargeYear = moment.utc(new Date(dischargeDate)).year();
        output.dischargeYear = dischargeYear.toString();
    }

    if (notes) {
        const deidentifiedNotes = deidentifyString(notes);
        output.notes = deidentifiedNotes;
    }

    return output;
};

function deidentifyString(str) {
    let outputStr = str;

    const dates = str.match(DATE_RE) || [];
    const phoneNumbers = findNumbers(str, 'US') || [];

    dates.forEach(oldValue => {
        let newValue = deidentifyDate(oldValue);
        if (oldValue === newValue) return; // no-op on invalid date
        outputStr = outputStr.replace(oldValue, newValue);
    });

    phoneNumbers.forEach(phoneNumber => {
        const phoneStr = str.slice(phoneNumber.startsAt, phoneNumber.endsAt);
        outputStr = outputStr.replace(phoneStr, '<redacted phone number>');
    });

    outputStr = outputStr.replace(EMAIL_RE, '<redacted email>');

    // TODO: we should be able to run a coarse regex to extract all numeric types and then break it into specific types
    // this will be required for proper handling of all entity types in close proximity to one another
    outputStr = outputStr.replace(SSN_RE, 'XXX-XX-XXXX');

    return outputStr;
}

function deidentifyDate(datestr) {
    // TODO: more robust date parsing
    const date = moment(new Date(datestr));
    return date.isValid() ? date.year() : datestr;
}
