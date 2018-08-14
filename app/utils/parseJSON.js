module.exports = (jsonObjs) => {
  return jsonObjs.map((obj) => {
    return Array.from(obj);
  });
};
