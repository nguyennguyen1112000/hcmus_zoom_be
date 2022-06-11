/* eslint-disable prettier/prettier */
export const assignPartialsToThis = (
  _this: { [key: string]: any },
  partials: Partial<{ [key: string]: any }>,
) => {
  for (const key in partials) {
    if (partials[key] != null) {
      _this[key] = partials[key];
    }
  }
};

export const generateProctorCode = () => {
  const chars = '0123456789';
  const codeLength = 4;
  let code = '';
  for (let i = 0; i < codeLength; i++) {
    const randomNumber = Math.floor(Math.random() * chars.length);
    code += chars.substring(randomNumber, randomNumber + 1);
  }
  return code;
};

export const formatDate = (date) => {
  date.setTime(date.getTime() + 7 * 60 * 60 * 1000);
  const day = ('0' + date.getDate()).slice(-2);
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const year = ('0' + date.getFullYear()).slice(-4);
  return `${day}/${month}/${year}`;
};


