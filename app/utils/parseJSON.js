module.exports = (jsonObjs) => {
  return jsonObjs.map((obj) => {
    const parsedObj = Object.assign({}, obj);
    for (const key of Object.keys(parsedObj)) {
      try {
        const parsedField = JSON.parse(parsedObj[key]);
        parsedObj[key] = parsedField;
      // eslint-disable-next-line
      } catch (err) {
      }
    }
    return parsedObj;
  });
};
