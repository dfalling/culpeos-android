/**
 * @format
 */

import {metadataRows} from '../src/map/metadataRows';

const titles = (rows: ReturnType<typeof metadataRows>) =>
  rows.map(row => `${row.title}: ${row.value}`);

test('an element with no metadata has no rows', () => {
  expect(metadataRows(null)).toEqual([]);
  expect(metadataRows(undefined)).toEqual([]);
  expect(metadataRows({})).toEqual([]);
});

test('rows read in booking order, not the order the fields arrived', () => {
  expect(
    titles(
      metadataRows({
        seat: '14C',
        arrivalLocation: 'Barcelona',
        number: 'IB3216',
        departureLocation: 'Madrid',
        reservation: 'XY7ZQ2',
      }),
    ),
  ).toEqual([
    'Number: IB3216',
    'From: Madrid',
    'To: Barcelona',
    'Reservation: XY7ZQ2',
    'Seat: 14C',
  ]);
});

test('the kind of transportation titles the number', () => {
  expect(titles(metadataRows({type: 'flight', number: 'IB3216'}))).toEqual([
    'Flight: IB3216',
  ]);
  expect(titles(metadataRows({type: 'train', number: 'AVE 3092'}))).toEqual([
    'Train: AVE 3092',
  ]);
  expect(titles(metadataRows({type: 'ferry', number: '7'}))).toEqual([
    'Ferry: 7',
  ]);
});

test('a kind with no name of its own keeps the generic title', () => {
  expect(titles(metadataRows({type: 'car', number: 'ABC123'}))).toEqual([
    'Number: ABC123',
  ]);
  expect(titles(metadataRows({number: 'ABC123'}))).toEqual(['Number: ABC123']);
});

test('type alone is never a row of its own', () => {
  expect(metadataRows({type: 'flight'})).toEqual([]);
});

test('a flight number links to its status, other numbers do not', () => {
  const [flight] = metadataRows({type: 'flight', number: 'American 291'});
  expect(flight.link).toBe(
    'https://www.google.com/search?q=American%20291%20flight%20status',
  );

  const [train] = metadataRows({type: 'train', number: 'AVE 3092'});
  expect(train.link).toBeNull();
});

test('the raw address only shows when there is no geocoded location', () => {
  const metadata = {address: '12 Gran Via, Madrid'};
  expect(titles(metadataRows(metadata, {hasLocation: false}))).toEqual([
    'Address: 12 Gran Via, Madrid',
  ]);
  expect(metadataRows(metadata, {hasLocation: true})).toEqual([]);
});

test('a location does not suppress the other rows', () => {
  expect(
    titles(
      metadataRows(
        {reservation: 'XY7ZQ2', address: '12 Gran Via, Madrid'},
        {hasLocation: true},
      ),
    ),
  ).toEqual(['Reservation: XY7ZQ2']);
});

test('blank and whitespace-only values are skipped, and values are trimmed', () => {
  expect(
    titles(
      metadataRows({
        number: '  IB3216 ',
        seat: '',
        reservation: '   ',
        paymentDetails: null,
      }),
    ),
  ).toEqual(['Number: IB3216']);
});

test('payment notes are titled Payment', () => {
  expect(titles(metadataRows({paymentDetails: 'Paid €100'}))).toEqual([
    'Payment: Paid €100',
  ]);
});
