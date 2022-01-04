import jwt from 'jsonwebtoken';

// gets if the user is authenticated by their JWT
// use callback because of async
export const isAuth = (token, callback) => {
  jwt.verify(token, process.env.REACT_APP_JWT_SECRET, (err, decoded) => {
    if (err) {
      callback({ success: false, data: err });
    } else {
      callback({ success: true, data: decoded});
    }
  });
};

// grabs a random element from the provided array
export const randomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const placeTexts = [
  'st',
  'nd',
  'rd',
  'th',
];

// returns element from placeTexts that matches place
export const getPlaceText = (place) => {
  return place % 100 < 11 || place % 100 > 13
    ? place % 10 === 1
      ? placeTexts[0] : place % 10 === 2
        ? placeTexts[1] : place % 10 === 3
          ? placeTexts[2] : placeTexts[3] : placeTexts[3];
};

// takes net ids and puts them in a string
export const getIdsText = (ids) => {
  let string = ids[0];
  if (ids.length === 2) {
    string += ` & ${ids[1]}`;
  } else {
    for (let i = 1; i < ids.length; i++) {
      if (i === ids.length - 1) {
        string += `, & ${ids[i]}`;
      } else {
        string += `, ${ids[i]}`;
      }
    }
  }
  return string;
};

// convert vw and vh dimensions to px
export const viewportToPixels = (value) => {
  const parts = value.match(/([0-9.]+)(vh|vw)/);
  const units = Number(parts[1]);
  const side = window[['innerHeight', 'innerWidth'][['vh', 'vw'].indexOf(parts[2])]];
  return side * (units / 100);
};

