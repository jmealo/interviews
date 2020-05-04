const ZIPCODE_PREFIX_POP_CUTOFF = parseInt(process.env.ZIPCODE_PREFIX_POP_CUTOFF || 20000, 10);

const deidentify = require('../deidentify');

const prefixPopulations = require('fs')
    .readFileSync('population_by_zcta_2010.csv', 'utf-8')
    .split('\n')
    .map(line => {
        let col = line.split(',');
        return {
            zipcode: col[0],
            population: parseInt(col[1], 10)
        }
    }).reduce(function(popCount, record) {
        const {zipcode, population} = record;
        let prefix = zipcode.substr(0, 3);

        if (!/[0-9]/.test(prefix)) return popCount; // ignore header/empty lines

        if (!popCount[prefix]) {
            popCount[prefix] = population;
        } else {
            popCount[prefix] += population;
        }

        return popCount;
    }, {});

const disallowedPrefixes = Object
    .keys(prefixPopulations)
    .filter(prefix => prefixPopulations[prefix] < ZIPCODE_PREFIX_POP_CUTOFF)
    .reduce((lookupObj, highPopZipcode) => {
        lookupObj[highPopZipcode] = 1;
        return lookupObj;
    }, {});

console.log(JSON.stringify(disallowedPrefixes));
