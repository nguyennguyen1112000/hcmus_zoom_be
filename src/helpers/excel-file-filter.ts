/* eslint-disable prettier/prettier */
export const excelFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(xls|xlsx)$/)) {
    return callback(new Error('Only excel file are allowed!'), false);
  }
  callback(null, true);
};
