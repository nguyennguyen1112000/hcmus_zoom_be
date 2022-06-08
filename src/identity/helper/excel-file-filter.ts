/* eslint-disable prettier/prettier */
export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|png)$/)) {
    return callback(new Error('Only image file are allowed!'), false);
  }
  callback(null, true);
};
