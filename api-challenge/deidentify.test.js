const deidentify = require('./deidentify');

test('DOB are converted to age in years', () => {
    const input = { birthDate: '1930-08-25'};
    const output = { age: '89' };
    expect(deidentify(input)).toEqual(output);
});

test('Ages greater than 89 years are categorized as 90+', () => {
    const input = { birthDate: '1929-08-25'};
    const output = { age: '90+' };
    expect(deidentify(input)).toEqual(output);
});

test('Admission and Discharge dates are truncated to year', () => {
    const input = { admissionDate: '05/04/2020' };
    const output = {admissionYear: '2020'};

    expect(deidentify(input)).toEqual(output);
});

test('NANP telephone numbers are redacted', () => {
    const input = `The patient presented with a rotary cell phone that rings when you dial 1-610-558-2968, however 
a label was applied to the front of the phone that read: (484)-575-1349.`;

    const output = `The patient presented with a rotary cell phone that rings when you dial <redacted phone number>, however 
a label was applied to the front of the phone that read: <redacted phone number>.`;

    expect(deidentify(input)).toEqual(output);
});

test('SSN are redacted', () => {
    const input = 'You never know where 690-12-9658 social security numbers can show up in a string 574-48-8395';
    const output = 'You never know where XXX-XX-XXXX social security numbers can show up in a string XXX-XX-XXXX';

    expect(deidentify(input)).toEqual(output);
});

test('Email addresses are redacted', () => {
    let input = 'The patient presented with an reallyold@aol.com email address and dial-up internet. Spouse had a@a.com.';
    let output = 'The patient presented with an <redacted email> email address and dial-up internet. Spouse had <redacted email>.';

    expect(deidentify(input)).toEqual(output);
});

test('Dates are truncated to year', () => {
    let input = '01/24/1989 some text 01/24/1985';
    let output = '1989 some text 1985';
    expect(deidentify(input)).toEqual(output);

    input = '01-24-1989 some text 01-24-1985';
    output = '1989 some text 1985';
    expect(deidentify(input)).toEqual(output);

    // TODO: support more date formats
});

test('High-population (>20,000) zipcodes are stripped to the first three digits', () => {
    let input = {zipCode: 19129};
    let output = {zipCode: '19100'};
    expect(deidentify(input)).toEqual(output);

    input = {zipCode: '19129'}; // supports string input
    output = {zipCode: '19100'};
    expect(deidentify(input)).toEqual(output);
});

test('Low-population (<20,000) zipcodes are replaced with 00000', () => {
    let input = {zipCode: 55601};
    let output = {zipCode: '00000'};
    expect(deidentify(input)).toEqual(output);

    input = {zipCode: '55601'}; // supports string input
    output = {zipCode: '00000'};
    expect(deidentify(input)).toEqual(output);
});


test('Conforms to API specification', () => {
    const input = {
        "birthDate": "2000-01-01",
        "zipCode": "10013",
        "admissionDate": "2019-03-12",
        "dischargeDate": "2019-03-14",
        "notes": "Patient with ssn 123-45-6789 previously presented under different ssn"
    };

    const output = {
        "age": "20",
        "zipCode": "10000",
        "admissionYear": "2019",
        "dischargeYear": "2019",
        "notes": "Patient with ssn XXX-XX-XXXX previously presented under different ssn"
    };

    expect(deidentify(input)).toEqual(output);
});
